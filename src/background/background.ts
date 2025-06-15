// Background service worker for ChatGPT Compass
interface MessageData {
  id: string;
  content: string;
  timestamp: number;
  turnIndex: number;
}

// Store user messages per tab
const tabMessages = new Map<number, MessageData[]>();

chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  // Open the sidepanel when the extension icon is clicked
  if (tab.id && tab.windowId) {
    chrome.sidePanel.open({ 
      tabId: tab.id,
      windowId: tab.windowId 
    });
  }
});

// Set the sidepanel to be available only on ChatGPT sites
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: false
  });
});

// Enable sidepanel only on ChatGPT domains
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isChatGPT = tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com');
    
    chrome.sidePanel.setOptions({
      tabId: tabId,
      enabled: isChatGPT
    });
  }
});

// Handle messages from content script and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'USER_MESSAGES_UPDATED':
      // Store messages from content script
      if (tabId && message.messages) {
        tabMessages.set(tabId, message.messages);
        console.log('Background: Stored', message.messages.length, 'messages for tab', tabId);
        
        // Forward to sidepanel if it's open
        forwardToSidepanel(tabId, {
          type: 'MESSAGES_UPDATED',
          messages: message.messages
        });
      }
      break;

    case 'GET_MESSAGES_FROM_BACKGROUND':
      // Sidepanel requesting messages
      if (tabId) {
        const messages = tabMessages.get(tabId) || [];
        sendResponse({ messages });
      } else {
        // If no tabId, get messages from current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const messages = tabMessages.get(tabs[0].id) || [];
            sendResponse({ messages });
          }
        });
        return true; // Indicates we will respond asynchronously
      }
      break;

    case 'NAVIGATE_TO_MESSAGE':
      // Forward navigation request to content script
      if (message.messageId) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'SCROLL_TO_MESSAGE',
              messageId: message.messageId
            });
          }
        });
      }
      break;

    case 'REFRESH_MESSAGES':
      // Request fresh messages from content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'GET_USER_MESSAGES'
          }, (response) => {
            if (response && response.messages) {
              tabMessages.set(tabs[0].id!, response.messages);
              forwardToSidepanel(tabs[0].id!, {
                type: 'MESSAGES_UPDATED',
                messages: response.messages
              });
            }
          });
        }
      });
      break;
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabMessages.delete(tabId);
});

// Helper function to forward messages to sidepanel
function forwardToSidepanel(tabId: number, message: any) {
  // Note: Direct communication to sidepanel is limited
  // The sidepanel will poll for updates or use storage
  chrome.storage.local.set({
    [`messages_${tabId}`]: message
  });
} 