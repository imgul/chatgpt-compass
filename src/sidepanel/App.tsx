import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

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

const App: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredMessages = userMessages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1>🧭 ChatGPT Compass</h1>
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
                <h1 className="guide-title">🧭 ChatGPT Compass</h1>
                <p className="guide-subtitle">Navigate your conversations with precision</p>
              </div>
            </section>

            <section className="card info-card">
              <h2>🎯 How to Use</h2>
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
                  <span className="feature-icon">🔍</span>
                  <div className="feature-text">
                    <h3>Powerful Search</h3>
                    <p>Search through all your messages to find what you need</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <div className="feature-text">
                    <h3>Real-time Updates</h3>
                    <p>New messages automatically appear as you chat</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎨</span>
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
                  <span className="feature-icon">🔄</span>
                  <div className="feature-text">
                    <h3>Live Sync</h3>
                    <p>Messages sync automatically across all tabs</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="card cta-card">
              <h2>🚀 Ready to Start?</h2>
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
            <section className="card">
              <div className="search-header">
                <h2>Your Messages ({filteredMessages.length})</h2>
                <button onClick={handleRefresh} className="btn btn-refresh" disabled={isLoading}>
                  {isLoading ? '⟳' : '↻'}
                </button>
              </div>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
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
                  {filteredMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className="message-item"
                      onClick={() => handleMessageClick(message.id)}
                    >
                      <div className="message-header">
                        <span className="message-number">#{index + 1}</span>
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                      </div>
                      <div className="message-content">
                        {truncateText(message.content)}
                      </div>
                      <div className="message-footer">
                        <span className="click-hint">Click to navigate →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>Built with ❤️ for better ChatGPT navigation</p>
      </footer>
    </div>
  );
};

export default App; 