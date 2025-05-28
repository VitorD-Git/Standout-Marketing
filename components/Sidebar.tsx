
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { HomeIcon, DocumentTextIcon, CheckCircleIcon, UsersIcon, TagIcon, ArchiveBoxIcon, Cog6ToothIcon, CalendarDaysIcon, PlusIcon, AdjustmentsHorizontalIcon } from './icons/IconComponents';

const Sidebar: React.FC = () => {
  const authContext = useContext(AuthContext);

  if (!authContext || !authContext.currentUser) {
    return null; 
  }

  const { currentUser } = authContext;

  const commonLinks = [
    { to: "/", text: "Dashboard", icon: <HomeIcon /> },
    { to: "/posts", text: "All Posts", icon: <DocumentTextIcon /> },
    { to: "/calendar", text: "Calendar View", icon: <CalendarDaysIcon /> },
  ];

  const userSettingsLinks = [
     { to: "/settings/notifications", text: "Notification Settings", icon: <AdjustmentsHorizontalIcon /> },
  ];

  const editorLinks = [
    { to: "/posts/new", text: "Create Post", icon: <PlusIcon className="w-5 h-5" /> }
  ];
  
  const approverLinks = [
    { to: "/approval-tasks", text: "My Approval Tasks", icon: <CheckCircleIcon /> }
  ];

  const adminBaseLinks = [ 
     { to: "/admin", text: "Admin Dashboard", icon: <Cog6ToothIcon /> }, 
  ];

  const adminManagementLinks = [ 
    { to: "/admin/users", text: "User Management", icon: <UsersIcon /> },
    { to: "/admin/tags", text: "Tag Management", icon: <TagIcon /> }, 
    { to: "/admin/releases", text: "Release Management", icon: <ArchiveBoxIcon /> }, 
    { to: "/admin/settings", text: "System Settings", icon: <Cog6ToothIcon /> }, 
  ];


  let links = [...commonLinks, ...userSettingsLinks]; // Add user settings for all logged in users
  if (currentUser.role === UserRole.EDITOR || currentUser.role === UserRole.ADMIN) {
    editorLinks.forEach(el => { if (!links.find(l => l.to === el.to)) links.push(el);});
  }
  if (currentUser.role === UserRole.APPROVER || currentUser.role === UserRole.ADMIN) {
     approverLinks.forEach(al => { if (!links.find(l => l.to === al.to)) links.push(al);});
  }
  if (currentUser.role === UserRole.ADMIN) {
    adminBaseLinks.forEach(abl => { if(!links.find(l => l.to === abl.to)) links.push(abl);});
    adminManagementLinks.forEach(aml => { if(!links.find(l => l.to === aml.to)) links.push(aml);});
  }
  
  return (
    <aside className="w-64 bg-secondary-800 text-secondary-200 p-4 space-y-2 flex flex-col shadow-lg">
      <nav className="flex-grow">
        <ul>
          {links.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/" || link.to === "/admin"} 
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-secondary-700 hover:text-white transition-colors duration-150 ease-in-out ${
                    isActive ? 'bg-primary-600 text-white font-semibold shadow-inner' : 'text-secondary-300'
                  }`
                }
              >
                {React.cloneElement(link.icon, { className: "w-5 h-5" })}
                <span>{link.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="text-xs text-secondary-500 mt-auto pt-4 border-t border-secondary-700">
        Content Approval System v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
