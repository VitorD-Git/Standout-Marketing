
import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PostProvider } from './contexts/PostContext';
import { AdminProvider } from './contexts/AdminContext'; 
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/LoadingSpinner';
import CreatePostPage from './pages/CreatePostPage';
import { EditPostPage } from './pages/EditPostPage'; 
import AdminRoute from './components/AdminRoute'; 
import AdminDashboardPage from './pages/admin/AdminDashboardPage'; 
import AdminTagsPage from './pages/admin/AdminTagsPage'; 
import AdminReleasesPage from './pages/admin/AdminReleasesPage'; 
import PostListPage from './pages/PostListPage'; 
import AllNotificationsPage from './pages/AllNotificationsPage'; 
import ApprovalTasksPage from './pages/ApprovalTasksPage'; 
import CalendarPage from './pages/CalendarPage'; 
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage'; // Added for RF039


interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return <Navigate to="/login" replace />;
  }

  const { currentUser, isLoading } = authContext;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="Authenticating..." /></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PostProvider>
          <AdminProvider> 
            <HashRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route 
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="posts" element={<PostListPage />} />
                  <Route path="posts/new" element={<CreatePostPage />} />
                  <Route path="posts/:postId/edit" element={<EditPostPage />} /> 
                  <Route path="approval-tasks" element={<ApprovalTasksPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={<AdminRoute />}> 
                    <Route index element={<AdminDashboardPage />} /> 
                    <Route path="tags" element={<AdminTagsPage />} />
                    <Route path="releases" element={<AdminReleasesPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} /> 
                  </Route>
                  
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="notifications" element={<AllNotificationsPage />} />
                  <Route path="settings/notifications" element={<NotificationSettingsPage />} /> {/* Added for RF039 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </HashRouter>
          </AdminProvider>
        </PostProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
