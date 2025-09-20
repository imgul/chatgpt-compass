export interface BookmarkedMessage {
  id: string;
  messageId: string;
  content: string;
  chatUrl: string;
  chatTitle: string;
  turnIndex: number;
  timestamp: number;
  bookmarkedAt: number;
  userNote?: string;
  tags?: string[];
  folderId?: string; // Optional folder assignment
}

export interface BookmarkFolder {
  id: string;
  name: string;
  color: string;
  icon?: string; // Icon name for the folder
  createdAt: number;
  bookmarkIds: string[];
}

export interface BookmarkStorage {
  bookmarks: { [id: string]: BookmarkedMessage };
  folders: { [id: string]: BookmarkFolder };
  recentChats: { [url: string]: { title: string; lastVisited: number } };
}
