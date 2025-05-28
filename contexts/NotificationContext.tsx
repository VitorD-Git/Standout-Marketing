
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AppNotification, NotificationType, User } from '../types';
import { generateId } from '../constants';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  getNotificationsForCurrentUser: () => AppNotification[];
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications).map((n:AppNotification) => ({...n, timestamp: new Date(n.timestamp)})));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: AppNotification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    if (authContext?.currentUser) {
      const currentUserId = authContext.currentUser.id;
      setNotifications(prev => 
        prev.map(n => (n.recipientId === currentUserId && !n.isRead) ? { ...n, isRead: true } : n)
      );
    }
  };
  
  const getNotificationsForCurrentUser = (): AppNotification[] => {
    if (!authContext?.currentUser) return [];
    return notifications.filter(n => n.recipientId === authContext.currentUser?.id);
  };


  return (
    <NotificationContext.Provider value={{ notifications: getNotificationsForCurrentUser(), addNotification, markAsRead, markAllAsRead, getNotificationsForCurrentUser }}>
      {children}
    </NotificationContext.Provider>
  );
};
