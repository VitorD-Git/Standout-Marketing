
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { PostContext } from '../contexts/PostContext';
import { AdminContext } from '../contexts/AdminContext'; // Import AdminContext
import { NotificationContext } from '../contexts/NotificationContext';
import { PostCreationData, NotificationType, Tag, Release } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { CalendarDaysIcon, DocumentTextIcon, TagIcon, ArchiveBoxIcon } from '../components/icons/IconComponents';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const postContext = useContext(PostContext);
  const adminContext = useContext(AdminContext); // Use AdminContext
  const notificationContext = useContext(NotificationContext);

  const [title, setTitle] = useState('');
  const [publicationDate, setPublicationDate] = useState<string>('');
  const [generalBriefing, setGeneralBriefing] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableReleases, setAvailableReleases] = useState<Release[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (adminContext) {
      if (adminContext.tags.length === 0 && !adminContext.isLoading) adminContext.fetchAdminData();
      setAvailableTags(adminContext.tags);
      setAvailableReleases(adminContext.releases);
    }
  }, [adminContext]);


  if (!authContext || !postContext || !notificationContext || !adminContext || adminContext.isLoading) {
    return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner text="Loading contexts..." /></div>;
  }
  
  const { currentUser } = authContext;
  const { createPost } = postContext;
  const { addNotification } = notificationContext;

  const validateForm = (): boolean => {
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addNotification({
        type: NotificationType.GENERIC_ERROR,
        message: 'You must be logged in to create a post.',
        recipientId: 'system' 
      });
      return;
    }
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const postData: PostCreationData = {
      title,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      generalBriefing,
      tagIds: selectedTagIds,
      releaseId: selectedReleaseId || undefined,
    };

    try {
      const newPost = await createPost(postData);
      if (newPost) {
        addNotification({
          type: NotificationType.GENERIC_SUCCESS,
          message: `Post "${newPost.title}" created successfully as a draft.`,
          postId: newPost.id,
          postTitle: newPost.title,
          recipientId: currentUser.id,
        });
        navigate(`/posts/${newPost.id}/edit`); // Navigate to edit page after creation
      } else {
        throw new Error("Failed to create post.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      addNotification({
        type: NotificationType.GENERIC_ERROR,
        message: 'Failed to create post. Please try again.',
        recipientId: currentUser.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <h1 className="text-2xl font-bold text-secondary-800 mb-6 border-b pb-4">Create New Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-secondary-700 mb-1">
            Post Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${errors.title ? 'border-red-500' : 'border-secondary-300'}`}
            placeholder="Enter a catchy title for your post"
            aria-required="true" aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && <p id="title-error" className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="publicationDate" className="block text-sm font-medium text-secondary-700 mb-1">
            Planned Publication Date (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarDaysIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="date" id="publicationDate" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="generalBriefing" className="block text-sm font-medium text-secondary-700 mb-1">
            General Briefing (Objective, Target Audience, etc.)
          </label>
          <div className="relative">
             <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
              <DocumentTextIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <textarea
              id="generalBriefing" value={generalBriefing} onChange={(e) => setGeneralBriefing(e.target.value)}
              rows={4}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the main goals and context for this post..."
            />
          </div>
        </div>

        {/* Tags Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Tags (Optional)</label>
          {availableTags.length > 0 ? (
            <div className="p-3 border border-secondary-300 rounded-md max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTags.map(tag => (
                  <label key={tag.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="form-checkbox h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-secondary-500">No tags available. An administrator can add them.</p>
          )}
        </div>

        {/* Release Selection */}
        <div>
          <label htmlFor="release" className="block text-sm font-medium text-secondary-700 mb-1">Release (Optional)</label>
           <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArchiveBoxIcon className="h-5 w-5 text-secondary-400" />
            </div>
            <select
                id="release"
                value={selectedReleaseId}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                disabled={availableReleases.length === 0}
            >
                <option value="">-- Select a Release --</option>
                {availableReleases.map(release => (
                <option key={release.id} value={release.id}>{release.name}</option>
                ))}
            </select>
          </div>
          {availableReleases.length === 0 && <p className="text-sm text-secondary-500 mt-1">No releases available. An administrator can add them.</p>}
        </div>
        
        <div className="p-4 border border-dashed border-secondary-300 rounded-md mt-4">
            <p className="text-sm text-secondary-500 text-center">
                This post will start with one default content card. <br/>
                You can add more cards and edit content after saving this draft (on the Edit Post page).
            </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
          <button
            type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-secondary-300 transition-colors flex items-center"
            disabled={isSubmitting || !currentUser}
          >
            {isSubmitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Draft & Edit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
