
import React from 'react';
import { VersionHistory, User } from '../types';
import { UserCircleIcon, CalendarDaysIcon, ArrowPathIcon } from './icons/IconComponents'; // Added ArrowPathIcon for restore

interface VersionHistoryViewerProps {
  history: VersionHistory<string | undefined>[];
  fieldName: string;
  allUsers: User[];
  onRestore?: (valueToRestore: string | undefined) => void; // Optional restore callback
}

const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({ history, fieldName, allUsers, onRestore }) => {
  if (!history || history.length === 0) {
    return <p className="text-sm text-secondary-500">No history available for {fieldName}.</p>;
  }

  const getUserName = (userId: string): string => {
    return allUsers.find(u => u.id === userId)?.name || 'Unknown User';
  };

  // Sort by timestamp, newest first
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const isArtField = fieldName.toLowerCase().includes('art');

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
      {sortedHistory.map((entry, index) => (
        <div key={index} className="p-3 border border-secondary-200 rounded-md bg-secondary-50 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5">
            <div className="text-xs text-secondary-600 flex items-center mb-1 sm:mb-0">
              <UserCircleIcon className="w-4 h-4 mr-1.5 text-secondary-400 flex-shrink-0" />
              Changed by: <span className="font-medium ml-1">{getUserName(entry.userId)}</span>
            </div>
            <div className="text-xs text-secondary-500 flex items-center">
              <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-secondary-400 flex-shrink-0" />
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          
          <div className="mt-1 p-2 bg-white rounded border border-secondary-100">
            {isArtField ? (
              entry.value && entry.value.startsWith('data:image/') ? (
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Art Preview:</p>
                  <img src={entry.value} alt={`Version ${index + 1} of ${fieldName}`} className="max-w-xs max-h-32 object-contain border rounded"/>
                </div>
              ) : (
                <p className="text-sm text-secondary-700">
                  {entry.value ? `Art File Ref: ${entry.value.substring(0,50)}${entry.value.length > 50 ? '...' : ''}` : <span className="italic text-secondary-400">Art Removed</span>}
                </p>
              )
            ) : (
              <p className="text-sm text-secondary-700 whitespace-pre-wrap">{entry.value || <span className="italic text-secondary-400">Field was empty</span>}</p>
            )}
          </div>
          {onRestore && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => onRestore(entry.value)}
                className="px-2.5 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center"
                title="Restore this version to the current editor. You will still need to save the changes."
              >
                <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                Restore this version
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VersionHistoryViewer;
