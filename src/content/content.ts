// Content script for extracting user messages from ChatGPT
interface UserMessage {
  id: string;
  content: string;
  timestamp: number;
  element: HTMLElement;
  turnIndex: number;
}

class ChatGPTMessageExtractor {
  private userMessages: UserMessage[] = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Initial extraction
    this.extractUserMessages();
    
    // Set up mutation observer to watch for new messages
    this.setupObserver();
    
    // Listen for messages from sidepanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_USER_MESSAGES') {
        this.extractUserMessages();
        sendResponse({ messages: this.userMessages });
      } else if (message.type === 'SCROLL_TO_MESSAGE') {
        this.scrollToMessage(message.messageId);
        sendResponse({ success: true });
      }
    });

    // Send initial messages to sidepanel
    setTimeout(() => {
      this.sendMessagesToSidepanel();
    }, 1000);
  }

  private extractUserMessages() {
    // Find all user message containers using the h5.sr-only selector
    const userMessageElements = document.querySelectorAll('h5.sr-only');
    const messages: UserMessage[] = [];

    userMessageElements.forEach((h5Element) => {
      if (h5Element.textContent?.trim() === 'You said:') {
        const article = h5Element.closest('article');
        if (article) {
          const messageContent = this.extractMessageContent(article);
          const turnIndex = this.extractTurnIndex(article);
          
          if (messageContent) {
            const message: UserMessage = {
              id: this.generateMessageId(article, turnIndex),
              content: messageContent,
              timestamp: Date.now(),
              element: article as HTMLElement,
              turnIndex: turnIndex
            };
            messages.push(message);
          }
        }
      }
    });

    // Sort messages by their position in the DOM (conversation order)
    messages.sort((a, b) => a.turnIndex - b.turnIndex);
    
    this.userMessages = messages;
    console.log('ChatGPT Compass: Extracted', messages.length, 'user messages');
  }

  private extractMessageContent(article: Element): string {
    // Find the message content within the whitespace-pre-wrap div
    const contentDiv = article.querySelector('.whitespace-pre-wrap');
    return contentDiv?.textContent?.trim() || '';
  }

  private extractTurnIndex(article: Element): number {
    // Extract turn index from data-testid attribute
    const testId = article.getAttribute('data-testid');
    if (testId && testId.startsWith('conversation-turn-')) {
      const turnNumber = testId.replace('conversation-turn-', '');
      return parseInt(turnNumber, 10) || 0;
    }
    return 0;
  }

  private generateMessageId(article: Element, turnIndex: number): string {
    // Generate a unique ID for the message
    const messageId = article.getAttribute('data-message-id');
    if (messageId) {
      return messageId;
    }
    return `user-message-${turnIndex}-${Date.now()}`;
  }

  private scrollToMessage(messageId: string) {
    const message = this.userMessages.find(msg => msg.id === messageId);
    if (message && message.element) {
      // Scroll to the message with smooth behavior
      message.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the message briefly
      this.highlightMessage(message.element);
    }
  }

  private highlightMessage(element: HTMLElement) {
    // Add a temporary highlight effect
    const originalStyle = element.style.cssText;
    element.style.outline = '3px solid #10B981';
    element.style.outlineOffset = '4px';
    element.style.borderRadius = '12px';
    element.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 2000);
  }

  private setupObserver() {
    // Watch for changes in the conversation area
    const targetNode = document.body;
    
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // Check if new nodes were added that might contain user messages
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added node contains user messages
              if (element.querySelector && 
                  (element.querySelector('h5.sr-only') || 
                   element.closest('article'))) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        // Debounce the update
        setTimeout(() => {
          this.extractUserMessages();
          this.sendMessagesToSidepanel();
        }, 500);
      }
    });

    this.observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  private sendMessagesToSidepanel() {
    // Send messages to background script which will forward to sidepanel
    chrome.runtime.sendMessage({
      type: 'USER_MESSAGES_UPDATED',
      messages: this.userMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        turnIndex: msg.turnIndex
      }))
    });
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize the message extractor when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChatGPTMessageExtractor();
  });
} else {
  new ChatGPTMessageExtractor();
}

// Handle page navigation in single-page apps
let currentUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    // Re-initialize when URL changes
    setTimeout(() => {
      new ChatGPTMessageExtractor();
    }, 1000);
  }
});

observer.observe(document, { subtree: true, childList: true }); 