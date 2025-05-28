
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { AuthContext } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const authContext = React.useContext(AuthContext);
  const isLoggedIn = authContext?.currentUser != null;

  return (
    <div className="flex flex-col h-screen">
      {isLoggedIn && <Header />}
      <div className="flex flex-1 overflow-hidden">
        {isLoggedIn && <Sidebar />}
        <main className="flex-1 p-6 overflow-y-auto bg-secondary-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
