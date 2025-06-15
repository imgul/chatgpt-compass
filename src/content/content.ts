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

  private async init() {
    // Wait for DOM to be ready
    await this.waitForDOM();
    
    // Initial extraction
    this.extractUserMessages();
    
    // Set up mutation observer to watch for new messages
    this.setupObserver();
    
    // Add bookmark buttons to messages and restore states
    await this.addBookmarkButtons();
    
    // Wait a bit more for buttons to be added, then restore states with retries
    setTimeout(async () => {
      await this.restoreBookmarkStatesWithRetry();
    }, 1000);
    
    // Listen for messages from sidepanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_USER_MESSAGES') {
        this.extractUserMessages();
        sendResponse({ messages: this.userMessages });
      } else if (message.type === 'SCROLL_TO_MESSAGE') {
        this.scrollToMessage(message.messageId);
        sendResponse({ success: true });
      } else if (message.type === 'GET_CHATGPT_THEME') {
        const theme = this.detectChatGPTTheme();
        sendResponse({ theme });
      } else if (message.type === 'NAVIGATE_TO_BOOKMARK') {
        this.navigateToBookmark(message.messageId, message.turnIndex);
        sendResponse({ success: true });
      } else if (message.type === 'BOOKMARK_ADDED') {
        this.handleBookmarkAdded(message.messageId);
        sendResponse({ success: true });
      } else if (message.type === 'BOOKMARK_REMOVED') {
        this.handleBookmarkRemoved(message.messageId);
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
    // Try to get a stable ID from the article's data attributes
    const testId = article.getAttribute('data-testid');
    if (testId && testId.startsWith('conversation-turn-')) {
      return `user-message-${testId}`;
    }
    
    // Fallback to turn index based ID (more stable than timestamp)
    return `user-message-turn-${turnIndex}`;
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
          position: relative !important;
          outline: 3px solid #e94560 !important;
          outline-offset: 2px !important;
          animation: chatgpt-compass-border-glow ${CONFIG.ANIMATION_SPEED_MS}ms linear infinite !important;
        }
        
        @keyframes chatgpt-compass-border-glow {
          0% {
            outline-color: #e94560;
            filter: hue-rotate(0deg) brightness(1.2);
          }
          16.66% {
            outline-color: #f38ba8;
            filter: hue-rotate(60deg) brightness(1.4);
          }
          33.33% {
            outline-color: #a6e3a1;
            filter: hue-rotate(120deg) brightness(1.2);
          }
          50% {
            outline-color: #89dceb;
            filter: hue-rotate(180deg) brightness(1.4);
          }
          66.66% {
            outline-color: #7287fd;
            filter: hue-rotate(240deg) brightness(1.2);
          }
          83.33% {
            outline-color: #c6a0f6;
            filter: hue-rotate(300deg) brightness(1.4);
          }
          100% {
            outline-color: #e94560;
            filter: hue-rotate(360deg) brightness(1.2);
          }
        }
        

        
        .chatgpt-compass-highlight::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: inherit;
          background: linear-gradient(
            -45deg,
            rgba(233, 69, 96, 0.4),
            rgba(166, 227, 161, 0.4),
            rgba(137, 220, 235, 0.4),
            rgba(114, 135, 253, 0.4)
          );
          background-size: 200% 200%;
          animation: chatgpt-compass-pulse ${CONFIG.PULSE_SPEED_MS}ms ease-in-out infinite alternate;
          z-index: -2;
          pointer-events: none;
          opacity: 0.6;
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
        setTimeout(async () => {
          this.extractUserMessages();
          await this.addBookmarkButtons();
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

  private async addBookmarkButtons() {
    // Add bookmark buttons to each user message
    for (const message of this.userMessages) {
      await this.addBookmarkButtonToMessage(message);
    }
  }

  private async addBookmarkButtonToMessage(message: UserMessage) {
    // Check if bookmark button already exists
    if (message.element.querySelector('.chatgpt-compass-bookmark-btn')) {
      return;
    }

    // Check if message is already bookmarked
    const isBookmarked = await this.isMessageBookmarked(message.id);
    
    // Create bookmark button
    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = 'chatgpt-compass-bookmark-btn';
    bookmarkBtn.innerHTML = isBookmarked ? this.getTrashIcon() : this.getBookmarkIcon();
    bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this message';
    bookmarkBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--token-main-surface-primary, #ffffff);
      border: 1px solid var(--token-border-medium, #d1d5db);
      border-radius: 6px;
      padding: 4px 6px;
      cursor: pointer;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    // Add bookmark border if message is bookmarked
    if (isBookmarked) {
      this.addBookmarkBorder(message.element);
    }

    // Add hover effects to the message container
    const messageContainer = message.element.querySelector('.relative.max-w-\\[var\\(--user-chat-width\\,70\\%\\)\\]');
    const targetContainer = messageContainer || message.element;

    // Show/hide button on hover
    const showButton = () => {
      bookmarkBtn.style.opacity = '1';
    };
    const hideButton = () => {
      bookmarkBtn.style.opacity = '0';
    };

    targetContainer.addEventListener('mouseenter', showButton);
    targetContainer.addEventListener('mouseleave', hideButton);

    // Handle bookmark click
    bookmarkBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Check current bookmark status dynamically
      const currentlyBookmarked = await this.isMessageBookmarked(message.id);
      
      if (currentlyBookmarked) {
        // Remove bookmark
        await this.removeBookmark(message.id);
        bookmarkBtn.innerHTML = this.getBookmarkIcon();
        bookmarkBtn.title = 'Bookmark this message';
        this.removeBookmarkBorder(message.element);
        
        // Visual feedback
        bookmarkBtn.innerHTML = this.getCheckIcon();
        bookmarkBtn.style.background = 'var(--token-main-surface-secondary, #f3f4f6)';
        setTimeout(() => {
          bookmarkBtn.innerHTML = this.getBookmarkIcon();
          bookmarkBtn.style.background = 'var(--token-main-surface-primary, #ffffff)';
        }, 1000);
      } else {
        // Add bookmark
        await this.createBookmark(message);
        bookmarkBtn.innerHTML = this.getTrashIcon();
        bookmarkBtn.title = 'Remove bookmark';
        this.addBookmarkBorder(message.element);
        
        // Visual feedback
        bookmarkBtn.innerHTML = this.getCheckIcon();
        bookmarkBtn.style.background = 'var(--token-main-surface-secondary, #f3f4f6)';
        setTimeout(() => {
          bookmarkBtn.innerHTML = this.getTrashIcon();
          bookmarkBtn.style.background = 'var(--token-main-surface-primary, #ffffff)';
        }, 1000);
      }
    });

    // Add button to the message container
    if (targetContainer) {
      (targetContainer as HTMLElement).style.position = 'relative';
      targetContainer.appendChild(bookmarkBtn);
    }
  }

  private async createBookmark(message: UserMessage) {
    try {
      const chatTitle = this.getChatTitle();
      const chatUrl = window.location.href;
      
      const bookmarkData = {
        messageId: message.id,
        content: message.content,
        chatUrl: chatUrl,
        chatTitle: chatTitle,
        turnIndex: message.turnIndex,
        timestamp: message.timestamp
      };

      // Send to background script to handle bookmark creation
      await chrome.runtime.sendMessage({
        type: 'CREATE_BOOKMARK',
        bookmark: bookmarkData
      });

      console.log('Bookmark created for message:', message.id);
    } catch (error) {
      console.error('Error creating bookmark:', error);
    }
  }

  private getChatTitle(): string {
    // Try to get the chat title from various possible selectors
    const titleSelectors = [
      'h1[class*="text"]',
      '[data-testid="conversation-title"]',
      'title',
      'h1',
      'h2'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent?.trim()) {
        return titleElement.textContent.trim();
      }
    }

    // Fallback to URL-based title
    const urlPath = window.location.pathname;
    if (urlPath.includes('/c/')) {
      return `ChatGPT Conversation ${urlPath.split('/c/')[1]?.substring(0, 8) || ''}`;
    }

    return 'ChatGPT Conversation';
  }

  private navigateToBookmark(messageId: string, turnIndex: number) {
    // Find message by ID or turn index
    let message = this.userMessages.find(msg => msg.id === messageId);
    
    if (!message && typeof turnIndex === 'number') {
      message = this.userMessages.find(msg => msg.turnIndex === turnIndex);
    }

    if (message && message.element) {
      this.scrollToMessage(message.id);
    } else {
      console.warn('Message not found for bookmark navigation:', { messageId, turnIndex });
      // Try to extract messages again in case they weren't loaded
      this.extractUserMessages();
      setTimeout(() => {
        const retryMessage = this.userMessages.find(msg => 
          msg.id === messageId || msg.turnIndex === turnIndex
        );
        if (retryMessage) {
          this.scrollToMessage(retryMessage.id);
        }
      }, 500);
    }
  }

  private async isMessageBookmarked(messageId: string): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['bookmarkStorage']);
      if (result.bookmarkStorage && result.bookmarkStorage.bookmarks) {
        const chatUrl = window.location.href;
        return Object.values(result.bookmarkStorage.bookmarks).some((bookmark: any) => 
          bookmark.messageId === messageId && bookmark.chatUrl === chatUrl
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  private async removeBookmark(messageId: string) {
    try {
      const chatUrl = window.location.href;
      const result = await chrome.storage.local.get(['bookmarkStorage']);
      
      if (result.bookmarkStorage && result.bookmarkStorage.bookmarks) {
        const bookmarks = result.bookmarkStorage.bookmarks;
        const bookmarkToRemove = Object.values(bookmarks).find((bookmark: any) => 
          bookmark.messageId === messageId && bookmark.chatUrl === chatUrl
        );

        if (bookmarkToRemove) {
          delete bookmarks[(bookmarkToRemove as any).id];
          await chrome.storage.local.set({ bookmarkStorage: result.bookmarkStorage });
          console.log('Bookmark removed for message:', messageId);
        }
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }

  private addBookmarkBorder(element: HTMLElement) {
    // Add modern AI colored border to the message container
    const messageContainer = element.querySelector('.relative.max-w-\\[var\\(--user-chat-width\\,70\\%\\)\\]');
    const targetContainer = messageContainer || element;
    
    if (targetContainer) {
      (targetContainer as HTMLElement).classList.add('chatgpt-compass-bookmarked');
      this.addBookmarkStyles();
    }
  }

  private removeBookmarkBorder(element: HTMLElement) {
    // Remove the bookmark border
    const messageContainer = element.querySelector('.relative.max-w-\\[var\\(--user-chat-width\\,70\\%\\)\\]');
    const targetContainer = messageContainer || element;
    
    if (targetContainer) {
      (targetContainer as HTMLElement).classList.remove('chatgpt-compass-bookmarked');
    }
  }

  private addBookmarkStyles() {
    // Add bookmark border styles if not already added
    if (!document.getElementById('chatgpt-compass-bookmark-styles')) {
      const style = document.createElement('style');
      style.id = 'chatgpt-compass-bookmark-styles';
      style.textContent = `
        .chatgpt-compass-bookmarked {
          position: relative !important;
          border: 2px solid transparent !important;
          background: linear-gradient(var(--token-main-surface-primary, #ffffff), var(--token-main-surface-primary, #ffffff)) padding-box,
                      linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6, #f59e0b) border-box !important;
          border-radius: 12px !important;
          animation: bookmark-glow 3s ease-in-out infinite !important;
        }
        
        @keyframes bookmark-glow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.3), 0 0 16px rgba(16, 185, 129, 0.1);
          }
          33% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3), 0 0 16px rgba(59, 130, 246, 0.1);
          }
          66% {
            box-shadow: 0 0 8px rgba(139, 92, 246, 0.3), 0 0 16px rgba(139, 92, 246, 0.1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private async restoreBookmarkStatesWithRetry(maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`ChatGPT Compass: Restore attempt ${attempt}/${maxRetries}`);
      
      // Re-extract messages to ensure we have the latest DOM state
      this.extractUserMessages();
      
      if (this.userMessages.length > 0) {
        await this.restoreBookmarkStates();
        return; // Success, exit retry loop
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        console.log('ChatGPT Compass: No messages found, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('ChatGPT Compass: Failed to restore bookmark states after', maxRetries, 'attempts');
  }

  private async restoreBookmarkStates() {
    console.log('ChatGPT Compass: Restoring bookmark states for', this.userMessages.length, 'messages');
    
    // Restore bookmark visual states after page refresh
    for (const message of this.userMessages) {
      const isBookmarked = await this.isMessageBookmarked(message.id);
      console.log(`ChatGPT Compass: Message ${message.id} bookmarked:`, isBookmarked);
      
      if (isBookmarked) {
        // Add bookmark border
        this.addBookmarkBorder(message.element);
        
        // Update bookmark button if it exists
        const bookmarkBtn = message.element.querySelector('.chatgpt-compass-bookmark-btn') as HTMLButtonElement;
        if (bookmarkBtn) {
          bookmarkBtn.innerHTML = this.getTrashIcon();
          bookmarkBtn.title = 'Remove bookmark';
          console.log('ChatGPT Compass: Updated bookmark button for message', message.id);
        } else {
          console.log('ChatGPT Compass: No bookmark button found for message', message.id);
        }
      }
    }
    
    // Notify sidebar to update bookmark states
    this.sendMessagesToSidepanel();
  }

  private handleBookmarkAdded(messageId: string) {
    const message = this.userMessages.find(msg => msg.id === messageId);
    if (message) {
      // Add bookmark border
      this.addBookmarkBorder(message.element);
      
      // Update bookmark button
      const bookmarkBtn = message.element.querySelector('.chatgpt-compass-bookmark-btn') as HTMLButtonElement;
      if (bookmarkBtn) {
        bookmarkBtn.innerHTML = this.getTrashIcon();
        bookmarkBtn.title = 'Remove bookmark';
      }
    }
  }

  private handleBookmarkRemoved(messageId: string) {
    const message = this.userMessages.find(msg => msg.id === messageId);
    if (message) {
      // Remove bookmark border
      this.removeBookmarkBorder(message.element);
      
      // Update bookmark button
      const bookmarkBtn = message.element.querySelector('.chatgpt-compass-bookmark-btn') as HTMLButtonElement;
      if (bookmarkBtn) {
        bookmarkBtn.innerHTML = this.getBookmarkIcon();
        bookmarkBtn.title = 'Bookmark this message';
      }
    }
  }

  private async waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        // DOM is already ready
        resolve();
      }
    });
  }

  private getBookmarkIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
    </svg>`;
  }

  private getTrashIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
    </svg>`;
  }

  private getCheckIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
    </svg>`;
  }

  private detectChatGPTTheme(): 'light' | 'dark' {
    // Check for ChatGPT's dark mode indicators
    const body = document.body;
    const html = document.documentElement;
    
    // Check for dark mode classes or attributes
    if (body.classList.contains('dark') || 
        html.classList.contains('dark') ||
        body.getAttribute('data-theme') === 'dark' ||
        html.getAttribute('data-theme') === 'dark') {
      return 'dark';
    }
    
    // Check background color as fallback
    const bodyBg = window.getComputedStyle(body).backgroundColor;
    const htmlBg = window.getComputedStyle(html).backgroundColor;
    
    // Parse RGB values to determine if dark
    const isDarkBg = (bgColor: string): boolean => {
      const rgb = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgb) {
        const [, r, g, b] = rgb.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128; // Dark if brightness is less than 50%
      }
      return false;
    };
    
    if (isDarkBg(bodyBg) || isDarkBg(htmlBg)) {
      return 'dark';
    }
    
    return 'light';
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