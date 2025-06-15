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
  private currentHighlightedElement: HTMLElement | null = null;

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
      // Scroll to the top of the message with smooth behavior
      message.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // Remove previous highlight before adding new one
      this.removeCurrentHighlight();
      
      // Highlight the message with animated AI colors
      this.highlightMessage(message.element);
      this.currentHighlightedElement = message.element;
    }
  }

  private removeCurrentHighlight() {
    if (this.currentHighlightedElement) {
      // Remove the animated border classes
      this.currentHighlightedElement.classList.remove('chatgpt-compass-highlight');
      this.currentHighlightedElement = null;
    }
  }

  private highlightMessage(element: HTMLElement) {
    // Add animated AI-inspired border effect
    this.addHighlightStyles();
    element.classList.add('chatgpt-compass-highlight');
  }

  private addHighlightStyles() {
    // Add the animated highlight styles to the page if not already added
    if (!document.getElementById('chatgpt-compass-styles')) {
      const style = document.createElement('style');
      style.id = 'chatgpt-compass-styles';
      style.textContent = `
        .chatgpt-compass-highlight {
          position: relative;
          border-radius: 12px !important;
        }
        
        .chatgpt-compass-highlight::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 15px;
          background: linear-gradient(
            45deg,
            #ff6b6b,
            #4ecdc4,
            #45b7d1,
            #96ceb4,
            #ffeaa7,
            #dda0dd,
            #98d8c8,
            #f7dc6f,
            #bb8fce,
            #85c1e9
          );
          background-size: 400% 400%;
          animation: chatgpt-compass-glow 3s linear infinite;
          z-index: -1;
          pointer-events: none;
        }
        
        @keyframes chatgpt-compass-glow {
          0% {
            background-position: 0% 50%;
            filter: hue-rotate(0deg) brightness(1.2);
          }
          25% {
            background-position: 100% 50%;
            filter: hue-rotate(90deg) brightness(1.4);
          }
          50% {
            background-position: 100% 100%;
            filter: hue-rotate(180deg) brightness(1.2);
          }
          75% {
            background-position: 0% 100%;
            filter: hue-rotate(270deg) brightness(1.4);
          }
          100% {
            background-position: 0% 50%;
            filter: hue-rotate(360deg) brightness(1.2);
          }
        }
        
        .chatgpt-compass-highlight::after {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(
            -45deg,
            rgba(255, 107, 107, 0.3),
            rgba(78, 205, 196, 0.3),
            rgba(69, 183, 209, 0.3),
            rgba(150, 206, 180, 0.3)
          );
          border-radius: 13px;
          animation: chatgpt-compass-pulse 2s ease-in-out infinite alternate;
          z-index: -1;
          pointer-events: none;
        }
        
        @keyframes chatgpt-compass-pulse {
          0% {
            opacity: 0.4;
            transform: scale(1);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `;
      document.head.appendChild(style);
    }
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