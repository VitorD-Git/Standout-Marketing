
import React from 'react';
import { AuditLogEntry } from '../types';
import { UserCircleIcon, CalendarDaysIcon, TagIcon } from './icons/IconComponents'; // Assuming TagIcon can represent 'event' or similar detail

interface AuditLogDisplayProps {
  auditLog: AuditLogEntry[];
}

const AuditLogDisplay: React.FC<AuditLogDisplayProps> = ({ auditLog }) => {
  if (!auditLog || auditLog.length === 0) {
    return <p className="text-sm text-secondary-500">No activity recorded for this post yet.</p>;
  }

  // Sort logs, newest first
  const sortedLog = [...auditLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
      {sortedLog.map(entry => (
        <div key={entry.id} className="p-3 border border-secondary-200 rounded-md bg-secondary-50 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-primary-700">{entry.event}</p>
            <p className="text-xs text-secondary-500 flex items-center">
              <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-secondary-400" />
              {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-xs text-secondary-600 mb-1 flex items-center">
            <UserCircleIcon className="w-3.5 h-3.5 mr-1 text-secondary-400" />
            By: <span className="font-medium ml-1">{entry.userName}</span> (ID: {entry.userId})
          </div>
          
          {entry.details && (
            <p className="text-sm text-secondary-700 bg-white p-2 rounded border border-secondary-100 my-1">
              <span className="font-medium">Details:</span> {entry.details}
            </p>
          )}

          {(entry.oldValue || entry.newValue) && (
             <div className="text-xs text-secondary-600 mt-1 space-y-0.5">
                {entry.oldValue && <div><span className="font-medium text-red-600">Old:</span> {entry.oldValue}</div>}
                {entry.newValue && <div><span className="font-medium text-green-600">New:</span> {entry.newValue}</div>}
            </div>
          )}
          
          {entry.cardId && (
            <p className="text-xs text-secondary-500 mt-1 flex items-center">
                <TagIcon className="w-3.5 h-3.5 mr-1 text-secondary-400" /> {/* Re-using TagIcon as a generic detail icon */}
                Related Card ID: {entry.cardId}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AuditLogDisplay;
