(function () {
  if (window.__textEmojiLoaded) return;
  window.__textEmojiLoaded = true;

  // EMOJI_GROUPS comes from textemojis.js

  let menu = null;
  let lastSelectionRange = null;
  let keyHandler = null;
  let clickOutsideHandler = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showEmojiMenu") {
      showMenu();
      sendResponse({ ok: true });
    }
    return true;
  });

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastSelectionRange = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreAndInsert(text) {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      const value = active.value;
      active.value = value.slice(0, start) + text + value.slice(end);
      active.selectionStart = active.selectionEnd = start + text.length;
      active.focus();
      active.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    if (lastSelectionRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(lastSelectionRange);
      const success = document.execCommand("insertText", false, text);
      if (!success) {
        lastSelectionRange.deleteContents();
        const textNode = document.createTextNode(text);
        lastSelectionRange.insertNode(textNode);
        lastSelectionRange.setStartAfter(textNode);
        lastSelectionRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(lastSelectionRange);
      }
    } else {
      document.execCommand("insertText", false, text);
    }
  }

  function getCaretRect() {
    const active = document.activeElement;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rects = range.getClientRects();
      if (rects.length > 0) return rects[0];
      const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
      if (parent && parent.getBoundingClientRect) {
        return parent.getBoundingClientRect();
      }
    }
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      const rect = active.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.top + 20,
        left: rect.left + 8,
        right: rect.left + 40,
        width: 20,
        height: 18
      };
    }
    return {
      top: window.innerHeight / 2,
      bottom: window.innerHeight / 2 + 20,
      left: window.innerWidth / 2 - 160,
      right: window.innerWidth / 2,
      width: 20,
      height: 18
    };
  }

  function showMenu() {
    saveSelection();
    hideMenu();

    const caret = getCaretRect();

    menu = document.createElement("div");
    menu.id = "text-emoji-menu";

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.id = "text-emoji-close";
    closeBtn.title = "Close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", hideMenu);
    menu.appendChild(closeBtn);

    // Search
    const searchWrap = document.createElement("div");
    searchWrap.id = "text-emoji-search";
    searchWrap.innerHTML = `<input type="text" placeholder="Search..." id="te-search-input" autocomplete="off">`;
    menu.appendChild(searchWrap);

    // Body
    const body = document.createElement("div");
    body.id = "text-emoji-body";
    menu.appendChild(body);

    document.body.appendChild(menu);

    renderGroups(body, "");

    // Position above caret
    const menuRect = menu.getBoundingClientRect();
    const gap = 8;
    let top = caret.top - menuRect.height - gap;
    let left = caret.left;
    if (top < 8) top = caret.bottom + gap;
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - menuRect.width - 8;
    }
    if (left < 8) left = 8;
    menu.style.top = Math.round(top) + "px";
    menu.style.left = Math.round(left) + "px";

    // Search handler
    const searchInput = document.getElementById("te-search-input");
    searchInput.addEventListener("input", (e) => {
      renderGroups(body, e.target.value.trim().toLowerCase());
    });

    // Escape
    keyHandler = (e) => {
      if (e.key === "Escape") hideMenu();
    };
    document.addEventListener("keydown", keyHandler);

    // Click outside
    clickOutsideHandler = (e) => {
      if (menu && !menu.contains(e.target)) hideMenu();
    };
    setTimeout(() => {
      document.addEventListener("mousedown", clickOutsideHandler);
    }, 10);

    setTimeout(() => searchInput.focus(), 30);
  }

  function renderGroups(container, query) {
    container.innerHTML = "";
    let anyVisible = false;

    EMOJI_GROUPS.forEach((group) => {
      const filtered = query
        ? group.emojis.filter(
            (e) =>
              e.toLowerCase().includes(query) ||
              group.name.toLowerCase().includes(query)
          )
        : group.emojis;

      if (filtered.length === 0) return;
      anyVisible = true;

      const groupEl = document.createElement("div");
      groupEl.className = "te-group";

      const title = document.createElement("div");
      title.className = "te-group-title";
      title.textContent = group.name;
      groupEl.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "te-emoji-grid";

      filtered.forEach((emoji) => {
        const btn = document.createElement("button");
        btn.className = "te-emoji-btn";
        btn.textContent = emoji;
        btn.title = emoji;
        btn.addEventListener("click", () => {
          restoreAndInsert(emoji);
          hideMenu();
        });
        grid.appendChild(btn);
      });

      groupEl.appendChild(grid);
      container.appendChild(groupEl);
    });

    if (!anyVisible) {
      const empty = document.createElement("div");
      empty.className = "te-empty";
      empty.textContent = "No matches";
      container.appendChild(empty);
    }
  }

  function hideMenu() {
    if (menu && menu.parentNode) {
      menu.parentNode.removeChild(menu);
    }
    menu = null;
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (clickOutsideHandler) {
      document.removeEventListener("mousedown", clickOutsideHandler);
      clickOutsideHandler = null;
    }
  }
})();
