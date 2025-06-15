import React, { useState, useMemo } from 'react';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkedMessage } from '../../types/Bookmark';

type SortOption = 'recent' | 'oldest' | 'chat' | 'content';
type FilterOption = 'all' | 'today' | 'week' | 'month';

export const BookmarksPanel: React.FC = () => {
  const { bookmarks, loading, searchBookmarks } = useBookmarks();
  const { theme } = useTheme();
  
  // Debug logging
  React.useEffect(() => {
    console.log('BookmarksPanel: bookmarks updated:', bookmarks.length, bookmarks);
  }, [bookmarks]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkedMessage | null>(null);

  // Filter bookmarks by date
  const filteredBookmarks = useMemo(() => {
    let filtered = searchQuery ? searchBookmarks(searchQuery) : bookmarks;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    switch (filterBy) {
      case 'today':
        filtered = filtered.filter(b => (now - b.bookmarkedAt) < oneDay);
        break;
      case 'week':
        filtered = filtered.filter(b => (now - b.bookmarkedAt) < oneWeek);
        break;
      case 'month':
        filtered = filtered.filter(b => (now - b.bookmarkedAt) < oneMonth);
        break;
    }

    return filtered;
  }, [bookmarks, searchQuery, filterBy, searchBookmarks]);

  // Sort bookmarks
  const sortedBookmarks = useMemo(() => {
    const sorted = [...filteredBookmarks];

    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);
      case 'oldest':
        return sorted.sort((a, b) => a.bookmarkedAt - b.bookmarkedAt);
      case 'chat':
        return sorted.sort((a, b) => a.chatTitle.localeCompare(b.chatTitle));
      case 'content':
        return sorted.sort((a, b) => a.content.localeCompare(b.content));
      default:
        return sorted;
    }
  }, [filteredBookmarks, sortBy]);

  const handleEditBookmark = (bookmark: BookmarkedMessage) => {
    setEditingBookmark(bookmark);
    setShowEditModal(true);
  };

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return `No bookmarks found for "${searchQuery}"`;
    }
    if (filterBy !== 'all') {
      return `No bookmarks found in the selected time period`;
    }
    return 'No bookmarks yet. Start bookmarking messages to see them here!';
  };

  if (loading) {
    return (
      <div className={`bookmarks-panel ${theme}`}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bookmarks-panel ${theme}`}>
      <div className="bookmarks-header">
        <h2 className="panel-title">
          📚 Bookmarks
          {bookmarks.length > 0 && (
            <span className="bookmark-count">({bookmarks.length})</span>
          )}
        </h2>
      </div>

      <div className="bookmarks-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="filter-select"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest first</option>
            <option value="chat">By chat</option>
            <option value="content">By content</option>
          </select>
        </div>
      </div>

      <div className="bookmarks-content">
        {sortedBookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-message">{getEmptyStateMessage()}</p>
            {!searchQuery && filterBy === 'all' && (
              <div className="empty-tip">
                <p>💡 Tip: Click the bookmark button (📌) on any message to save it for later!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bookmarks-list">
            {sortedBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEditBookmark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show results summary */}
      {sortedBookmarks.length > 0 && (
        <div className="results-summary">
          Showing {sortedBookmarks.length} of {bookmarks.length} bookmarks
        </div>
      )}
    </div>
  );
}; 