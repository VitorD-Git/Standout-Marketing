
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PostContext } from '../contexts/PostContext';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { AdminContext } from '../contexts/AdminContext';
import { NotificationContext } from '../contexts/NotificationContext'; // Import NotificationContext
import { Post, PostStatus, ApprovalDecision, UserRole, Release, NotificationType } from '../types';
import { POST_STATUS_COLORS, REMINDER_THRESHOLD_HOURS } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon as PageIcon, FunnelIcon, EditIcon, ChevronUpIcon, ChevronDownIcon, ExclamationTriangleIcon } from '../components/icons/IconComponents';

type SortableKeys = 'title' | 'authorName' | 'submittedAt' | 'approvalDeadline';

const ApprovalTasksPage: React.FC = () => {
  const postContext = useContext(PostContext);
  const authContext = useContext(AuthContext) as AuthContextType;
  const adminContext = useContext(AdminContext);
  const notificationContext = useContext(NotificationContext); // Use NotificationContext

  const [filters, setFilters] = useState<{ authorId: string; releaseId: string }>({
    authorId: '',
    releaseId: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({
    key: 'approvalDeadline',
    direction: 'asc',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (postContext && !postContext.isLoading && postContext.posts.length === 0) {
      postContext.fetchPosts();
    }
    if (adminContext && !adminContext.isLoading && adminContext.releases.length === 0) {
      adminContext.fetchAdminData(); 
    }
  }, [postContext, adminContext]);

  const { currentUser, allUsers } = authContext || {};
  const { posts } = postContext || { posts: [] };
  const { releases: availableReleases } = adminContext || { releases: [] };

  const pendingTasks = useMemo(() => {
    if (!currentUser || !posts || posts.length === 0) return [];

    const tasks = posts.filter(post => {
      if (post.status !== PostStatus.IN_APPROVAL) return false;
      
      const isCurrentUserAnApprover = post.approvals.some(approval => 
        approval.decision === ApprovalDecision.PENDING &&
        (approval.approverId === currentUser.id || 
         (approval.approverDesignation === currentUser.approverDesignation && !approval.approverId.startsWith('pending-assignment')))
      );
      return isCurrentUserAnApprover;
    });

    // Apply filters
    let filtered = tasks;
    if (filters.authorId) {
      filtered = filtered.filter(task => task.authorId === filters.authorId);
    }
    if (filters.releaseId) {
      filtered = filtered.filter(task => task.releaseId === filters.releaseId);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortConfig.key === 'authorName') {
        valA = allUsers?.find(u => u.id === a.authorId)?.name.toLowerCase() || '';
        valB = allUsers?.find(u => u.id === b.authorId)?.name.toLowerCase() || '';
      } else if (sortConfig.key === 'submittedAt' || sortConfig.key === 'approvalDeadline') {
        valA = a[sortConfig.key] ? new Date(a[sortConfig.key]!).getTime() : 0;
        valB = b[sortConfig.key] ? new Date(b[sortConfig.key]!).getTime() : 0;
        if (sortConfig.direction === 'asc') {
            valA = valA === 0 ? Infinity : valA;
            valB = valB === 0 ? Infinity : valB;
        } else {
            valA = valA === 0 ? -Infinity : valA;
            valB = valB === 0 ? -Infinity : valB;
        }
      } else {
        valA = (a[sortConfig.key] as string)?.toLowerCase() || '';
        valB = (b[sortConfig.key] as string)?.toLowerCase() || '';
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [currentUser, posts, filters, sortConfig, allUsers]);

  // RF036: Deadline Reminder Logic for this page
  useEffect(() => {
    if (notificationContext && currentUser && pendingTasks.length > 0) {
      const { addNotification } = notificationContext;
      pendingTasks.forEach(post => {
        if (post.approvalDeadline) {
          const now = new Date().getTime();
          const deadlineTime = new Date(post.approvalDeadline).getTime();
          const timeRemaining = deadlineTime - now;
          const reminderThresholdMillis = REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000;

          if (timeRemaining > 0 && timeRemaining <= reminderThresholdMillis) {
            const reminderKey = `reminderSent_${post.id}_${currentUser.id}_${new Date().toDateString()}`;
            if (!localStorage.getItem(reminderKey)) {
              addNotification({
                type: NotificationType.DEADLINE_REMINDER,
                message: `Approval for post "${post.title}" is due soon: ${new Date(post.approvalDeadline!).toLocaleDateString()}.`,
                postId: post.id,
                postTitle: post.title,
                recipientId: currentUser.id,
              });
              localStorage.setItem(reminderKey, 'true');
            }
          }
        }
      });
    }
  }, [pendingTasks, currentUser, notificationContext]); // Re-run when pendingTasks list changes


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) return <ChevronDownIcon className="w-3 h-3 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />;
  };

  const clearFilters = () => {
    setFilters({ authorId: '', releaseId: '' });
  };

  if (!postContext || !authContext || !adminContext || postContext.isLoading || authContext.isLoading || adminContext.isLoading || !notificationContext) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading approval tasks..." /></div>;
  }
  if (!currentUser || (currentUser.role !== UserRole.APPROVER && currentUser.role !== UserRole.ADMIN)) {
    return <p className="p-6 text-center text-secondary-600">You do not have permission to view this page.</p>;
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600" /> My Approval Tasks
        </h1>
        <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-secondary-300 rounded-md text-secondary-600 hover:bg-secondary-100 transition-colors flex items-center self-start md:self-center"
            aria-expanded={showFilters}
            aria-controls="filter-panel-tasks"
        >
            <FunnelIcon className="w-5 h-5 mr-1"/> Filters
        </button>
      </div>
      
      {/* Filter Panel */}
      <div id="filter-panel-tasks" className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-secondary-200 rounded-lg bg-secondary-50 ${showFilters ? 'block' : 'hidden'}`}>
        <div>
          <label htmlFor="authorFilterTasks" className="block text-sm font-medium text-secondary-700">Redator (Author)</label>
          <select id="authorFilterTasks" value={filters.authorId} onChange={e => handleFilterChange('authorId', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
            <option value="">All Authors</option>
            {allUsers?.filter(u => u.role === UserRole.EDITOR || u.role === UserRole.ADMIN).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="releaseFilterTasks" className="block text-sm font-medium text-secondary-700">Release</label>
          <select id="releaseFilterTasks" value={filters.releaseId} onChange={e => handleFilterChange('releaseId', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
            <option value="">All Releases</option>
            {availableReleases.map(release => <option key={release.id} value={release.id}>{release.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
            <button onClick={clearFilters} className="px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 hover:bg-secondary-100">
                Clear Filters
            </button>
        </div>
      </div>


      {pendingTasks.length === 0 ? (
        <div className="text-center py-10">
          <PageIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-xl text-secondary-500">No pending approval tasks.</p>
          <p className="text-sm text-secondary-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  <button onClick={() => requestSort('title')} className="group flex items-center space-x-1 hover:text-secondary-800">
                    <span>Post Title</span> {getSortIcon('title')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  <button onClick={() => requestSort('authorName')} className="group flex items-center space-x-1 hover:text-secondary-800">
                    <span>Redator</span> {getSortIcon('authorName')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  <button onClick={() => requestSort('submittedAt')} className="group flex items-center space-x-1 hover:text-secondary-800">
                    <span>Submission Date</span> {getSortIcon('submittedAt')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  <button onClick={() => requestSort('approvalDeadline')} className="group flex items-center space-x-1 hover:text-secondary-800">
                    <span>Approval Deadline</span> {getSortIcon('approvalDeadline')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {pendingTasks.map((post) => {
                const isOverdue = post.approvalDeadline && new Date(post.approvalDeadline) < new Date() && post.status === PostStatus.IN_APPROVAL;
                return (
                <tr key={post.id} className={`hover:bg-secondary-50 transition-colors duration-150 ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/posts/${post.id}/edit`} className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {allUsers?.find(u => u.id === post.authorId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {post.submittedAt ? new Date(post.submittedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {post.approvalDeadline ? new Date(post.approvalDeadline).toLocaleDateString() : 'N/A'}
                     {isOverdue && <ExclamationTriangleIcon className="w-4 h-4 inline ml-2 text-red-600" title="Overdue"/>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/posts/${post.id}/edit`} 
                      className="text-primary-600 hover:text-primary-800 p-1 rounded-md hover:bg-primary-100 flex items-center justify-end"
                      title="Review Post"
                    >
                      <EditIcon className="w-5 h-5 mr-1" /> Review
                    </Link>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          <div className="p-4 bg-secondary-50 text-sm text-secondary-600">
            Displaying {pendingTasks.length} pending task(s).
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTasksPage;
