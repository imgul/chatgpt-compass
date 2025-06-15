import React, { useState, useEffect } from 'react';

interface TabInfo {
  title: string;
  url: string;
}

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [count, setCount] = useState(0);

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
  }, []);

  const handleIncrement = () => {
    setCount((prev: number) => prev + 1);
  };

  const handleDecrement = () => {
    setCount((prev: number) => prev - 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>React Sidepanel</h1>
        <p className="subtitle">Chrome Extension Template</p>
      </header>

      <main className="main">
        <section className="card">
          <h2>Current Tab</h2>
          {currentTab ? (
            <div className="tab-info">
              <p className="tab-title">{currentTab.title}</p>
              <p className="tab-url">{new URL(currentTab.url).hostname}</p>
            </div>
          ) : (
            <p className="loading">Loading tab information...</p>
          )}
        </section>

        <section className="card">
          <h2>Counter Example</h2>
          <div className="counter">
            <div className="counter-display">{count}</div>
            <div className="counter-controls">
              <button onClick={handleDecrement} className="btn btn-secondary">
                -
              </button>
              <button onClick={handleReset} className="btn btn-outline">
                Reset
              </button>
              <button onClick={handleIncrement} className="btn btn-primary">
                +
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Features</h2>
          <ul className="feature-list">
            <li>✨ React 18 with TypeScript</li>
            <li>🎨 Modern, responsive design</li>
            <li>🔧 Webpack build system</li>
            <li>📱 Chrome Sidepanel API</li>
            <li>🚀 Ready for development</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Built with ❤️ using React & TypeScript</p>
      </footer>
    </div>
  );
};

export default App; 