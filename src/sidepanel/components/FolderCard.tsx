import React from 'react';
import { useBookmarks } from '../BookmarkContext';
import { useTheme } from '../ThemeContext';
import { BookmarkFolder } from '../../types/Bookmark';
import { HiOutlineFolder, HiChevronRight } from 'react-icons/hi';

interface FolderCardProps {
    folder: BookmarkFolder;
    onClick?: () => void;
    isSelected?: boolean;
    className?: string;
}

export const FolderCard: React.FC<FolderCardProps> = ({
    folder,
    onClick,
    isSelected = false,
    className = ''
}) => {
    const { getBookmarksByFolder } = useBookmarks();
    const { theme } = useTheme();

    const bookmarkCount = getBookmarksByFolder(folder.id).length;

    const getFolderIcon = (iconName?: string) => {
        // Return appropriate icon component based on iconName
        // For now, using a default folder icon
        return <HiOutlineFolder className="w-5 h-5" />;
    };

    return (
        <div
            onClick={onClick}
            className={`
        folder-card p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
        ${className}
      `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {/* Folder Color Indicator */}
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                    />

                    {/* Folder Icon */}
                    <div className="text-gray-600 dark:text-gray-400">
                        {getFolderIcon(folder.icon)}
                    </div>

                    {/* Folder Name and Count */}
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {folder.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Arrow indicator */}
                {onClick && (
                    <HiChevronRight className="w-4 h-4 text-gray-400" />
                )}
            </div>
        </div>
    );
};