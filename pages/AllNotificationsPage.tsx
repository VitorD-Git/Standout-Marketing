
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import { AuthContext } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { EyeIcon, CheckCircleIcon, BellIcon as PageIcon } from '../components/icons/IconComponents';
import LoadingSpinner from '../components/LoadingSpinner';

const AllNotificationsPage: React.FC = () => {
  const notificationContext = useContext(NotificationContext);
  const authContext = useContext(AuthContext);

  if (!notificationContext || !authContext) {
    return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner text="Loading notification data..." /></div>;
  }

  const { notifications, markAsRead, markAllAsRead } = notificationContext;
  const { currentUser } = authContext;

  if (!currentUser) {
    return <p className="p-4 text-center text-secondary-600">Please log in to see your notifications.</p>;
  }
  
  // Notifications from context are already filtered for the current user
  const userNotifications = notifications.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleMarkSingleAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center mb-3 sm:mb-0">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600" />
          All My Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center self-start sm:self-center"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Mark all as Read ({unreadCount})
          </button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <div className="text-center py-10">
          <PageIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-xl text-secondary-500">You're all caught up!</p>
          <p className="text-sm text-secondary-400">You have no notifications at the moment.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {userNotifications.map((notification: AppNotification) => (
            <li
              key={notification.id}
              className={`p-4 rounded-lg border transition-all duration-150 ease-in-out
                          ${notification.isRead ? 'bg-secondary-50 border-secondary-200 opacity-80 hover:opacity-100' : 'bg-primary-50 border-primary-200 shadow-sm hover:shadow-md'}`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-1">
                  <p className={`text-sm ${notification.isRead ? 'text-secondary-700' : 'text-primary-700 font-semibold'}`}>
                    {notification.message}
                  </p>
                  {notification.postTitle && (
                    <p className="text-xs text-primary-600 mt-1">
                      Post: <span className="font-medium">{notification.postTitle}</span>
                    </p>
                  )}
                  <p className="text-xs text-secondary-400 mt-1.5">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-center flex-shrink-0 mt-2 sm:mt-0">
                  {notification.postId && (
                    <Link
                      to={`/posts/${notification.postId}/edit`}
                      onClick={() => handleMarkSingleAsRead(notification.id)}
                      className="p-1.5 text-primary-500 hover:text-primary-700 rounded-full hover:bg-primary-100"
                      title="View Post"
                      aria-label="View related post"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkSingleAsRead(notification.id)}
                      className="p-1.5 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100"
                      title="Mark as read"
                      aria-label="Mark notification as read"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllNotificationsPage;
