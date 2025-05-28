
import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, TagIcon, ArchiveBoxIcon, Cog6ToothIcon } from '../../components/icons/IconComponents';

const AdminDashboardPage: React.FC = () => {
  const adminSections = [
    { name: "User Management", path: "/admin/users", icon: <UsersIcon className="w-12 h-12 text-primary-500 mb-3"/>, description: "Manage user accounts, roles, and permissions." },
    { name: "Tag Management", path: "/admin/tags", icon: <TagIcon className="w-12 h-12 text-primary-500 mb-3"/>, description: "Create, edit, and delete global tags for posts." },
    { name: "Release Management", path: "/admin/releases", icon: <ArchiveBoxIcon className="w-12 h-12 text-primary-500 mb-3"/>, description: "Manage releases or campaigns for grouping posts." },
    { name: "System Settings", path: "/admin/settings", icon: <Cog6ToothIcon className="w-12 h-12 text-primary-500 mb-3"/>, description: "Configure system-wide settings and parameters." },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link 
            key={section.name}
            to={section.path} 
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-150 ease-in-out transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              {section.icon}
              <h2 className="text-xl font-semibold text-secondary-700 mb-2">{section.name}</h2>
              <p className="text-sm text-secondary-500">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-primary-50 rounded-lg border border-primary-200">
        <h3 className="text-xl font-semibold text-primary-700 mb-3">Quick Stats (Placeholder)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary-600">125</p>
            <p className="text-sm text-primary-500">Total Posts</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-600">15</p>
            <p className="text-sm text-primary-500">Active Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-600">5</p>
            <p className="text-sm text-primary-500">Pending Approvals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
