// Create / update the context menu item
chrome.runtime.onInstalled.addListener(() => {
  // Remove any previous version first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "text-emoji",
      title: "Text emoji",
      contexts: ["editable"]   // shows in inputs, textareas & contenteditable even without selection
    });
  });
});

// Also recreate on browser startup (in case of updates)
chrome.runtime.onStartup.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "text-emoji",
      title: "Text emoji",
      contexts: ["editable"]
    });
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "text-emoji" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "showEmojiMenu"
    }).catch(() => {
      // Content script not ready → inject it
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["textemojis.js", "content.js"]
      }).then(() => {
        return chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["menu.css"]
        });
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showEmojiMenu"
        });
      }).catch(err => console.error("Text Emoji injection failed:", err));
    });
  }
});
