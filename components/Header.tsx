
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { BellIcon, UserCircleIcon, ChevronDownIcon, HomeIcon, Cog6ToothIcon, AdjustmentsHorizontalIcon } from './icons/IconComponents'; // Added AdjustmentsHorizontalIcon for settings
import { UserRole } from '../types';
import NotificationPanel from './NotificationPanel';
import { APP_NAME } from '../constants';


const Header: React.FC = () => {
  const authContext = useContext(AuthContext);
  const notificationContext = useContext(NotificationContext);
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  if (!authContext || !notificationContext) {
    return <header className="bg-primary-700 text-white p-4 shadow-md">Loading context...</header>;
  }

  const { currentUser, logout } = authContext;
  const { notifications, markAllAsRead } = notificationContext;

  const unreadNotificationsCount = notifications.filter(n => !n.isRead && n.recipientId === currentUser?.id).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-primary-700 text-white p-4 shadow-md flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold hover:text-primary-200 transition-colors">
        {APP_NAME}
      </Link>
      
      {currentUser && (
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              className="relative text-primary-200 hover:text-white focus:outline-none transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-primary-700" />
              )}
            </button>
            {notificationPanelOpen && (
              <NotificationPanel 
                onClose={() => setNotificationPanelOpen(false)} 
                onMarkAllRead={markAllAsRead}
              />
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center text-primary-200 hover:text-white focus:outline-none transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <UserCircleIcon className="w-8 h-8 mr-2" />
              <span>{currentUser.name}</span>
              <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 text-secondary-700">
                <div className="px-4 py-2 text-sm text-secondary-500 border-b">
                  {currentUser.email}<br/>
                  <span className="font-semibold">{currentUser.role} {currentUser.approverDesignation ? `(${currentUser.approverDesignation})` : ''}</span>
                </div>
                <Link to="/" className="flex items-center px-4 py-2 text-sm hover:bg-primary-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                  <HomeIcon className="w-4 h-4 mr-2" />Dashboard
                </Link>
                {currentUser.role === UserRole.ADMIN && (
                  <Link to="/admin" className="flex items-center px-4 py-2 text-sm hover:bg-primary-100 transition-colors" onClick={() => setUserMenuOpen(false)}> 
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />Admin Panel
                  </Link>
                )}
                <Link to="/settings/notifications" className="flex items-center px-4 py-2 text-sm hover:bg-primary-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                  <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />Notification Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
