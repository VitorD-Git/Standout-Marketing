
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import { AppNotification } from '../types';
import { EyeIcon, CheckCircleIcon } from './icons/IconComponents';

interface NotificationPanelProps {
  onClose: () => void;
  onMarkAllRead: () => void; 
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onMarkAllRead }) => {
  const notificationContext = useContext(NotificationContext);

  if (!notificationContext) return null;

  const { notifications, markAsRead } = notificationContext;
  // Show only last 10 or so notifications for brevity in panel
  const displayedNotifications = notifications.slice().reverse().slice(0, 10); 

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllReadClick = () => {
    onMarkAllRead();
    // Potentially close panel or give feedback
  };

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg z-30 border border-secondary-200">
      <div className="p-3 border-b border-secondary-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-secondary-700">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
           <button 
            onClick={handleMarkAllReadClick}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center"
            title="Mark all as read"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" /> Mark all read
          </button>
        )}
      </div>
      {displayedNotifications.length === 0 ? (
        <p className="p-4 text-sm text-secondary-500">No new notifications.</p>
      ) : (
        <ul className="max-h-96 overflow-y-auto divide-y divide-secondary-100">
          {displayedNotifications.map((notification: AppNotification) => (
            <li 
              key={notification.id} 
              className={`p-3 hover:bg-secondary-50 ${notification.isRead ? 'opacity-70' : 'font-semibold'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-secondary-800">{notification.message}</p>
                  {notification.postTitle && (
                    <p className="text-xs text-primary-600">Post: {notification.postTitle}</p>
                  )}
                  <p className="text-xs text-secondary-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="ml-2 flex flex-col space-y-1 items-end">
                  {notification.postId && (
                    <Link
                      to={`/posts/${notification.postId}`}
                      onClick={() => { handleMarkAsRead(notification.id); onClose(); }}
                      className="text-xs text-primary-500 hover:text-primary-700 p-1 rounded hover:bg-primary-100"
                      title="View Post"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-100"
                      title="Mark as read"
                    >
                       <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {notifications.length > 10 && (
        <div className="p-2 text-center border-t border-secondary-200">
            <Link to="/notifications" onClick={onClose} className="text-sm text-primary-600 hover:underline">View all notifications</Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
