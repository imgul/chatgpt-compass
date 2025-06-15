import React, { useState, useEffect } from 'react';

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
    <div className="app">
      <header className="header">
        <h1>ChatGPT Compass</h1>
        <p className="subtitle">Navigate your conversations with ease</p>
      </header>

      <main className="main">
        {!isChatGPT ? (
          <section className="card">
            <h2>Welcome to ChatGPT Compass</h2>
            <p className="info-text">
              This extension works on ChatGPT pages. Please navigate to{' '}
              <strong>chatgpt.com</strong> to see your conversation messages.
            </p>
            <div className="feature-list">
              <p>🧭 Navigate long conversations instantly</p>
              <p>🔍 Search through your messages</p>
              <p>⚡ Quick access to any message</p>
            </div>
          </section>
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