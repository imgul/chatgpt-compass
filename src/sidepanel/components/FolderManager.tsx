import React, { useState } from 'react';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';
import { BookmarkFolder } from '../../types/Bookmark';
import {
    HiOutlineFolder,
    HiOutlinePencil,
    HiOutlineTrash,
    HiCheck,
    HiX,
    HiPlus
} from 'react-icons/hi';

interface FolderManagerProps {
    className?: string;
}

const FOLDER_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
];

const FOLDER_ICONS = [
    'folder', 'folder-open', 'academic-cap', 'briefcase',
    'code', 'heart', 'star', 'light-bulb',
    'bookmark', 'tag', 'puzzle', 'trophy'
];

export const FolderManager: React.FC<FolderManagerProps> = ({ className = '' }) => {
    const { folders, createFolder, updateFolder, deleteFolder, getBookmarksByFolder } = useBookmarks();
    const { theme } = useTheme();

    const [editingFolder, setEditingFolder] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
    const [newFolderIcon, setNewFolderIcon] = useState(FOLDER_ICONS[0]);

    const handleEditStart = (folder: BookmarkFolder) => {
        setEditingFolder(folder.id);
        setEditName(folder.name);
        setEditColor(folder.color);
        setEditIcon(folder.icon || FOLDER_ICONS[0]);
    };

    const handleEditSave = async () => {
        if (!editingFolder || !editName.trim()) return;

        try {
            await updateFolder(editingFolder, {
                name: editName.trim(),
                color: editColor,
                icon: editIcon
            });
            setEditingFolder(null);
        } catch (error) {
            console.error('Error updating folder:', error);
        }
    };

    const handleEditCancel = () => {
        setEditingFolder(null);
        setEditName('');
        setEditColor('');
        setEditIcon('');
    };

    const handleDelete = async (folderId: string) => {
        const bookmarksInFolder = getBookmarksByFolder(folderId);
        const confirmMessage = bookmarksInFolder.length > 0
            ? `This folder contains ${bookmarksInFolder.length} bookmark(s). Deleting it will move those bookmarks to "No folder". Continue?`
            : 'Are you sure you want to delete this folder?';

        if (window.confirm(confirmMessage)) {
            try {
                await deleteFolder(folderId);
            } catch (error) {
                console.error('Error deleting folder:', error);
            }
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await createFolder(newFolderName.trim(), newFolderColor, newFolderIcon);
            setNewFolderName('');
            setNewFolderColor(FOLDER_COLORS[0]);
            setNewFolderIcon(FOLDER_ICONS[0]);
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const getFolderIcon = (iconName?: string) => {
        // Return appropriate icon component based on iconName
        // For now, using a default folder icon
        return <HiOutlineFolder className="w-4 h-4" />;
    };

    return (
        <div className={`folder-manager ${className}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Manage Folders
                    </h3>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <HiPlus className="w-4 h-4" />
                        <span>New Folder</span>
                    </button>
                </div>

                {/* Create New Folder Form */}
                {showCreateForm && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Create New Folder
                        </h4>

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                autoFocus
                            />

                            {/* Color Picker */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDER_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewFolderColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 ${newFolderColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {newFolderColor === color && (
                                                <HiCheck className="w-4 h-4 text-white mx-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDER_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setNewFolderIcon(icon)}
                                            className={`p-2 rounded border ${newFolderIcon === icon
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            {getFolderIcon(icon)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Folder
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewFolderName('');
                                        setNewFolderColor(FOLDER_COLORS[0]);
                                        setNewFolderIcon(FOLDER_ICONS[0]);
                                    }}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing Folders */}
                <div className="space-y-2">
                    {folders.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                            No folders created yet. Create your first folder to organize your bookmarks.
                        </p>
                    ) : (
                        folders.map(folder => {
                            const bookmarkCount = getBookmarksByFolder(folder.id).length;
                            const isEditing = editingFolder === folder.id;

                            return (
                                <div
                                    key={folder.id}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                                >
                                    {isEditing ? (
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            />

                                            {/* Color Picker */}
                                            <div className="flex flex-wrap gap-1">
                                                {FOLDER_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setEditColor(color)}
                                                        className={`w-6 h-6 rounded-full border ${editColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {editColor === color && (
                                                            <HiCheck className="w-3 h-3 text-white mx-auto" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleEditSave}
                                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                >
                                                    <HiCheck className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={handleEditCancel}
                                                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                                >
                                                    <HiX className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: folder.color }}
                                                />
                                                {getFolderIcon(folder.icon)}
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {folder.name}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                        ({bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''})
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditStart(folder)}
                                                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    title="Edit folder"
                                                >
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(folder.id)}
                                                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                    title="Delete folder"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};