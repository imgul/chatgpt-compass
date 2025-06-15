// Background service worker for the Chrome extension
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  // Open the sidepanel when the extension icon is clicked
  if (tab.id && tab.windowId) {
    chrome.sidePanel.open({ 
      tabId: tab.id,
      windowId: tab.windowId 
    });
  }
});

// Optional: Set the sidepanel to be available on all sites
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
}); 