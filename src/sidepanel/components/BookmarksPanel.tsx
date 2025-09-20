import React, { useState, useMemo } from 'react';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';
import { BookmarkCard } from './BookmarkCard';
import { FolderCard } from './FolderCard';
import { FolderSelector } from './FolderSelector';
import { BookmarkedMessage } from '../../types/Bookmark';
import {
  HiOutlineBookmarkAlt,
  HiOutlineBookmark,
  HiOutlineInboxIn,
  HiOutlineLightBulb,
  HiX,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiChevronLeft
} from 'react-icons/hi';

type SortOption = 'recent' | 'oldest' | 'chat' | 'content';
type FilterOption = 'all' | 'today' | 'week' | 'month';
type ViewMode = 'all' | 'folders' | 'folder';

export const BookmarksPanel: React.FC = () => {
  const {
    bookmarks,
    folders,
    loading,
    searchBookmarks,
    getBookmarksByFolder,
    getUnfolderedBookmarks,
    moveToFolder,
    createFolder
  } = useBookmarks();
  const { theme } = useTheme();

  // Debug logging
  React.useEffect(() => {
    console.log('BookmarksPanel: bookmarks updated:', bookmarks.length, bookmarks);
  }, [bookmarks]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkedMessage | null>(null);
  const [selectedBookmarkForMove, setSelectedBookmarkForMove] = useState<string | null>(null);

  // Filter bookmarks by date and view mode
  const filteredBookmarks = useMemo(() => {
    let filtered: BookmarkedMessage[] = [];

    if (viewMode === 'all') {
      filtered = searchQuery ? searchBookmarks(searchQuery) : bookmarks;
    } else if (viewMode === 'folder' && selectedFolderId) {
      const folderBookmarks = getBookmarksByFolder(selectedFolderId);
      filtered = searchQuery ? folderBookmarks.filter(b =>
        b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.chatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userNote?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) : folderBookmarks;
    } else if (viewMode === 'folders') {
      // Show unfoldered bookmarks when in folders view but no specific folder selected
      const unfolderedBookmarks = getUnfolderedBookmarks();
      filtered = searchQuery ? unfolderedBookmarks.filter(b =>
        b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.chatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userNote?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) : unfolderedBookmarks;
    }

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
  }, [bookmarks, searchQuery, filterBy, viewMode, selectedFolderId, searchBookmarks, getBookmarksByFolder, getUnfolderedBookmarks]);

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

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setViewMode('folder');
  };

  const handleBackToFolders = () => {
    setSelectedFolderId(null);
    setViewMode('folders');
  };

  const handleBackToAll = () => {
    setSelectedFolderId(null);
    setViewMode('all');
  };

  const handleMoveToFolder = async (bookmarkId: string, newFolderId?: string) => {
    try {
      await moveToFolder(bookmarkId, newFolderId);
      setSelectedBookmarkForMove(null);
    } catch (error) {
      console.error('Error moving bookmark to folder:', error);
    }
  };

  const handleCreateFolderAndMove = async (name: string, color: string, icon?: string) => {
    if (!selectedBookmarkForMove) return;

    try {
      const newFolder = await createFolder(name, color, icon);
      await moveToFolder(selectedBookmarkForMove, newFolder.id);
      setSelectedBookmarkForMove(null);
    } catch (error) {
      console.error('Error creating folder and moving bookmark:', error);
    }
  };

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return `No bookmarks found for "${searchQuery}"`;
    }

    if (viewMode === 'folder' && selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      return `No bookmarks in "${folder?.name || 'Unknown'}" folder`;
    }

    if (viewMode === 'folders') {
      return 'No unorganized bookmarks. All bookmarks are in folders.';
    }

    return 'No bookmarks yet! Start saving interesting messages from your ChatGPT conversations.';
  };

  const getCurrentViewTitle = () => {
    if (viewMode === 'folder' && selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      return folder?.name || 'Unknown Folder';
    }

    if (viewMode === 'folders') {
      return 'Unorganized Bookmarks';
    }

    return 'All Bookmarks';
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
          <HiOutlineBookmarkAlt className="inline mr-2" />
          {getCurrentViewTitle()}
          {(viewMode === 'all' ? bookmarks.length : filteredBookmarks.length) > 0 && (
            <span className="bookmark-count">
              ({viewMode === 'all' ? bookmarks.length : filteredBookmarks.length})
            </span>
          )}
        </h2>

        {/* Navigation buttons */}
        <div className="view-navigation">
          {viewMode === 'folder' && (
            <button
              onClick={handleBackToFolders}
              className="nav-button"
              title="Back to folders"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
          )}
          {viewMode === 'folders' && (
            <button
              onClick={handleBackToAll}
              className="nav-button"
              title="Show all bookmarks"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* View mode selector */}
      <div className="view-mode-selector">
        <button
          onClick={() => setViewMode('all')}
          className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
        >
          <HiOutlineBookmark className="w-4 h-4" />
          All Bookmarks
        </button>
        <button
          onClick={() => setViewMode('folders')}
          className={`view-mode-btn ${viewMode === 'folders' || viewMode === 'folder' ? 'active' : ''}`}
        >
          <HiOutlineFolder className="w-4 h-4" />
          By Folders
        </button>
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
              <HiX />
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
        {/* Folder view - show folders list */}
        {viewMode === 'folders' && !selectedFolderId && (
          <div className="folders-list">
            {folders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><HiOutlineFolder /></div>
                <p className="empty-message">No folders created yet</p>
                <p className="empty-tip">Create folders to organize your bookmarks</p>
              </div>
            ) : (
              <div className="folder-cards">
                {folders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderSelect(folder.id)}
                  />
                ))}
              </div>
            )}

            {/* Show unfoldered bookmarks */}
            {getUnfolderedBookmarks().length > 0 && (
              <div className="unfoldered-section">
                <h3 className="section-title">Unorganized Bookmarks</h3>
                <div className="bookmarks-list">
                  {getUnfolderedBookmarks().map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onEdit={handleEditBookmark}
                      onMoveToFolder={setSelectedBookmarkForMove}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular bookmark list view */}
        {(viewMode === 'all' || viewMode === 'folder') && (
          <>
            {sortedBookmarks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><HiOutlineInboxIn /></div>
                <p className="empty-message">{getEmptyStateMessage()}</p>
                {!searchQuery && filterBy === 'all' && viewMode === 'all' && (
                  <div className="empty-tip">
                    <p><HiOutlineLightBulb className="inline mr-1" />Tip: Click the bookmark button (<HiOutlineBookmark className="inline" />) on any message to save it for later!</p>
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
                    onMoveToFolder={setSelectedBookmarkForMove}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Folder selector modal for moving bookmarks */}
      {selectedBookmarkForMove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Move bookmark to folder</h3>
            <FolderSelector
              selectedFolderId={undefined}
              onFolderSelect={(folderId) => handleMoveToFolder(selectedBookmarkForMove, folderId)}
              onCreateFolder={handleCreateFolderAndMove}
            />
            <button
              onClick={() => setSelectedBookmarkForMove(null)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show results summary */}
      {sortedBookmarks.length > 0 && (viewMode === 'all' || viewMode === 'folder') && (
        <div className="results-summary">
          Showing {sortedBookmarks.length} of {
            viewMode === 'all' ? bookmarks.length :
              viewMode === 'folder' && selectedFolderId ? getBookmarksByFolder(selectedFolderId).length :
                filteredBookmarks.length
          } bookmarks
        </div>
      )}
    </div>
  );
}; 