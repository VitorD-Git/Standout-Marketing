
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children?: JSX.Element; // Allow children for specific component routes or use Outlet for nested routes
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    // This case should ideally not be reached if AuthProvider is at the root
    return <Navigate to="/login" replace />;
  }

  const { currentUser, isLoading } = authContext;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner text="Verifying admin access..." />
      </div>
    );
  }

  if (!currentUser) {
    // Should have been caught by ProtectedRoute, but good to double check
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== UserRole.ADMIN) {
    // User is logged in but not an admin
    // You could redirect to a "Not Authorized" page or back to dashboard
    return <Navigate to="/" replace />; 
  }

  return children ? children : <Outlet /> ; // Render children if provided (for single component routes) or Outlet for nested routes
};

export default AdminRoute;
