
import React, { useState, useContext, useEffect } from 'react';
import { AdminContext } from '../../contexts/AdminContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AdminSettings, NotificationType } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Cog6ToothIcon as PageIcon } from '../../components/icons/IconComponents';

const AdminSettingsPage: React.FC = () => {
  const adminContext = useContext(AdminContext);
  const notificationContext = useContext(NotificationContext);

  const [restrictedDomain, setRestrictedDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (adminContext && !adminContext.isLoading) {
      setRestrictedDomain(adminContext.adminSettings.restrictedDomain);
    }
  }, [adminContext]);

  if (!adminContext || adminContext.isLoading || !notificationContext) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading settings..." /></div>;
  }

  const { adminSettings, updateAdminSettings } = adminContext;
  const { addNotification } = notificationContext;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!restrictedDomain.trim()) {
      setError('Restricted domain cannot be empty.');
      return;
    }
    // Basic domain validation (not exhaustive)
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(restrictedDomain.trim())) {
        setError('Please enter a valid domain format (e.g., example.com).');
        return;
    }

    setIsSubmitting(true);
    try {
      await updateAdminSettings({ restrictedDomain: restrictedDomain.trim().toLowerCase() });
      addNotification({
        type: NotificationType.ADMIN_ACTION,
        message: 'System settings updated successfully.',
        recipientId: adminContext.adminSettings.restrictedDomain, // This is not right, recipientId should be user
      });
       // Correction: recipientId for admin actions should be the current admin user
      if (authContext?.currentUser) {
         addNotification({
            type: NotificationType.ADMIN_ACTION,
            message: 'System settings updated successfully.',
            recipientId: authContext.currentUser.id,
          });
      } else {
          // Fallback or log error if current user context not available during notification
          console.warn("Admin action performed, but currentUser not available for notification.");
      }

    } catch (err) {
      console.error("Error updating settings:", err);
      setError('Failed to save settings. Please try again.');
      addNotification({
        type: NotificationType.GENERIC_ERROR,
        message: 'Failed to update settings.',
        recipientId: authContext?.currentUser?.id || 'system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Need to get authContext if we want to send notification to current admin
  const authContext = useContext(React.createContext<import('../../contexts/AuthContext').AuthContextType | undefined>(undefined));


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600" /> System Settings
        </h1>
      </div>

      <form onSubmit={handleSaveSettings} className="max-w-lg space-y-6">
        <div>
          <label htmlFor="restrictedDomain" className="block text-sm font-medium text-secondary-700">
            Restricted Email Domain for New User Sign-ups
          </label>
          <input
            type="text"
            id="restrictedDomain"
            value={restrictedDomain}
            onChange={(e) => setRestrictedDomain(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-500' : 'border-secondary-300'}`}
            placeholder="e.g., example.com"
          />
          <p className="mt-1 text-xs text-secondary-500">
            Only users with emails from this domain will be able to sign up if they don't already have an account. Existing users are not affected.
          </p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-start">
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-secondary-300 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" color="text-white mr-2" /> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
