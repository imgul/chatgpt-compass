import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useBookmarks } from '../BookmarkContext';
import ThemeSwitcher from '../ThemeSwitcher';
import { BookmarksPanel } from './BookmarksPanel';
import { 
  HiOutlineSearch, 
  HiOutlineLightningBolt, 
  HiOutlineColorSwatch, 
  HiOutlineRefresh, 
  HiOutlineFire,
  HiOutlineChatAlt2,
  HiOutlineBookmark,
  HiOutlineBookmarkAlt,
  HiOutlineTrash,
  HiOutlineFlag
} from 'react-icons/hi';

interface TabInfo {
  title: string;
  url: string;
}

interface UserMessage {
  id: string;
  content: string;
  timestamp: number;
  turnIndex: number;
}

export const AppContent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { isMessageBookmarked, getBookmarkForMessage, bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Debug logging
  React.useEffect(() => {
    console.log('AppContent: bookmarks count:', bookmarks.length);
    // Force re-render when bookmarks change to update button states
    setRefreshKey(prev => prev + 1);
  }, [bookmarks]);
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'messages' | 'bookmarks'>('messages');
  const [searchType, setSearchType] = useState<'content' | 'number'>('content');
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]) {
        setCurrentTab({
          title: tabs[0].title || 'Unknown',
          url: tabs[0].url || 'Unknown'
        });
      }
    });

    // Get user messages from background script
    loadMessages();

    // Set up storage listener for real-time updates
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          const storageKey = `messages_${tabs[0].id}`;
          if (changes[storageKey] && changes[storageKey].newValue) {
            const messageData = changes[storageKey].newValue;
            if (messageData.type === 'MESSAGES_UPDATED') {
              setUserMessages(messageData.messages);
              setIsLoading(false);
            }
          }
        }
      });
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadMessages = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage(
      { type: 'GET_MESSAGES_FROM_BACKGROUND' },
      (response) => {
        if (response && response.messages) {
          setUserMessages(response.messages);
        }
        setIsLoading(false);
      }
    );
  };

  const handleRefresh = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ type: 'REFRESH_MESSAGES' });
  };

  const handleMessageClick = (messageId: string) => {
    chrome.runtime.sendMessage({
      type: 'NAVIGATE_TO_MESSAGE',
      messageId: messageId
    });
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, message: UserMessage) => {
    e.stopPropagation(); // Prevent message navigation
    
    const isBookmarked = currentTab?.url ? 
      isMessageBookmarked(message.id, currentTab.url) : 
      isMessageBookmarked(message.id);

    if (isBookmarked) {
      // Remove bookmark
      const bookmark = currentTab?.url ? 
        getBookmarkForMessage(message.id, currentTab.url) : 
        getBookmarkForMessage(message.id);
      
      if (bookmark) {
        await removeBookmark(bookmark.id);
        
        // Notify content script to update visual state
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'BOOKMARK_REMOVED',
              messageId: message.id
            });
          }
        });
        
        // Force re-render to update bookmark button states
        setRefreshKey(prev => prev + 1);
      }
    } else {
      // Add bookmark
      const chatTitle = currentTab?.title || 'ChatGPT Conversation';
      const chatUrl = currentTab?.url || window.location.href;
      
      await addBookmark({
        messageId: message.id,
        content: message.content,
        chatUrl: chatUrl,
        chatTitle: chatTitle,
        turnIndex: message.turnIndex,
        timestamp: message.timestamp
      });
      
              // Notify content script to update visual state
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'BOOKMARK_ADDED',
              messageId: message.id
            });
          }
        });
        
        // Force re-render to update bookmark button states
        setRefreshKey(prev => prev + 1);
    }
  };

  const filteredMessages = userMessages.filter((message, index) => {
    if (!searchTerm) return true;
    
    if (searchType === 'number') {
      // Search by message number (1-based index)
      const messageNumber = (index + 1).toString();
      return messageNumber.includes(searchTerm);
    } else {
      // Search by content
      const content = caseSensitive ? message.content : message.content.toLowerCase();
      const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      return content.includes(term);
    }
  });

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isChatGPT = currentTab?.url && (
    currentTab.url.includes('chatgpt.com') || 
    currentTab.url.includes('chat.openai.com')
  );

  return (
    <div className={`app ${resolvedTheme}`}>
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1><img src="/icons/icon128.png" alt="ChatGPT Compass" className="inline mr-2 w-6 h-6" />ChatGPT Compass</h1>
            <p className="subtitle">Navigate conversations with AI precision</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="main">
        {!isChatGPT ? (
          <div className="guide-container">
            <section className="card welcome-card">
              <div className="logo-section">
                <h1 className="guide-title"><img src="/icons/icon128.png" alt="ChatGPT Compass" className="inline mr-2 w-8 h-8" />ChatGPT Compass</h1>
                <p className="guide-subtitle">Navigate your conversations with precision</p>
              </div>
            </section>

            <section className="card info-card">
                              <h2><HiOutlineFlag className="inline mr-2" />How to Use</h2>
              <div className="step-list">
                <div className="step-item">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h3>Navigate to ChatGPT</h3>
                    <p>Go to <strong>chatgpt.com</strong> and start or open a conversation</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h3>See Your Messages</h3>
                    <p>All your messages will automatically appear in this sidepanel</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h3>Click to Navigate</h3>
                    <p>Click any message to instantly scroll to it in the conversation</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h3>Search & Filter</h3>
                    <p>Use the search box to quickly find specific messages</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="card features-card">
              <h2>✨ Key Features</h2>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">🧭</span>
                  <div className="feature-text">
                    <h3>Smart Navigation</h3>
                    <p>Instantly jump to any message in long conversations</p>
                  </div>
                </div>
                <div className="feature-item">
                                      <span className="feature-icon"><HiOutlineSearch /></span>
                  <div className="feature-text">
                    <h3>Powerful Search</h3>
                    <p>Search through all your messages to find what you need</p>
                  </div>
                </div>
                <div className="feature-item">
                                      <span className="feature-icon"><HiOutlineLightningBolt /></span>
                  <div className="feature-text">
                    <h3>Real-time Updates</h3>
                    <p>New messages automatically appear as you chat</p>
                  </div>
                </div>
                <div className="feature-item">
                                      <span className="feature-icon"><HiOutlineColorSwatch /></span>
                  <div className="feature-text">
                    <h3>Visual Highlights</h3>
                    <p>Selected messages get vibrant AI-themed border animations</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <div className="feature-text">
                    <h3>Sidepanel Integration</h3>
                    <p>Works seamlessly with Chrome's built-in sidepanel</p>
                  </div>
                </div>
                <div className="feature-item">
                                      <span className="feature-icon"><HiOutlineRefresh /></span>
                  <div className="feature-text">
                    <h3>Live Sync</h3>
                    <p>Messages sync automatically across all tabs</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="card cta-card">
                              <h2><HiOutlineFire className="inline mr-2" />Ready to Start?</h2>
              <p>Navigate to ChatGPT to begin using the extension!</p>
              <button 
                onClick={() => chrome.tabs.create({ url: 'https://chatgpt.com' })}
                className="btn btn-primary cta-button"
              >
                Open ChatGPT →
              </button>
            </section>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <section className="card">
              <div className="tab-navigation">
                <button
                  className={`tab-button ${activeView === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveView('messages')}
                >
                  <HiOutlineChatAlt2 className="inline mr-1" />Messages ({filteredMessages.length})
                </button>
                <button
                  className={`tab-button ${activeView === 'bookmarks' ? 'active' : ''}`}
                  onClick={() => setActiveView('bookmarks')}
                >
                  <HiOutlineBookmarkAlt className="inline mr-1" />Bookmarks ({bookmarks.length})
                </button>
              </div>
            </section>

            {/* Content based on active view */}
            {activeView === 'messages' ? (
              <>
                <section className="card">
                  <div className="search-header">
                    <h2>Your Messages ({filteredMessages.length})</h2>
                    <button onClick={handleRefresh} className="btn btn-refresh" disabled={isLoading}>
                      {isLoading ? '⟳' : '↻'}
                    </button>
                  </div>
                  <div className="search-container">
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        placeholder={searchType === 'content' ? "Search message content..." : "Search by message number..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      <div className="search-controls">
                        <button
                          className={`search-type-btn ${searchType === 'content' ? 'active' : ''}`}
                          onClick={() => setSearchType('content')}
                          title="Search by content"
                        >
                          <HiOutlineChatAlt2 />
                        </button>
                        <button
                          className={`search-type-btn ${searchType === 'number' ? 'active' : ''}`}
                          onClick={() => setSearchType('number')}
                          title="Search by message number"
                        >
                          #
                        </button>
                        <button
                          className={`case-sensitive-btn ${caseSensitive ? 'active' : ''}`}
                          onClick={() => setCaseSensitive(!caseSensitive)}
                          title="Case sensitive search"
                        >
                          Aa
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="messages-container">
                  {isLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Loading your messages...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="empty-state">
                      <p>
                        {searchTerm 
                          ? 'No messages match your search.' 
                          : 'No messages found. Start a conversation with ChatGPT!'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="message-list">
                      {filteredMessages.map((message) => {
                        const isBookmarked = currentTab?.url ? 
                          isMessageBookmarked(message.id, currentTab.url) : 
                          isMessageBookmarked(message.id);
                        
                        // Find original index to keep message numbers consistent
                        const originalIndex = userMessages.findIndex(m => m.id === message.id);
                        
                        return (
                          <div
                            key={message.id}
                            className={`message-item ${isBookmarked ? 'bookmarked' : ''}`}
                            onClick={() => handleMessageClick(message.id)}
                          >
                            <div className="message-header">
                              <div className="message-header-left">
                                <span className="message-number">#{originalIndex + 1}</span>
                                {isBookmarked && (
                                  <span className="bookmark-indicator" title="This message is bookmarked">
                                    <HiOutlineBookmark />
                                  </span>
                                )}
                              </div>
                              <div className="message-status">
                                <span className="message-time">{formatTime(message.timestamp)}</span>
                                <button
                                  className={`message-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                                  onClick={(e) => handleBookmarkToggle(e, message)}
                                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                >
                                  {isBookmarked ? <HiOutlineTrash /> : <HiOutlineBookmark />}
                                </button>
                              </div>
                            </div>
                            <div className="message-content">
                              {truncateText(message.content)}
                            </div>
                            <div className="message-footer">
                              <span className="click-hint">Click to navigate →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <BookmarksPanel />
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>Built with ❤️ for better ChatGPT navigation</p>
      </footer>
    </div>
  );
}; 