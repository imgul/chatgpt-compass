// Content script for extracting user messages from ChatGPT
import { CONFIG } from '../config/config';

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
  private highlightTimeout: NodeJS.Timeout | null = null;

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
    }
  }

  private removeCurrentHighlight() {
    if (this.currentHighlightedElement) {
      // Remove the animated border classes
      this.currentHighlightedElement.classList.remove('chatgpt-compass-highlight');
      this.currentHighlightedElement = null;
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }
  }

  private highlightMessage(element: HTMLElement) {
    // Find the specific message container within the article
    const messageContainer = element.querySelector('.relative.max-w-\\[var\\(--user-chat-width\\,70\\%\\)\\].bg-token-message-surface.rounded-3xl');
    
    if (messageContainer) {
      // Add animated AI-inspired border effect to the specific message container
      this.addHighlightStyles();
      messageContainer.classList.add('chatgpt-compass-highlight');
      this.currentHighlightedElement = messageContainer as HTMLElement;
    } else {
      // Fallback to the original element if the specific container is not found
      this.addHighlightStyles();
      element.classList.add('chatgpt-compass-highlight');
      this.currentHighlightedElement = element;
    }
    
    // Set timeout to remove highlight after configured duration
    this.highlightTimeout = setTimeout(() => {
      this.removeCurrentHighlight();
    }, CONFIG.HIGHLIGHT_DURATION_SECONDS * 1000);
  }

  private addHighlightStyles() {
    // Add the animated highlight styles to the page if not already added
    if (!document.getElementById('chatgpt-compass-styles')) {
      const style = document.createElement('style');
      style.id = 'chatgpt-compass-styles';
      style.textContent = `
        .chatgpt-compass-highlight {
          position: relative;
          border: 3px solid transparent !important;
          background-image: 
            linear-gradient(var(--bg-token-message-surface, #f0f0f0), var(--bg-token-message-surface, #f0f0f0)),
            linear-gradient(
              45deg,
              #1a1a2e,
              #16213e,
              #0f3460,
              #e94560,
              #f38ba8,
              #a6e3a1,
              #94e2d5,
              #89dceb,
              #74c7ec,
              #7287fd,
              #c6a0f6,
              #eba0ac
            ) !important;
          background-size: 100% 100%, 400% 400% !important;
          background-origin: padding-box, border-box !important;
          background-clip: padding-box, border-box !important;
          animation: chatgpt-compass-glow ${CONFIG.ANIMATION_SPEED_MS}ms linear infinite !important;
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
          border-radius: inherit;
          background: linear-gradient(
            -45deg,
            rgba(233, 69, 96, 0.3),
            rgba(243, 139, 168, 0.2),
            rgba(166, 227, 161, 0.3),
            rgba(148, 226, 213, 0.2),
            rgba(137, 220, 235, 0.3),
            rgba(116, 199, 236, 0.2),
            rgba(114, 135, 253, 0.3),
            rgba(198, 160, 246, 0.2)
          );
          background-size: 200% 200%;
          animation: chatgpt-compass-pulse ${CONFIG.PULSE_SPEED_MS}ms ease-in-out infinite alternate;
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