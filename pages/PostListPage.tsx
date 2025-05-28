import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PostContext } from '../contexts/PostContext';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { AdminContext } from '../contexts/AdminContext';
import { Post, PostStatus, User, Tag, Release } from '../types';
import { POST_STATUS_COLORS, generateId } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { EditIcon, PlusIcon, FunnelIcon, XMarkIcon, DocumentTextIcon, TagIcon as TagFilterIcon, ArchiveBoxIcon, UserCircleIcon, CalendarDaysIcon } from '../components/icons/IconComponents';
import useDebounce from '../hooks/useDebounce';

const PostListPage: React.FC = () => {
  const navigate = useNavigate();
  const postContext = useContext(PostContext);
  const authContext = useContext(AuthContext) as AuthContextType;
  const adminContext = useContext(AdminContext);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [filters, setFilters] = useState<{
    status: PostStatus | '';
    authorId: string | '';
    tagIds: string[];
    releaseId: string | '';
    pubDateStart: string | '';
    pubDateEnd: string | '';
  }>({
    status: '',
    authorId: '',
    tagIds: [],
    releaseId: '',
    pubDateStart: '',
    pubDateEnd: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (postContext && !postContext.isLoading && postContext.posts.length === 0) {
      postContext.fetchPosts();
    }
    if (adminContext && !adminContext.isLoading && (adminContext.tags.length === 0 || adminContext.releases.length === 0)) {
      adminContext.fetchAdminData();
    }
  }, [postContext, adminContext]);


  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleTagFilterChange = (tagId: string) => {
    setFilters(prev => ({
        ...prev,
        tagIds: prev.tagIds.includes(tagId) 
            ? prev.tagIds.filter(id => id !== tagId)
            : [...prev.tagIds, tagId]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      authorId: '',
      tagIds: [],
      releaseId: '',
      pubDateStart: '',
      pubDateEnd: '',
    });
  };

  const filteredPosts = useMemo(() => {
    if (!postContext) return [];
    return postContext.posts.filter(post => {
      // Search Term
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        const inTitle = post.title.toLowerCase().includes(lowerSearchTerm);
        const inBriefing = post.generalBriefing.toLowerCase().includes(lowerSearchTerm);
        const inCards = post.cards.some(card =>
          card.mainText.toLowerCase().includes(lowerSearchTerm) ||
          card.artText.toLowerCase().includes(lowerSearchTerm) ||
          card.designerNotes.toLowerCase().includes(lowerSearchTerm)
        );
        if (!inTitle && !inBriefing && !inCards) return false;
      }

      // Status Filter
      if (filters.status && post.status !== filters.status) return false;
      // Author Filter
      if (filters.authorId && post.authorId !== filters.authorId) return false;
      // Release Filter
      if (filters.releaseId && post.releaseId !== filters.releaseId) return false;
      // Tags Filter (must contain ALL selected tags)
      if (filters.tagIds.length > 0 && !filters.tagIds.every(tagId => post.tags.includes(tagId))) return false;
      
      // Publication Date Range
      if (filters.pubDateStart) {
        if (!post.publicationDate || new Date(post.publicationDate) < new Date(filters.pubDateStart)) return false;
      }
      if (filters.pubDateEnd) {
        // Adjust end date to be inclusive of the whole day
        const endDate = new Date(filters.pubDateEnd);
        endDate.setHours(23, 59, 59, 999);
        if (!post.publicationDate || new Date(post.publicationDate) > endDate) return false;
      }
      return true;
    });
  }, [postContext, debouncedSearchTerm, filters]);

  if (!postContext || !authContext || !adminContext || postContext.isLoading || authContext.isLoading || adminContext.isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading posts..." /></div>;
  }
  
  const { currentUser, allUsers } = authContext;
  const { tags: availableTags, releases: availableReleases } = adminContext;


  const getAuthorName = (authorId: string) => allUsers.find(u => u.id === authorId)?.name || 'Unknown Author';
  const getTagName = (tagId: string) => availableTags.find(t => t.id === tagId)?.name || 'Unknown Tag';
  const getReleaseName = (releaseId?: string) => releaseId ? (availableReleases.find(r => r.id === releaseId)?.name || 'Unknown Release') : 'N/A';


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
            <DocumentTextIcon className="w-7 h-7 mr-2 text-primary-600"/> All Posts
        </h1>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 border border-secondary-300 rounded-md text-secondary-600 hover:bg-secondary-100 transition-colors flex items-center"
                aria-expanded={showFilters}
                aria-controls="filter-panel"
            >
                <FunnelIcon className="w-5 h-5 mr-1"/> Filters
            </button>
            <button
              onClick={() => navigate('/posts/new')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Create New Post
            </button>
        </div>
      </div>

      {/* Search and Filter Panel */}
      <div id="filter-panel" className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-secondary-200 rounded-lg bg-secondary-50 mb-6 ${showFilters ? 'block' : 'hidden'}`}>
        {/* Search Input */}
        <div className="lg:col-span-3">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-secondary-700">Search Posts</label>
          <div className="relative mt-1">
            <input
              type="text" id="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search by title, content..."
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-secondary-700">Status</label>
          <select id="statusFilter" value={filters.status} onChange={e => handleFilterChange('status', e.target.value as PostStatus | '')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
            <option value="">All Statuses</option>
            {Object.values(PostStatus).map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        {/* Author Filter */}
        <div>
          <label htmlFor="authorFilter" className="block text-sm font-medium text-secondary-700">Author</label>
          <select id="authorFilter" value={filters.authorId} onChange={e => handleFilterChange('authorId', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
            <option value="">All Authors</option>
            {allUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        
        {/* Release Filter */}
        <div>
          <label htmlFor="releaseFilter" className="block text-sm font-medium text-secondary-700">Release</label>
          <select id="releaseFilter" value={filters.releaseId} onChange={e => handleFilterChange('releaseId', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
            <option value="">All Releases</option>
            {availableReleases.map(release => <option key={release.id} value={release.id}>{release.name}</option>)}
          </select>
        </div>

        {/* Publication Date Filters */}
        <div className="lg:col-span-1">
          <label htmlFor="pubDateStart" className="block text-sm font-medium text-secondary-700">Pub. Date From</label>
          <input type="date" id="pubDateStart" value={filters.pubDateStart} onChange={e => handleFilterChange('pubDateStart', e.target.value)}
                 className="mt-1 block w-full pl-3 pr-2 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="pubDateEnd" className="block text-sm font-medium text-secondary-700">Pub. Date To</label>
          <input type="date" id="pubDateEnd" value={filters.pubDateEnd} onChange={e => handleFilterChange('pubDateEnd', e.target.value)}
                 className="mt-1 block w-full pl-3 pr-2 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
        </div>

        {/* Tags Filter (Checkboxes) */}
        <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-secondary-700 mb-1">Tags</label>
            {availableTags.length > 0 ? (
                <div className="p-2 border border-secondary-300 rounded-md max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {availableTags.map(tag => (
                        <label key={tag.id} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer">
                            <input 
                            type="checkbox"
                            checked={filters.tagIds.includes(tag.id)}
                            onChange={() => handleTagFilterChange(tag.id)}
                            className="form-checkbox h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-secondary-700">{tag.name}</span>
                        </label>
                        ))}
                    </div>
                </div>
            ) : <p className="text-sm text-secondary-500">No tags available.</p>}
        </div>
        
        <div className="lg:col-span-3 flex justify-end">
            <button onClick={clearFilters} className="px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 hover:bg-secondary-100">
                Clear All Filters
            </button>
        </div>
      </div>


      {/* Posts Table */}
      {filteredPosts.length === 0 ? (
        <p className="text-center text-secondary-500 py-8">
          {postContext.posts.length === 0 ? "No posts found in the system." : "No posts match your current search and filter criteria."}
        </p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Author</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Tags</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Release</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Pub. Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Cards</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-secondary-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/posts/${post.id}/edit`} className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getAuthorName(post.authorId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${POST_STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {post.tags.map(tagId => getTagName(tagId)).join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getReleaseName(post.releaseId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{post.publicationDate ? new Date(post.publicationDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(post.updatedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 text-center">{post.cards.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/posts/${post.id}/edit`} className="text-primary-600 hover:text-primary-800 p-1" title="Edit Post">
                      <EditIcon className="w-5 h-5 inline-block" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           <div className="p-4 bg-secondary-50 text-sm text-secondary-600">
            Displaying {filteredPosts.length} of {postContext.posts.length} total posts.
          </div>
        </div>
      )}
    </div>
  );
};

export default PostListPage;
