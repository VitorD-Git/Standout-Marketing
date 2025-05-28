
import React, { useContext, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { PostContext } from '../contexts/PostContext';
import { NotificationContext } from '../contexts/NotificationContext'; // Import NotificationContext
import { UserRole, PostStatus, Post, ApprovalDecision, NotificationType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
    DocumentTextIcon, CheckCircleIcon, EditIcon, PlusIcon, 
    CalendarDaysIcon, ListBulletIcon, ExclamationTriangleIcon, XCircleIcon 
} from '../components/icons/IconComponents';
import { POST_STATUS_COLORS, REMINDER_THRESHOLD_HOURS } from '../constants';

interface InfoListItemProps {
  post: Post;
  dateLabel: string;
  dateValue?: Date;
  linkPrefix?: string;
  highlightClass?: string;
  statusSuffix?: React.ReactNode; 
}

const DashboardPage: React.FC = () => {
  const authContext = useContext(AuthContext) as AuthContextType;
  const postContext = useContext(PostContext);
  const notificationContext = useContext(NotificationContext); // Use NotificationContext

  useEffect(() => {
    if (postContext && !postContext.isLoading) {
      postContext.fetchPosts();
    }
  }, [postContext]);

  // RF036: Deadline Reminder Logic
  useEffect(() => {
    if (postContext && notificationContext && authContext?.currentUser && authContext.allUsers.length > 0 && postContext.posts.length > 0) {
      const { currentUser } = authContext;
      const { posts } = postContext;
      const { addNotification } = notificationContext;

      if (currentUser.role === UserRole.APPROVER || currentUser.role === UserRole.ADMIN) {
        posts.forEach(post => {
          if (post.status === PostStatus.IN_APPROVAL && post.approvalDeadline) {
            const isCurrentUserPendingApprover = post.approvals.some(appr =>
              (appr.approverId === currentUser.id || (appr.approverDesignation === currentUser.approverDesignation && !appr.approverId.startsWith('pending-assignment'))) &&
              appr.decision === ApprovalDecision.PENDING
            );

            if (isCurrentUserPendingApprover) {
              const now = new Date().getTime();
              const deadlineTime = new Date(post.approvalDeadline).getTime();
              const timeRemaining = deadlineTime - now;
              const reminderThresholdMillis = REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000;

              if (timeRemaining > 0 && timeRemaining <= reminderThresholdMillis) {
                const reminderKey = `reminderSent_${post.id}_${currentUser.id}_${new Date().toDateString()}`;
                if (!localStorage.getItem(reminderKey)) {
                  addNotification({
                    type: NotificationType.DEADLINE_REMINDER,
                    message: `Approval deadline for post "${post.title}" is approaching soon (Due: ${new Date(post.approvalDeadline!).toLocaleDateString()}).`,
                    postId: post.id,
                    postTitle: post.title,
                    recipientId: currentUser.id,
                  });
                  localStorage.setItem(reminderKey, 'true');
                }
              }
            }
          }
        });
      }
    }
  }, [postContext, notificationContext, authContext, postContext?.posts]); // Re-run if posts or user changes


  if (!authContext || authContext.isLoading || !postContext || postContext.isLoading || !notificationContext) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner text="Loading dashboard..." /></div>;
  }

  const { currentUser } = authContext;
  const { posts } = postContext;

  if (!currentUser) {
    return <p>User not found. Please log in.</p>;
  }

  // --- Common Data Preparations ---
  const myPosts = useMemo(() => posts.filter(p => p.authorId === currentUser.id), [posts, currentUser.id]);

  // --- Editor Specific Data (RF045) ---
  const editorData = useMemo(() => {
    if (currentUser.role === UserRole.EDITOR || currentUser.role === UserRole.ADMIN) {
      const myPostsInApproval = myPosts.filter(p => p.status === PostStatus.IN_APPROVAL).length;
      const myApprovedPosts = myPosts.filter(p => p.status === PostStatus.APPROVED).length;
      
      const upcomingPublicationDeadlines = myPosts
        .filter(p => p.publicationDate && ![PostStatus.PUBLISHED, PostStatus.ARCHIVED].includes(p.status) && new Date(p.publicationDate) >= new Date())
        .sort((a, b) => new Date(a.publicationDate!).getTime() - new Date(b.publicationDate!).getTime())
        .slice(0, 3);

      const recentPostsNeedingAdjustments = myPosts
        .filter(p => p.status === PostStatus.NEEDS_ADJUSTMENTS)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
      
      return { myPostsInApproval, myApprovedPosts, upcomingPublicationDeadlines, recentPostsNeedingAdjustments };
    }
    return null;
  }, [myPosts, currentUser.role]);

  // --- Approver Specific Data (RF046) ---
  const approverData = useMemo(() => {
    if (currentUser.role === UserRole.APPROVER || currentUser.role === UserRole.ADMIN) {
      const tasksAwaitingMyApprovalCount = posts.filter(p => 
        p.status === PostStatus.IN_APPROVAL &&
        p.approvals.some(appr => 
            (appr.approverId === currentUser.id || (appr.approverDesignation === currentUser.approverDesignation && !appr.approverId.startsWith('pending-assignment'))) &&
             appr.decision === ApprovalDecision.PENDING
        )
      ).length;

      const approachingApprovalDeadlines = posts
        .filter(p => 
            p.status === PostStatus.IN_APPROVAL && 
            p.approvalDeadline &&
            p.approvals.some(appr => 
                (appr.approverId === currentUser.id || (appr.approverDesignation === currentUser.approverDesignation && !appr.approverId.startsWith('pending-assignment'))) && 
                appr.decision === ApprovalDecision.PENDING
            )
        )
        .sort((a, b) => new Date(a.approvalDeadline!).getTime() - new Date(b.approvalDeadline!).getTime())
        .slice(0, 3);

      const postsRecentlyDecidedByMe = posts
        .map(post => {
          const myDecision = post.approvals.find(appr => 
            (appr.approverId === currentUser.id || (appr.approverDesignation === currentUser.approverDesignation && !appr.approverId.startsWith('pending-assignment'))) && 
            appr.decision !== ApprovalDecision.PENDING && appr.timestamp
          );
          return myDecision ? { ...post, myDecisionData: myDecision } : null;
        })
        .filter(p => p !== null)
        .sort((a, b) => new Date(b!.myDecisionData!.timestamp!).getTime() - new Date(a!.myDecisionData!.timestamp!).getTime())
        .slice(0, 3) as (Post & { myDecisionData: NonNullable<Post['approvals'][0]> })[];
        
      return { tasksAwaitingMyApprovalCount, approachingApprovalDeadlines, postsRecentlyDecidedByMe };
    }
    return null;
  }, [posts, currentUser]);


  const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; linkTo?: string; bgColor?: string; textColor?: string }> = 
    ({ title, value, icon, linkTo, bgColor = "bg-white", textColor = "text-secondary-800" }) => (
    <div className={`${bgColor} p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-secondary-700">{title}</h3>
        <div className="text-primary-500">{icon}</div>
      </div>
      <p className={`text-4xl font-bold ${textColor} mb-1`}>{value}</p>
      {linkTo && <Link to={linkTo} className="text-sm text-primary-600 hover:underline">View Details</Link>}
    </div>
  );
  
  const InfoListItem: React.FC<InfoListItemProps> = 
    ({post, dateLabel, dateValue, linkPrefix = "/posts/", highlightClass, statusSuffix}) => (
    <li className={`p-3 rounded-md hover:bg-secondary-100 transition-colors border border-secondary-200 ${highlightClass || ''}`}>
      <Link to={`${linkPrefix}${post.id}/edit`} className="flex justify-between items-center">
        <div>
            <p className="font-medium text-primary-700 text-sm group-hover:underline">{post.title}</p>
            <p className="text-xs text-secondary-500">{dateLabel}: {dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="flex items-center"> {/* Wrapper for status and suffix */}
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${POST_STATUS_COLORS[post.status] || 'bg-gray-200 text-gray-800'}`}>{post.status}</span>
          {statusSuffix} {/* Render the suffix here */}
        </div>
      </Link>
    </li>
  );


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-secondary-800">Welcome back, {currentUser.name}!</h1>
      
      {/* Editor Section (RF045) */}
      {(currentUser.role === UserRole.EDITOR || currentUser.role === UserRole.ADMIN) && editorData && (
        <section>
          <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Editor Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <StatCard title="My Drafts" value={myPosts.filter(p => p.status === PostStatus.DRAFT).length} icon={<EditIcon className="w-8 h-8"/>} linkTo="/posts?status=Draft&author=me" />
            <StatCard title="My Posts In Approval" value={editorData.myPostsInApproval} icon={<CalendarDaysIcon className="w-8 h-8"/>} linkTo="/posts?status=In_Approval&author=me" bgColor="bg-blue-50" />
            <StatCard title="My Posts Needing Adjustments" value={myPosts.filter(p => p.status === PostStatus.NEEDS_ADJUSTMENTS).length} icon={<EditIcon className="w-8 h-8"/>} bgColor="bg-yellow-50" linkTo="/posts?status=Needs_Adjustments&author=me" />
            <StatCard title="My Approved Posts" value={editorData.myApprovedPosts} icon={<CheckCircleIcon className="w-8 h-8"/>} linkTo="/posts?status=Approved&author=me" bgColor="bg-green-50" />
            <StatCard title="My Published Posts" value={myPosts.filter(p => p.status === PostStatus.PUBLISHED).length} icon={<DocumentTextIcon className="w-8 h-8"/>} linkTo="/posts?status=Published&author=me" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h3 className="text-xl font-semibold text-secondary-600 mb-3 flex items-center"><ListBulletIcon className="w-6 h-6 mr-2 text-primary-500"/>Upcoming Publication Deadlines</h3>
                {editorData.upcomingPublicationDeadlines.length > 0 ? (
                    <ul className="space-y-2">
                        {editorData.upcomingPublicationDeadlines.map(post => 
                            <InfoListItem 
                                key={post.id} post={post} 
                                dateLabel="Pub. Date" dateValue={post.publicationDate} 
                            />)}
                    </ul>
                ) : <p className="text-sm text-secondary-500 p-3 border rounded-md bg-secondary-50">No upcoming publication deadlines for your posts.</p>}
            </div>
            <div>
                <h3 className="text-xl font-semibold text-secondary-600 mb-3 flex items-center"><EditIcon className="w-6 h-6 mr-2 text-yellow-500"/>Recent Posts Needing Adjustments</h3>
                {editorData.recentPostsNeedingAdjustments.length > 0 ? (
                    <ul className="space-y-2">
                        {editorData.recentPostsNeedingAdjustments.map(post => 
                            <InfoListItem 
                                key={post.id} post={post} 
                                dateLabel="Last Updated" dateValue={post.updatedAt} 
                                highlightClass="border-yellow-300 bg-yellow-50"
                            />)}
                    </ul>
                ) : <p className="text-sm text-secondary-500 p-3 border rounded-md bg-secondary-50">No posts currently need adjustments.</p>}
            </div>
          </div>

           <div className="mt-6">
              <Link to="/posts/new" className="btn-primary inline-flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create New Post
              </Link>
            </div>
        </section>
      )}

      {/* Approver Section (RF046) */}
      {(currentUser.role === UserRole.APPROVER || currentUser.role === UserRole.ADMIN) && approverData && (
        <section>
          <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Approver Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <StatCard title="Tasks Awaiting My Approval" value={approverData.tasksAwaitingMyApprovalCount} icon={<CheckCircleIcon className="w-8 h-8"/>} linkTo="/approval-tasks" bgColor="bg-blue-50" />
            <StatCard title="Total Posts In Approval (System-wide)" value={posts.filter(p => p.status === PostStatus.IN_APPROVAL).length} icon={<DocumentTextIcon className="w-8 h-8"/>} linkTo="/posts?status=In_Approval" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <h3 className="text-xl font-semibold text-secondary-600 mb-3 flex items-center"><CalendarDaysIcon className="w-6 h-6 mr-2 text-red-500"/>Approaching Approval Deadlines</h3>
                {approverData.approachingApprovalDeadlines.length > 0 ? (
                    <ul className="space-y-2">
                        {approverData.approachingApprovalDeadlines.map(post => {
                            const isOverdue = post.approvalDeadline && new Date(post.approvalDeadline) < new Date();
                            return (
                                <InfoListItem 
                                    key={post.id} post={post} 
                                    dateLabel="Deadline" dateValue={post.approvalDeadline} 
                                    linkPrefix="/posts/"
                                    highlightClass={isOverdue ? "border-red-400 bg-red-50" : ""}
                                    statusSuffix={isOverdue ? <ExclamationTriangleIcon className="w-5 h-5 text-red-600 inline ml-2" title="Overdue"/> : undefined}
                                />
                            );
                        })}
                    </ul>
                ) : <p className="text-sm text-secondary-500 p-3 border rounded-md bg-secondary-50">No tasks with approaching deadlines for you.</p>}
            </div>
            <div>
                <h3 className="text-xl font-semibold text-secondary-600 mb-3 flex items-center"><ListBulletIcon className="w-6 h-6 mr-2 text-primary-500"/>Posts Recently Decided By Me</h3>
                {approverData.postsRecentlyDecidedByMe.length > 0 ? (
                    <ul className="space-y-2">
                        {approverData.postsRecentlyDecidedByMe.map(p => (
                            <li key={p.id} className="p-3 rounded-md hover:bg-secondary-100 transition-colors border border-secondary-200">
                                <Link to={`/posts/${p.id}/edit`} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-primary-700 text-sm">{p.title}</p>
                                        <p className="text-xs text-secondary-500">
                                            My Decision: 
                                            <span className={`font-semibold ml-1 ${p.myDecisionData.decision === ApprovalDecision.APPROVED ? 'text-green-600' : 'text-red-600'}`}>
                                                {p.myDecisionData.decision}
                                            </span>
                                            {p.myDecisionData.decision === ApprovalDecision.APPROVED ? <CheckCircleIcon className="w-3 h-3 inline ml-1 text-green-500"/> : <XCircleIcon className="w-3 h-3 inline ml-1 text-red-500"/>}
                                        </p>
                                        <p className="text-xs text-secondary-500">Date: {new Date(p.myDecisionData.timestamp!).toLocaleDateString()}</p>
                                    </div>
                                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${POST_STATUS_COLORS[p.status] || 'bg-gray-200 text-gray-800'}`}>{p.status}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-secondary-500 p-3 border rounded-md bg-secondary-50">No recent decisions found.</p>}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold text-secondary-700 mb-4">System Activity</h2>
        <div className="bg-white p-6 rounded-lg shadow">
            {posts.length === 0 ? (
                 <p className="text-secondary-600">No posts found in the system yet. {(currentUser.role === UserRole.EDITOR || currentUser.role === UserRole.ADMIN) && <Link to="/posts/new" className="text-primary-600 hover:underline">Create one?</Link>}</p>
            ) : (
                 <p className="text-secondary-600">Total posts in system: {posts.length}.</p>
            )}
            {/* Further system activity feed can be added here */}
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;
