import React, { useState } from 'react';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';
import { HiOutlineFolderAdd, HiOutlineFolder, HiPlus, HiCheck } from 'react-icons/hi';

interface FolderSelectorProps {
    selectedFolderId?: string;
    onFolderSelect: (folderId?: string) => void;
    onCreateFolder?: (name: string, color: string, icon?: string) => Promise<void>;
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

export const FolderSelector: React.FC<FolderSelectorProps> = ({
    selectedFolderId,
    onFolderSelect,
    onCreateFolder,
    className = ''
}) => {
    const { folders } = useBookmarks();
    const { theme } = useTheme();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
    const [newFolderIcon, setNewFolderIcon] = useState(FOLDER_ICONS[0]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !onCreateFolder) return;

        try {
            await onCreateFolder(newFolderName.trim(), newFolderColor, newFolderIcon);
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
        <div className={`folder-selector ${className}`}>
            <div className="space-y-2">
                {/* No Folder Option */}
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                        type="radio"
                        name="folder"
                        checked={!selectedFolderId}
                        onChange={() => onFolderSelect(undefined)}
                        className="text-blue-600"
                    />
                    <span className="text-sm">No folder</span>
                </label>

                {/* Existing Folders */}
                {folders.map(folder => (
                    <label
                        key={folder.id}
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <input
                            type="radio"
                            name="folder"
                            checked={selectedFolderId === folder.id}
                            onChange={() => onFolderSelect(folder.id)}
                            className="text-blue-600"
                        />
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: folder.color }}
                        />
                        {getFolderIcon(folder.icon)}
                        <span className="text-sm">{folder.name}</span>
                    </label>
                ))}

                {/* Create New Folder */}
                {onCreateFolder && (
                    <div className="border-t pt-2 mt-2">
                        {!showCreateForm ? (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <HiPlus className="w-4 h-4" />
                                <span>Create new folder</span>
                            </button>
                        ) : (
                            <div className="space-y-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
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
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Color</label>
                                    <div className="flex flex-wrap gap-1">
                                        {FOLDER_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewFolderColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${newFolderColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {newFolderColor === color && (
                                                    <HiCheck className="w-3 h-3 text-white mx-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Icon</label>
                                    <div className="flex flex-wrap gap-1">
                                        {FOLDER_ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                onClick={() => setNewFolderIcon(icon)}
                                                className={`p-1 rounded border ${newFolderIcon === icon
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
                                        className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setNewFolderName('');
                                            setNewFolderColor(FOLDER_COLORS[0]);
                                            setNewFolderIcon(FOLDER_ICONS[0]);
                                        }}
                                        className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};