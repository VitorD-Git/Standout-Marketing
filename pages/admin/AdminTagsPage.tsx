
import React, { useState, useContext, useEffect } from 'react';
import { AdminContext } from '../../contexts/AdminContext';
import { Tag, TagCreationData } from '../../types';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PlusIcon, EditIcon, TrashIcon, TagIcon as PageIcon } from '../../components/icons/IconComponents';

const AdminTagsPage: React.FC = () => {
  const adminContext = useContext(AdminContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (adminContext && !adminContext.isLoading && adminContext.tags.length === 0) {
        adminContext.fetchAdminData(); // Ensure data is fetched
    }
  }, [adminContext]);

  if (!adminContext || adminContext.isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading tags..." /></div>;
  }

  const { tags, addTag, updateTag, deleteTag } = adminContext;

  const openModalForCreate = () => {
    setCurrentTag(null);
    setTagName('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (tag: Tag) => {
    setCurrentTag(tag);
    setTagName(tag.name);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentTag(null);
    setTagName('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setFormError('Tag name cannot be empty.');
      return;
    }
    setFormError('');

    const tagData: TagCreationData = { name: tagName.trim() };

    if (currentTag) { // Editing existing tag
      await updateTag(currentTag.id, tagData);
    } else { // Creating new tag
      await addTag(tagData);
    }
    handleModalClose();
  };

  const handleDelete = async (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      // Consider implications: What happens to posts using this tag?
      // For now, it just deletes the tag.
      await deleteTag(tagId);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600"/> Tag Management
        </h1>
        <button
          onClick={openModalForCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add New Tag
        </button>
      </div>

      {tags.length === 0 ? (
        <p className="text-center text-secondary-500 py-8">No tags found. Add one to get started!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{tag.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{tag.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openModalForEdit(tag)} className="text-primary-600 hover:text-primary-800 transition-colors p-1" title="Edit Tag">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="text-red-600 hover:text-red-800 transition-colors p-1" title="Delete Tag">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={currentTag ? 'Edit Tag' : 'Add New Tag'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tagName" className="block text-sm font-medium text-secondary-700">Tag Name</label>
            <input
              type="text"
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${formError ? 'border-red-500' : 'border-secondary-300'}`}
              required
            />
            {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={handleModalClose} className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{currentTag ? 'Save Changes' : 'Create Tag'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTagsPage;
