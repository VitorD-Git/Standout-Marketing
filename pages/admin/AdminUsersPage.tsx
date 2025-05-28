
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { User, UserRole, ApproverDesignation } from '../../types';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { EditIcon, UsersIcon as PageIcon } from '../../components/icons/IconComponents';
import { APPROVER_ROLES as AVAILABLE_DESIGNATIONS } from '../../constants'; // To list available designations

const AdminUsersPage: React.FC = () => {
  const authContext = useContext(AuthContext) as AuthContextType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EDITOR);
  const [selectedDesignation, setSelectedDesignation] = useState<ApproverDesignation | ''>('');
  const [designationWarning, setDesignationWarning] = useState<string | null>(null);
  
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  if (!authContext || authContext.isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading user data..." /></div>;
  }

  const { allUsers, updateUserRoleAndDesignation } = authContext;

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedDesignation(user.approverDesignation || '');
    setDesignationWarning(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setDesignationWarning(null);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setSelectedRole(newRole);
    if (newRole !== UserRole.APPROVER) {
      setSelectedDesignation('');
      setDesignationWarning(null);
    }
  };

  const handleDesignationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDesignation = e.target.value as ApproverDesignation | '';
    setSelectedDesignation(newDesignation);

    if (newDesignation !== '') {
      const currentHolder = allUsers.find(u => u.approverDesignation === newDesignation && u.id !== editingUser?.id);
      if (currentHolder) {
        setDesignationWarning(`Warning: ${newDesignation} is already assigned to ${currentHolder.name}.`);
      } else {
        setDesignationWarning(null);
      }
    } else {
      setDesignationWarning(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;
    setIsLoadingAction(true);

    const finalDesignation = selectedRole === UserRole.APPROVER ? (selectedDesignation === '' ? undefined : selectedDesignation) : undefined;

    await updateUserRoleAndDesignation(editingUser.id, selectedRole, finalDesignation);
    
    setIsLoadingAction(false);
    handleModalClose();
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600" /> User Management
        </h1>
        {/* Potentially an "Add User" button here if not relying on auto-creation or external provisioning */}
      </div>

      {allUsers.length === 0 ? (
        <p className="text-center text-secondary-500 py-8">No users found in the system.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Approver Designation</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {user.role === UserRole.APPROVER && user.approverDesignation ? (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        {user.approverDesignation}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-primary-600 hover:text-primary-800 transition-colors p-1"
                      title="Edit User Roles"
                      disabled={user.id === authContext.currentUser?.id && user.role === UserRole.ADMIN} // Prevent admin from easily de-admining self
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <Modal isOpen={isModalOpen} onClose={handleModalClose} title={`Edit User: ${editingUser.name}`} size="md">
          <div className="space-y-4">
            <div>
              <label htmlFor="userRole" className="block text-sm font-medium text-secondary-700">Role</label>
              <select
                id="userRole"
                name="userRole"
                value={selectedRole}
                onChange={handleRoleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white"
                disabled={editingUser.id === authContext.currentUser?.id && editingUser.role === UserRole.ADMIN} 
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {editingUser.id === authContext.currentUser?.id && editingUser.role === UserRole.ADMIN && (
                <p className="text-xs text-orange-600 mt-1">Admins cannot change their own role.</p>
              )}
            </div>

            {selectedRole === UserRole.APPROVER && (
              <div>
                <label htmlFor="approverDesignation" className="block text-sm font-medium text-secondary-700">Approver Designation</label>
                <select
                  id="approverDesignation"
                  name="approverDesignation"
                  value={selectedDesignation}
                  onChange={handleDesignationChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white"
                >
                  <option value="">None</option>
                  {AVAILABLE_DESIGNATIONS.map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
                {designationWarning && <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mt-1">{designationWarning}</p>}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-3">
              <button type="button" onClick={handleModalClose} className="btn-secondary-outline" disabled={isLoadingAction}>Cancel</button>
              <button 
                type="button" 
                onClick={handleSaveChanges} 
                className="btn-primary flex items-center"
                disabled={isLoadingAction || (editingUser.id === authContext.currentUser?.id && editingUser.role === UserRole.ADMIN && selectedRole !== UserRole.ADMIN)}
              >
                {isLoadingAction && <LoadingSpinner size="sm" color="text-white mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
