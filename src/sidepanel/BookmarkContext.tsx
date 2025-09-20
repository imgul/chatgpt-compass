import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BookmarkedMessage, BookmarkFolder, BookmarkStorage } from '../types/Bookmark';

interface BookmarkContextType {
  bookmarks: BookmarkedMessage[];
  folders: BookmarkFolder[];
  loading: boolean;
  addBookmark: (message: Omit<BookmarkedMessage, 'id' | 'bookmarkedAt'>, folderId?: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  updateBookmark: (bookmarkId: string, updates: Partial<BookmarkedMessage>) => Promise<void>;
  createFolder: (name: string, color: string, icon?: string) => Promise<BookmarkFolder>;
  updateFolder: (folderId: string, updates: Partial<Omit<BookmarkFolder, 'id' | 'createdAt' | 'bookmarkIds'>>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addToFolder: (bookmarkId: string, folderId: string) => Promise<void>;
  removeFromFolder: (bookmarkId: string, folderId: string) => Promise<void>;
  moveToFolder: (bookmarkId: string, newFolderId?: string) => Promise<void>;
  searchBookmarks: (query: string) => BookmarkedMessage[];
  getBookmarksByChat: (chatUrl: string) => BookmarkedMessage[];
  getBookmarksByFolder: (folderId: string) => BookmarkedMessage[];
  getUnfolderedBookmarks: () => BookmarkedMessage[];
  navigateToBookmark: (bookmark: BookmarkedMessage) => Promise<void>;
  isMessageBookmarked: (messageId: string, chatUrl?: string) => boolean;
  getBookmarkForMessage: (messageId: string, chatUrl?: string) => BookmarkedMessage | null;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

interface BookmarkProviderProps {
  children: ReactNode;
}

export const BookmarkProvider: React.FC<BookmarkProviderProps> = ({ children }) => {
  const [storage, setStorage] = useState<BookmarkStorage>({
    bookmarks: {},
    folders: {},
    recentChats: {}
  });
  const [loading, setLoading] = useState(true);

  // Load bookmarks from Chrome storage
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const result = await chrome.storage.local.get(['bookmarkStorage']);
        console.log('BookmarkContext: Loading bookmarks from storage:', result);
        if (result.bookmarkStorage) {
          setStorage(result.bookmarkStorage);
          console.log('BookmarkContext: Loaded bookmarks:', Object.keys(result.bookmarkStorage.bookmarks || {}).length);
        } else {
          console.log('BookmarkContext: No bookmark storage found, initializing empty');
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();

    // Listen for storage changes to update bookmarks in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.bookmarkStorage) {
        console.log('BookmarkContext: Storage changed, updating bookmarks');
        const newStorage = changes.bookmarkStorage.newValue;
        if (newStorage) {
          setStorage(newStorage);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save to Chrome storage
  const saveStorage = async (newStorage: BookmarkStorage) => {
    try {
      await chrome.storage.local.set({ bookmarkStorage: newStorage });
      setStorage(newStorage);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addBookmark = async (messageData: Omit<BookmarkedMessage, 'id' | 'bookmarkedAt'>, folderId?: string) => {
    const id = generateId();
    const bookmark: BookmarkedMessage = {
      ...messageData,
      id,
      bookmarkedAt: Date.now(),
      folderId // Add folder assignment
    };

    const newStorage = {
      ...storage,
      bookmarks: {
        ...storage.bookmarks,
        [id]: bookmark
      },
      recentChats: {
        ...storage.recentChats,
        [messageData.chatUrl]: {
          title: messageData.chatTitle,
          lastVisited: Date.now()
        }
      }
    };

    // If assigned to a folder, also add to folder's bookmarkIds
    if (folderId && storage.folders[folderId]) {
      newStorage.folders = {
        ...storage.folders,
        [folderId]: {
          ...storage.folders[folderId],
          bookmarkIds: [...storage.folders[folderId].bookmarkIds, id]
        }
      };
    }

    await saveStorage(newStorage);
  };

  const removeBookmark = async (bookmarkId: string) => {
    const newBookmarks = { ...storage.bookmarks };
    delete newBookmarks[bookmarkId];

    // Remove from folders
    const newFolders = { ...storage.folders };
    Object.keys(newFolders).forEach(folderId => {
      newFolders[folderId] = {
        ...newFolders[folderId],
        bookmarkIds: newFolders[folderId].bookmarkIds.filter(id => id !== bookmarkId)
      };
    });

    const newStorage = {
      ...storage,
      bookmarks: newBookmarks,
      folders: newFolders
    };

    await saveStorage(newStorage);
  };

  const updateBookmark = async (bookmarkId: string, updates: Partial<BookmarkedMessage>) => {
    const existingBookmark = storage.bookmarks[bookmarkId];
    if (!existingBookmark) return;

    const updatedBookmark = { ...existingBookmark, ...updates };
    const newStorage = {
      ...storage,
      bookmarks: {
        ...storage.bookmarks,
        [bookmarkId]: updatedBookmark
      }
    };

    await saveStorage(newStorage);
  };

  const createFolder = async (name: string, color: string, icon?: string): Promise<BookmarkFolder> => {
    const id = generateId();
    const folder: BookmarkFolder = {
      id,
      name,
      color,
      icon,
      createdAt: Date.now(),
      bookmarkIds: []
    };

    const newStorage = {
      ...storage,
      folders: {
        ...storage.folders,
        [id]: folder
      }
    };

    await saveStorage(newStorage);
    return folder;
  };

  const updateFolder = async (folderId: string, updates: Partial<Omit<BookmarkFolder, 'id' | 'createdAt' | 'bookmarkIds'>>) => {
    const existingFolder = storage.folders[folderId];
    if (!existingFolder) return;

    const updatedFolder = { ...existingFolder, ...updates };
    const newStorage = {
      ...storage,
      folders: {
        ...storage.folders,
        [folderId]: updatedFolder
      }
    };

    await saveStorage(newStorage);
  };

  const deleteFolder = async (folderId: string) => {
    const newFolders = { ...storage.folders };
    delete newFolders[folderId];

    const newStorage = {
      ...storage,
      folders: newFolders
    };

    await saveStorage(newStorage);
  };

  const addToFolder = async (bookmarkId: string, folderId: string) => {
    const folder = storage.folders[folderId];
    if (!folder || folder.bookmarkIds.includes(bookmarkId)) return;

    const updatedFolder = {
      ...folder,
      bookmarkIds: [...folder.bookmarkIds, bookmarkId]
    };

    const newStorage = {
      ...storage,
      folders: {
        ...storage.folders,
        [folderId]: updatedFolder
      }
    };

    await saveStorage(newStorage);
  };

  const removeFromFolder = async (bookmarkId: string, folderId: string) => {
    const folder = storage.folders[folderId];
    if (!folder) return;

    const updatedFolder = {
      ...folder,
      bookmarkIds: folder.bookmarkIds.filter(id => id !== bookmarkId)
    };

    // Also remove folderId from bookmark
    const bookmark = storage.bookmarks[bookmarkId];
    const updatedBookmark = bookmark ? { ...bookmark, folderId: undefined } : null;

    const newStorage = {
      ...storage,
      folders: {
        ...storage.folders,
        [folderId]: updatedFolder
      },
      bookmarks: updatedBookmark ? {
        ...storage.bookmarks,
        [bookmarkId]: updatedBookmark
      } : storage.bookmarks
    };

    await saveStorage(newStorage);
  };

  const moveToFolder = async (bookmarkId: string, newFolderId?: string) => {
    const bookmark = storage.bookmarks[bookmarkId];
    if (!bookmark) return;

    // Remove from current folder if exists
    const currentFolderId = bookmark.folderId;
    let newFolders = { ...storage.folders };

    if (currentFolderId && newFolders[currentFolderId]) {
      newFolders[currentFolderId] = {
        ...newFolders[currentFolderId],
        bookmarkIds: newFolders[currentFolderId].bookmarkIds.filter(id => id !== bookmarkId)
      };
    }

    // Add to new folder if specified
    if (newFolderId && newFolders[newFolderId]) {
      if (!newFolders[newFolderId].bookmarkIds.includes(bookmarkId)) {
        newFolders[newFolderId] = {
          ...newFolders[newFolderId],
          bookmarkIds: [...newFolders[newFolderId].bookmarkIds, bookmarkId]
        };
      }
    }

    // Update bookmark's folderId
    const updatedBookmark = { ...bookmark, folderId: newFolderId };

    const newStorage = {
      ...storage,
      folders: newFolders,
      bookmarks: {
        ...storage.bookmarks,
        [bookmarkId]: updatedBookmark
      }
    };

    await saveStorage(newStorage);
  };

  const getUnfolderedBookmarks = (): BookmarkedMessage[] => {
    return Object.values(storage.bookmarks)
      .filter(bookmark => !bookmark.folderId)
      .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);
  };

  const searchBookmarks = (query: string): BookmarkedMessage[] => {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(storage.bookmarks).filter(bookmark =>
      bookmark.content.toLowerCase().includes(lowercaseQuery) ||
      bookmark.chatTitle.toLowerCase().includes(lowercaseQuery) ||
      bookmark.userNote?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getBookmarksByChat = (chatUrl: string): BookmarkedMessage[] => {
    return Object.values(storage.bookmarks).filter(bookmark =>
      bookmark.chatUrl === chatUrl
    );
  };

  const getBookmarksByFolder = (folderId: string): BookmarkedMessage[] => {
    const folder = storage.folders[folderId];
    if (!folder) return [];

    return folder.bookmarkIds
      .map(id => storage.bookmarks[id])
      .filter(Boolean)
      .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);
  };

  const navigateToBookmark = async (bookmark: BookmarkedMessage) => {
    try {
      // Get current tab
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (currentTab.url === bookmark.chatUrl) {
        // Same chat, just scroll to message
        await chrome.tabs.sendMessage(currentTab.id!, {
          type: 'NAVIGATE_TO_BOOKMARK',
          messageId: bookmark.messageId,
          turnIndex: bookmark.turnIndex
        });
      } else {
        // Different chat, navigate to URL first
        await chrome.tabs.update(currentTab.id!, { url: bookmark.chatUrl });

        // Wait for page to load, then scroll to message
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(currentTab.id!, {
              type: 'NAVIGATE_TO_BOOKMARK',
              messageId: bookmark.messageId,
              turnIndex: bookmark.turnIndex
            });
          } catch (error) {
            console.error('Error navigating to bookmark:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error navigating to bookmark:', error);
    }
  };

  const isMessageBookmarked = (messageId: string, chatUrl?: string): boolean => {
    return Object.values(storage.bookmarks).some(bookmark => {
      if (chatUrl) {
        return bookmark.messageId === messageId && bookmark.chatUrl === chatUrl;
      }
      return bookmark.messageId === messageId;
    });
  };

  const getBookmarkForMessage = (messageId: string, chatUrl?: string): BookmarkedMessage | null => {
    const found = Object.values(storage.bookmarks).find(bookmark => {
      if (chatUrl) {
        return bookmark.messageId === messageId && bookmark.chatUrl === chatUrl;
      }
      return bookmark.messageId === messageId;
    });
    return found || null;
  };

  const bookmarks = Object.values(storage.bookmarks).sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);
  const folders = Object.values(storage.folders).sort((a, b) => a.createdAt - b.createdAt);

  const value: BookmarkContextType = {
    bookmarks,
    folders,
    loading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    createFolder,
    updateFolder,
    deleteFolder,
    addToFolder,
    removeFromFolder,
    moveToFolder,
    searchBookmarks,
    getBookmarksByChat,
    getBookmarksByFolder,
    getUnfolderedBookmarks,
    navigateToBookmark,
    isMessageBookmarked,
    getBookmarkForMessage
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}; 