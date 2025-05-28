
import React, { useState, useContext, useEffect } from 'react';
import { AdminContext } from '../../contexts/AdminContext';
import { Release, ReleaseCreationData } from '../../types';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PlusIcon, EditIcon, TrashIcon, ArchiveBoxIcon as PageIcon, CalendarDaysIcon } from '../../components/icons/IconComponents';

const AdminReleasesPage: React.FC = () => {
  const adminContext = useContext(AdminContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRelease, setCurrentRelease] = useState<Release | null>(null);
  const [releaseName, setReleaseName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (adminContext && !adminContext.isLoading && adminContext.releases.length === 0) {
        adminContext.fetchAdminData(); // Ensure data is fetched
    }
  }, [adminContext]);

  if (!adminContext || adminContext.isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading releases..." /></div>;
  }

  const { releases, addRelease, updateRelease, deleteRelease } = adminContext;

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const openModalForCreate = () => {
    setCurrentRelease(null);
    setReleaseName('');
    setStartDate('');
    setEndDate('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (release: Release) => {
    setCurrentRelease(release);
    setReleaseName(release.name);
    setStartDate(formatDateForInput(release.startDate));
    setEndDate(formatDateForInput(release.endDate));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentRelease(null);
    // Reset form fields
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseName.trim()) {
      setFormError('Release name cannot be empty.');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setFormError('Start date cannot be after end date.');
        return;
    }
    setFormError('');

    const releaseData: ReleaseCreationData = { 
        name: releaseName.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    };

    if (currentRelease) {
      await updateRelease(currentRelease.id, releaseData);
    } else {
      await addRelease(releaseData);
    }
    handleModalClose();
  };

  const handleDelete = async (releaseId: string) => {
    if (window.confirm('Are you sure you want to delete this release? This action cannot be undone.')) {
      await deleteRelease(releaseId);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
            <PageIcon className="w-7 h-7 mr-2 text-primary-600"/> Release Management
        </h1>
        <button
          onClick={openModalForCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add New Release
        </button>
      </div>

      {releases.length === 0 ? (
        <p className="text-center text-secondary-500 py-8">No releases found. Add one to get started!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Start Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">End Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {releases.map((release) => (
                <tr key={release.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{release.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{release.startDate ? formatDateForInput(release.startDate) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{release.endDate ? formatDateForInput(release.endDate) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openModalForEdit(release)} className="text-primary-600 hover:text-primary-800 transition-colors p-1" title="Edit Release">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(release.id)} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Delete Release">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={currentRelease ? 'Edit Release' : 'Add New Release'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="releaseName" className="block text-sm font-medium text-secondary-700">Release Name</label>
            <input
              type="text" id="releaseName" value={releaseName} onChange={(e) => setReleaseName(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${formError && !releaseName.trim() ? 'border-red-500' : 'border-secondary-300'}`}
              required
            />
             {formError && !releaseName.trim() && <p className="text-xs text-red-500 mt-1">{formError}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700">Start Date (Optional)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDaysIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-secondary-700">End Date (Optional)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDaysIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
          </div>
          {formError && (startDate && endDate && new Date(startDate) > new Date(endDate)) && <p className="text-xs text-red-500 mt-1">{formError}</p>}
          
          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={handleModalClose} className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{currentRelease ? 'Save Changes' : 'Create Release'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminReleasesPage;
