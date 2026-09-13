(function () {
  const container = document.getElementById("emoji-list");
  const searchInput = document.getElementById("popup-search");
  if (!container || typeof EMOJI_GROUPS === "undefined") return;

  function render(query) {
    container.innerHTML = "";
    let any = false;
    const q = (query || "").trim().toLowerCase();

    EMOJI_GROUPS.forEach((group) => {
      const filtered = q
        ? group.emojis.filter(
            (e) =>
              e.toLowerCase().includes(q) ||
              group.name.toLowerCase().includes(q)
          )
        : group.emojis;

      if (filtered.length === 0) return;
      any = true;

      const groupEl = document.createElement("div");
      groupEl.className = "group";

      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.name;
      groupEl.appendChild(title);

      const row = document.createElement("div");
      row.className = "emoji-row";

      filtered.forEach((emoji) => {
        const span = document.createElement("span");
        span.className = "emoji";
        span.textContent = emoji;
        span.title = "Click to copy";
        span.addEventListener("click", () => {
          navigator.clipboard.writeText(emoji).then(() => {
            span.style.background = "#1a2a1a";
            setTimeout(() => {
              span.style.background = "";
            }, 400);
          }).catch(() => {});
        });
        row.appendChild(span);
      });

      groupEl.appendChild(row);
      container.appendChild(groupEl);
    });

    if (!any) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No matches";
      container.appendChild(empty);
    }
  }

  searchInput.addEventListener("input", (e) => {
    render(e.target.value);
  });

  render("");
})();
