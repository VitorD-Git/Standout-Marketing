
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ApproverDesignation, AdminSettings, UserNotificationPreferences } from '../types';
import { INITIAL_USERS, INITIAL_ADMIN_SETTINGS, generateId } from '../constants'; 

export interface AuthContextType {
  currentUser: User | null;
  allUsers: User[]; 
  isLoading: boolean;
  login: (email: string) => Promise<User | null>; 
  logout: () => void;
  updateUser: (updatedUser: User) => void; 
  updateUserRoleAndDesignation: (userId: string, newRole: UserRole, newDesignation?: ApproverDesignation) => Promise<User | null>;
  updateUserNotificationPreferences: (userId: string, preferences: Partial<UserNotificationPreferences>) => Promise<User | null>; // Added for RF039
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const defaultNotificationPreferences: UserNotificationPreferences = { // Defined for new users
  receiveInAppNewSubmissions: true,
  receiveInAppApprovalDecisions: true,
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('allUsers');
    // Ensure initial users have default preferences if not already set
    const initialWithPrefs = INITIAL_USERS.map(u => ({ ...u, notificationPreferences: u.notificationPreferences || { ...defaultNotificationPreferences }}));
    return storedUsers ? JSON.parse(storedUsers).map((u: User) => ({...u, notificationPreferences: u.notificationPreferences || {...defaultNotificationPreferences}})) : initialWithPrefs;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [effectiveRestrictedDomain, setEffectiveRestrictedDomain] = useState<string>(INITIAL_ADMIN_SETTINGS.restrictedDomain);

  useEffect(() => {
    const storedCurrentUser = localStorage.getItem('currentUser');
    if (storedCurrentUser) {
      const user = JSON.parse(storedCurrentUser);
      setCurrentUser({...user, notificationPreferences: user.notificationPreferences || {...defaultNotificationPreferences}});
    }
    
    const storedAdminSettings = localStorage.getItem('adminSettings');
    if (storedAdminSettings) {
      try {
        const settings: AdminSettings = JSON.parse(storedAdminSettings);
        if (settings.restrictedDomain) {
          setEffectiveRestrictedDomain(settings.restrictedDomain.toLowerCase());
        }
      } catch (e) {
        console.error("Failed to parse admin settings from localStorage", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
  }, [allUsers]);

  const login = async (email: string): Promise<User | null> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 
    
    const lowerEmail = email.toLowerCase();
    const emailDomain = lowerEmail.split('@')[1];

    if (!emailDomain || emailDomain !== effectiveRestrictedDomain) {
      console.warn(`Login attempt for ${lowerEmail} failed. Domain '${emailDomain}' is not permitted. Allowed: '${effectiveRestrictedDomain}'.`);
      setIsLoading(false);
      return null;
    }

    let user = allUsers.find(u => u.email.toLowerCase() === lowerEmail);

    if (!user) {
      const namePrefix = lowerEmail.split('@')[0];
      const derivedName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);

      user = { 
        id: generateId(), 
        name: derivedName || `User ${generateId().slice(0,4)}`, 
        email: lowerEmail, 
        role: UserRole.EDITOR,
        notificationPreferences: { ...defaultNotificationPreferences } // Assign defaults
      };
      setAllUsers(prevUsers => [...prevUsers, user!]);
      console.log(`New user created for allowed domain ${effectiveRestrictedDomain}: ${lowerEmail}`);
    }
    
    if (user) {
      const existingUserDomain = user.email.split('@')[1];
      if (existingUserDomain !== effectiveRestrictedDomain) {
         console.warn(`Login attempt for existing user ${user.email} failed. Their domain '${existingUserDomain}' no longer matches the restricted domain '${effectiveRestrictedDomain}'.`);
         setIsLoading(false);
         return null;
      }
      const userWithPrefs = {...user, notificationPreferences: user.notificationPreferences || {...defaultNotificationPreferences}};
      setCurrentUser(userWithPrefs);
      localStorage.setItem('currentUser', JSON.stringify(userWithPrefs));
    }
    
    setIsLoading(false);
    return user ? {...user, notificationPreferences: user.notificationPreferences || {...defaultNotificationPreferences}} : null;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };
  
  const updateUser = (updatedUser: User) => {
    const userWithPrefs = {...updatedUser, notificationPreferences: updatedUser.notificationPreferences || currentUser?.notificationPreferences || {...defaultNotificationPreferences}};
    if (currentUser && currentUser.id === userWithPrefs.id) {
      setCurrentUser(userWithPrefs);
      localStorage.setItem('currentUser', JSON.stringify(userWithPrefs));
    }
    setAllUsers(prevUsers => prevUsers.map(u => u.id === userWithPrefs.id ? userWithPrefs : u));
  };

  const updateUserRoleAndDesignation = async (
    userId: string, 
    newRole: UserRole, 
    newDesignation?: ApproverDesignation
  ): Promise<User | null> => {
    let updatedUserRef: User | null = null;
    
    setAllUsers(prevAllUsers => {
      const newAllUsers = prevAllUsers.map(user => {
        if (user.id === userId) {
          updatedUserRef = {
            ...user,
            role: newRole,
            approverDesignation: newRole === UserRole.APPROVER ? newDesignation : undefined,
            // Notification preferences remain as they were, or could be reset if role changes significantly
          };
          return updatedUserRef;
        }
        return user;
      });
      return newAllUsers;
    });

    if (currentUser && currentUser.id === userId && updatedUserRef) {
      setCurrentUser(updatedUserRef); // existing preferences are preserved
      localStorage.setItem('currentUser', JSON.stringify(updatedUserRef));
    }
    
    return updatedUserRef;
  };

  const updateUserNotificationPreferences = async (
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<User | null> => {
    let updatedUser: User | null = null;
    setAllUsers(prevAllUsers => 
      prevAllUsers.map(user => {
        if (user.id === userId) {
          updatedUser = { 
            ...user, 
            notificationPreferences: {
              ...(user.notificationPreferences || defaultNotificationPreferences), // Start with existing or defaults
              ...preferences // Apply partial updates
            }
          };
          return updatedUser;
        }
        return user;
      })
    );

    if (currentUser && currentUser.id === userId && updatedUser) {
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      allUsers, 
      isLoading, 
      login, 
      logout, 
      updateUser,
      updateUserRoleAndDesignation,
      updateUserNotificationPreferences // Expose new function
    }}>
      {children}
    </AuthContext.Provider>
  );
};
