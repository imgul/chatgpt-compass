import React from 'react';
import { BookmarkProvider } from './BookmarkContext';
import { AppContent } from './components/AppContent';

const App: React.FC = () => {
  return (
    <BookmarkProvider>
      <AppContent />
    </BookmarkProvider>
  );
};

export default App; 