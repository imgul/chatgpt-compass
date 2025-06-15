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
  if (!tab.id || !tab.url) {
    console.log('ChatGPT Compass: No tab ID or URL available');
    return;
  }

  // Check if current tab is a ChatGPT page
  const isChatGPT = tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com');
  
  if (!isChatGPT) {
    // If not on ChatGPT, show a notification and redirect
    console.log('ChatGPT Compass: Not on ChatGPT page, current URL:', tab.url);
    showRedirectNotification();
    // Immediately redirect to ChatGPT
    chrome.tabs.update(tab.id, { url: 'https://chatgpt.com/' });
    return;
  }

  // For ChatGPT pages, open sidepanel immediately within user gesture
  try {
    // Ensure sidepanel is enabled for this tab first
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: true
    }, () => {
      // After enabling, open the sidepanel
      if (tab.windowId) {
        chrome.sidePanel.open({ 
          tabId: tab.id,
          windowId: tab.windowId 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('ChatGPT Compass: Error opening sidepanel:', chrome.runtime.lastError.message);
            // Try fallback without windowId
            chrome.sidePanel.open({ tabId: tab.id! }, () => {
              if (chrome.runtime.lastError) {
                console.error('ChatGPT Compass: Fallback also failed:', chrome.runtime.lastError.message);
              } else {
                console.log('ChatGPT Compass: Sidepanel opened via fallback for tab', tab.id);
              }
            });
          } else {
            console.log('ChatGPT Compass: Sidepanel opened for tab', tab.id);
          }
        });
      } else {
        // No windowId available, try direct approach
        chrome.sidePanel.open({ tabId: tab.id! }, () => {
          if (chrome.runtime.lastError) {
            console.error('ChatGPT Compass: Error opening sidepanel (no windowId):', chrome.runtime.lastError.message);
          } else {
            console.log('ChatGPT Compass: Sidepanel opened (no windowId) for tab', tab.id);
          }
        });
      }
    });
  } catch (error) {
    console.error('ChatGPT Compass: Synchronous error:', error);
  }
});

// Helper function to show redirect notification
function showRedirectNotification(): void {
  try {
    // Create a simple notification
    const notificationId = `chatgpt-compass-${Date.now()}`;
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ChatGPT Compass',
      message: 'Redirecting to ChatGPT where this extension works best.',
      buttons: [{ title: 'OK' }]
    }, () => {
      if (chrome.runtime.lastError) {
        console.log('ChatGPT Compass: Notifications not available:', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.log('ChatGPT Compass: Error creating notification:', error);
  }
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('chatgpt-compass-')) {
    if (buttonIndex === 0) { // Go to ChatGPT button
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: 'https://chatgpt.com/' });
        }
      });
    }
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification clicks (click on notification body)
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('chatgpt-compass-')) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url: 'https://chatgpt.com/' });
      }
    });
    chrome.notifications.clear(notificationId);
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
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('ChatGPT Compass: Error setting sidepanel options:', chrome.runtime.lastError.message);
      } else if (isChatGPT) {
        console.log('ChatGPT Compass: Enabled sidepanel for ChatGPT tab', tabId);
      }
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