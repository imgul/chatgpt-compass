import React, { useState } from 'react';
import { BookmarkedMessage } from '../../types/Bookmark';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';

interface BookmarkCardProps {
  bookmark: BookmarkedMessage;
  onEdit?: (bookmark: BookmarkedMessage) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit }) => {
  const { removeBookmark, navigateToBookmark } = useBookmarks();
  const { theme } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this bookmark?')) return;
    
    setIsDeleting(true);
    try {
      await removeBookmark(bookmark.id);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigate = async () => {
    try {
      await navigateToBookmark(bookmark);
    } catch (error) {
      console.error('Error navigating to bookmark:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatChatTitle = (title: string) => {
    if (title.length > 30) {
      return title.substring(0, 30) + '...';
    }
    return title;
  };

  const formatContent = (content: string) => {
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  };

  return (
    <div className={`bookmark-card ${theme} ${isDeleting ? 'deleting' : ''}`}>
      <div className="bookmark-header">
        <div className="bookmark-meta">
          <span className="chat-title" title={bookmark.chatTitle}>
            💬 {formatChatTitle(bookmark.chatTitle)}
          </span>
          <span className="bookmark-date">
            📌 {formatDate(bookmark.bookmarkedAt)}
          </span>
        </div>
        <div className="bookmark-actions">
          <button 
            className="action-btn navigate-btn"
            onClick={handleNavigate}
            title="Navigate to message"
          >
            🧭
          </button>
          {onEdit && (
            <button 
              className="action-btn edit-btn"
              onClick={() => onEdit(bookmark)}
              title="Edit bookmark"
            >
              ✏️
            </button>
          )}
          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Remove bookmark"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      <div className="bookmark-content">
        <p className="message-content">{formatContent(bookmark.content)}</p>
        {bookmark.userNote && (
          <div className="user-note">
            <span className="note-label">📝 Note:</span>
            <p className="note-text">{bookmark.userNote}</p>
          </div>
        )}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="bookmark-tags">
            {bookmark.tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bookmark-footer">
        <span className="message-info">
          Turn {bookmark.turnIndex + 1} • {formatDate(bookmark.timestamp)}
        </span>
      </div>
    </div>
  );
}; 