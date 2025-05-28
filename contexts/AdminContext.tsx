
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Tag, Release, TagCreationData, ReleaseCreationData, AppNotification, NotificationType, UserRole, AdminSettings } from '../types';
import { generateId, INITIAL_TAGS, INITIAL_RELEASES, INITIAL_ADMIN_SETTINGS } from '../constants';
import { AuthContext } from './AuthContext';
import { NotificationContext } from './NotificationContext';

interface AdminContextType {
  tags: Tag[];
  releases: Release[];
  adminSettings: AdminSettings; // Added
  isLoading: boolean;
  fetchAdminData: () => void;
  addTag: (tagData: TagCreationData) => Promise<Tag | null>;
  updateTag: (tagId: string, tagData: TagCreationData) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  addRelease: (releaseData: ReleaseCreationData) => Promise<Release | null>;
  updateRelease: (releaseId: string, releaseData: ReleaseCreationData) => Promise<Release | null>;
  deleteRelease: (releaseId: string) => Promise<boolean>;
  updateAdminSettings: (newSettings: Partial<AdminSettings>) => Promise<void>; // Added
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(INITIAL_ADMIN_SETTINGS); // Added
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const notificationContext = useContext(NotificationContext);

  const getTagsFromStorage = (): Tag[] => {
    const stored = localStorage.getItem('tags');
    return stored ? JSON.parse(stored) : INITIAL_TAGS;
  };

  const getReleasesFromStorage = (): Release[] => {
    const stored = localStorage.getItem('releases');
    if (stored) {
      return JSON.parse(stored).map((r: Release) => ({
        ...r,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
      }));
    }
    return INITIAL_RELEASES.map(r => ({
        ...r,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
    }));
  };

  const getAdminSettingsFromStorage = (): AdminSettings => { // Added
    const stored = localStorage.getItem('adminSettings');
    return stored ? JSON.parse(stored) : INITIAL_ADMIN_SETTINGS;
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    setIsLoading(true);
    setTags(getTagsFromStorage());
    setReleases(getReleasesFromStorage());
    setAdminSettings(getAdminSettingsFromStorage()); // Added
    setIsLoading(false);
  };

  const saveTagsToStorage = (updatedTags: Tag[]) => {
    localStorage.setItem('tags', JSON.stringify(updatedTags));
  };

  const saveReleasesToStorage = (updatedReleases: Release[]) => {
    localStorage.setItem('releases', JSON.stringify(updatedReleases));
  };

  const saveAdminSettingsToStorage = (updatedSettings: AdminSettings) => { // Added
    localStorage.setItem('adminSettings', JSON.stringify(updatedSettings));
  };

  const notifyAdminAction = (message: string) => {
    if (notificationContext && authContext?.currentUser) {
      notificationContext.addNotification({
        type: NotificationType.ADMIN_ACTION,
        message,
        recipientId: authContext.currentUser.id, // Notify the admin who performed action
      });
    }
  };
  
  // --- Tag Management ---
  const addTag = async (tagData: TagCreationData): Promise<Tag | null> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return null;
    const newTag: Tag = { id: generateId(), name: tagData.name };
    const updatedTags = [newTag, ...tags];
    setTags(updatedTags);
    saveTagsToStorage(updatedTags);
    notifyAdminAction(`Tag "${newTag.name}" created.`);
    return newTag;
  };

  const updateTag = async (tagId: string, tagData: TagCreationData): Promise<Tag | null> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return null;
    let updatedTag: Tag | null = null;
    const updatedTags = tags.map(t => {
      if (t.id === tagId) {
        updatedTag = { ...t, name: tagData.name };
        return updatedTag;
      }
      return t;
    });
    if (updatedTag) {
      setTags(updatedTags);
      saveTagsToStorage(updatedTags);
      notifyAdminAction(`Tag "${updatedTag.name}" updated.`);
    }
    return updatedTag;
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return false;
    const tagToDelete = tags.find(t => t.id === tagId);
    if (!tagToDelete) return false;

    const updatedTags = tags.filter(t => t.id !== tagId);
    setTags(updatedTags);
    saveTagsToStorage(updatedTags);
    notifyAdminAction(`Tag "${tagToDelete.name}" deleted.`);
    return true;
  };

  // --- Release Management ---
  const addRelease = async (releaseData: ReleaseCreationData): Promise<Release | null> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return null;
    const newRelease: Release = {
      id: generateId(),
      name: releaseData.name,
      startDate: releaseData.startDate ? new Date(releaseData.startDate) : undefined,
      endDate: releaseData.endDate ? new Date(releaseData.endDate) : undefined,
    };
    const updatedReleases = [newRelease, ...releases];
    setReleases(updatedReleases);
    saveReleasesToStorage(updatedReleases);
    notifyAdminAction(`Release "${newRelease.name}" created.`);
    return newRelease;
  };

  const updateRelease = async (releaseId: string, releaseData: ReleaseCreationData): Promise<Release | null> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return null;
    let updatedRelease: Release | null = null;
    const updatedReleases = releases.map(r => {
      if (r.id === releaseId) {
        updatedRelease = {
          ...r,
          name: releaseData.name,
          startDate: releaseData.startDate ? new Date(releaseData.startDate) : undefined,
          endDate: releaseData.endDate ? new Date(releaseData.endDate) : undefined,
        };
        return updatedRelease;
      }
      return r;
    });
    if (updatedRelease) {
      setReleases(updatedReleases);
      saveReleasesToStorage(updatedReleases);
      notifyAdminAction(`Release "${updatedRelease.name}" updated.`);
    }
    return updatedRelease;
  };

  const deleteRelease = async (releaseId: string): Promise<boolean> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return false;
    const releaseToDelete = releases.find(r => r.id === releaseId);
    if (!releaseToDelete) return false;

    const updatedReleases = releases.filter(r => r.id !== releaseId);
    setReleases(updatedReleases);
    saveReleasesToStorage(updatedReleases);
    notifyAdminAction(`Release "${releaseToDelete.name}" deleted.`);
    return true;
  };

  // --- Admin Settings Management --- // Added
  const updateAdminSettings = async (newSettings: Partial<AdminSettings>): Promise<void> => {
    if (authContext?.currentUser?.role !== UserRole.ADMIN) return;
    const updatedSettings = { ...adminSettings, ...newSettings };
    setAdminSettings(updatedSettings);
    saveAdminSettingsToStorage(updatedSettings);
    notifyAdminAction("System settings updated.");
  };


  return (
    <AdminContext.Provider value={{ 
      tags, releases, adminSettings, isLoading, fetchAdminData, // Added adminSettings
      addTag, updateTag, deleteTag,
      addRelease, updateRelease, deleteRelease,
      updateAdminSettings // Added
    }}>
      {children}
    </AdminContext.Provider>
  );
};
