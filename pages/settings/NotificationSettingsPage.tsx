
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { UserNotificationPreferences, NotificationType } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Cog6ToothIcon as PageIcon, CheckCircleIcon } from '../../components/icons/IconComponents';

const NotificationSettingsPage: React.FC = () => {
  const authContext = useContext(AuthContext) as AuthContextType;
  const notificationContext = useContext(NotificationContext);

  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    receiveInAppNewSubmissions: true,
    receiveInAppApprovalDecisions: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authContext?.currentUser?.notificationPreferences) {
      setPreferences(authContext.currentUser.notificationPreferences);
    }
  }, [authContext?.currentUser]);

  if (!authContext || authContext.isLoading || !notificationContext) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading settings..." /></div>;
  }

  const { currentUser, updateUserNotificationPreferences } = authContext; 
  const { addNotification } = notificationContext;
  

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveChanges = async () => {
    if (!currentUser || !updateUserNotificationPreferences) return;
    setIsSubmitting(true);
    try {
      await updateUserNotificationPreferences(currentUser.id, preferences);
      addNotification({
        type: NotificationType.GENERIC_SUCCESS,
        message: 'Notification preferences updated successfully!',
        recipientId: currentUser.id,
      });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      addNotification({
        type: NotificationType.GENERIC_ERROR,
        message: 'Failed to update preferences. Please try again.',
        recipientId: currentUser.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p className="p-6 text-center">Please log in to manage settings.</p>;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg max-w-2xl mx-auto">
      <div className="flex items-center mb-6 border-b pb-4">
        <PageIcon className="w-7 h-7 mr-3 text-primary-600" />
        <h1 className="text-2xl font-bold text-secondary-800">Notification Settings</h1>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-secondary-600">
          Manage your in-app notification preferences. Deadline reminders for your pending approval tasks will always be active and cannot be disabled.
        </p>

        <div className="space-y-4">
          {(Object.keys(preferences) as Array<keyof UserNotificationPreferences>).map((key) => (
            <div key={key} className="flex items-center justify-between p-4 border border-secondary-200 rounded-md hover:bg-secondary-50 transition-colors">
              <label htmlFor={key} className="text-sm font-medium text-secondary-700 cursor-pointer">
                {key === 'receiveInAppNewSubmissions' && "Receive In-App Notifications for New/Resubmitted Posts"}
                {key === 'receiveInAppApprovalDecisions' && "Receive In-App Notifications for Approval Decisions on My Posts"}
              </label>
              <button
                id={key}
                onClick={() => handleToggle(key)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  preferences[key] ? 'bg-primary-600' : 'bg-secondary-300'
                }`}
                aria-checked={preferences[key]}
                role="switch"
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    preferences[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSaveChanges}
            className="btn-primary flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" color="text-white mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2"/>}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;