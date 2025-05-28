
import React, { useState, useContext, useEffect, useRef, DragEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { PostContext } from '../contexts/PostContext';
import { AdminContext } from '../contexts/AdminContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { Post, NotificationType, Tag, Release, PostStatus, Card, UserRole, ApprovalDecision, ApproverDesignation, IndividualApproval, AuditLogEntry, VersionHistory } from '../types';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import AuditLogDisplay from '../components/AuditLogDisplay'; 
import VersionHistoryViewer from '../components/VersionHistoryViewer';
import { 
    CalendarDaysIcon, DocumentTextIcon, TagIcon, ArchiveBoxIcon, SaveIcon, ArrowUturnLeftIcon,
    PlusIcon as AddCardIcon, TrashIcon, DocumentDuplicateIcon, ArrowUpOnSquareIcon, XCircleIcon,
    PaperAirplaneIcon, CheckBadgeIcon, NoSymbolIcon, ClockIcon, ArrowPathRoundedSquareIcon,
    Bars3Icon, ClipboardDocumentListIcon
} from '../components/icons/IconComponents';
import { MAX_MAIN_TEXT_LENGTH, MAX_ART_TEXT_LENGTH, SUPPORTED_IMAGE_TYPES, SUPPORTED_VIDEO_TYPES, MAX_FILE_SIZE_BYTES, POST_STATUS_COLORS, APPROVAL_DECISION_COLORS } from '../constants';

interface HistoryModalData {
  fieldNameDisplay: string; // For modal title e.g., "Post Title"
  fieldIdentifier: string;  // e.g., "title", "generalBriefing", "card-mainText-{cardId}", "card-finalizedArtUrl-{cardId}"
  history: VersionHistory<string | undefined>[];
}

export const EditPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  
  const authContext = useContext(AuthContext) as AuthContextType;
  const postContext = useContext(PostContext);
  const adminContext = useContext(AdminContext);
  const notificationContext = useContext(NotificationContext);

  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [publicationDate, setPublicationDate] = useState<string>('');
  const [generalBriefing, setGeneralBriefing] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableReleases, setAvailableReleases] = useState<Release[]>([]);
  
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; general?: string; card?: {[cardId: string]: {art?: string}}; approval?: string }>({ card: {} });

  const [cardEdits, setCardEdits] = useState<Record<string, Partial<Card>>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalDeadline, setApprovalDeadline] = useState<string>('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyModalData, setHistoryModalData] = useState<HistoryModalData | null>(null);


  useEffect(() => {
    if (adminContext) {
      if (adminContext.tags.length === 0 && !adminContext.isLoading) adminContext.fetchAdminData();
      setAvailableTags(adminContext.tags);
      setAvailableReleases(adminContext.releases);
    }
  }, [adminContext]);

  useEffect(() => {
    if (postContext && postId) {
      if (postContext.posts.length === 0 && !postContext.isLoading) {
          postContext.fetchPosts();
      }
      const postToEdit = postContext.getPostById(postId);
      if (postToEdit) {
        setCurrentPost(postToEdit);
        setTitle(postToEdit.title);
        setPublicationDate(postToEdit.publicationDate ? new Date(postToEdit.publicationDate).toISOString().split('T')[0] : '');
        setGeneralBriefing(postToEdit.generalBriefing);
        setSelectedTagIds(postToEdit.tags || []);
        setSelectedReleaseId(postToEdit.releaseId || '');
        const initialCardEdits: Record<string, Partial<Card>> = {};
        postToEdit.cards.forEach(card => { initialCardEdits[card.id] = { ...card }; });
        setCardEdits(initialCardEdits);
        setIsLoadingPage(false);
      } else if (!postContext.isLoading) {
        setErrors(prev => ({ ...prev, general: "Post not found."}));
        setIsLoadingPage(false);
      }
    } else if (postContext && !postContext.isLoading && !postId){
        setErrors(prev => ({ ...prev, general: "No Post ID provided."}));
        setIsLoadingPage(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [postId, postContext, postContext?.posts, currentPost?.updatedAt, currentPost?.cards.length]); 


  if (!authContext || !postContext || !notificationContext || !adminContext) {
    return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner text="Loading contexts..." /></div>;
  }
  if (isLoadingPage || adminContext.isLoading || postContext.isLoading) {
     return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner text="Loading post data..." /></div>;
  }
  
  const { currentUser, allUsers } = authContext;
  const { updatePost: updatePostContext, addCardToPost, removeCardFromPost, updateCardInPost, duplicateCardInPost, reorderCardsInPost, submitPostForApproval, recordApprovalDecision, resubmitPostForApproval, publishPost, archivePost } = postContext;
  const { addNotification } = notificationContext;

  if (!currentPost && !errors.general) {
      if (!isLoadingPage) return <div className="p-6 text-center text-red-600">Post with ID "{postId}" not found. <Link to="/posts" className="text-primary-600 hover:underline">Go to posts list.</Link></div>;
      return <div className="p-4 flex justify-center items-center h-full"><LoadingSpinner text="Locating post..." /></div>;
  }
   if (errors.general) return <div className="p-6 text-center text-red-600">{errors.general} <Link to="/posts" className="text-primary-600 hover:underline">Go to posts list.</Link></div>;
  if (!currentPost) return <div className="p-6 text-center text-red-600">Error loading post. Please try again.</div>;

  const isUserAuthor = currentUser?.id === currentPost.authorId;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  // Determine if the current user is a designated approver for *this specific post* instance
  const isDesignatedApproverForPost = currentPost.approvals.some(appr => 
    appr.approverDesignation === currentUser?.approverDesignation && 
    !appr.approverId.startsWith("pending-assignment") // Ensure designation is actively assigned
  );

  // Determine if the current user is the specifically assigned approver by ID for *this specific post*
  const isAssignedApproverByIdForPost = currentPost.approvals.some(appr => appr.approverId === currentUser?.id);

  // The current user's specific approval record for this post, if any
  const currentUserIndividualApproval = currentPost.approvals.find(appr => 
    appr.approverId === currentUser?.id || // Direct ID match
    (appr.approverDesignation === currentUser?.approverDesignation && !appr.approverId.startsWith("pending-assignment")) // Match by current designation
  );

  const canPerformApprovalAction = 
    currentUser &&
    currentPost.status === PostStatus.IN_APPROVAL &&
    currentUserIndividualApproval &&
    currentUserIndividualApproval.decision === ApprovalDecision.PENDING &&
    (currentUserIndividualApproval.approverId === currentUser.id || // Is the specifically assigned user by ID
     (currentUserIndividualApproval.approverDesignation === currentUser.approverDesignation && currentUser.role === UserRole.APPROVER) // Is an approver with matching designation
    );

  const canEditContent = (): boolean => {
    if (!currentUser || !currentPost) return false;
    if (isAdmin) return true;
    if (currentPost.status === PostStatus.PUBLISHED || currentPost.status === PostStatus.ARCHIVED) return false;
    if (isUserAuthor && (currentPost.status === PostStatus.DRAFT || currentPost.status === PostStatus.NEEDS_ADJUSTMENTS)) return true;
    // RF024: Approvers can edit text fields and art if status is IN_APPROVAL or NEEDS_ADJUSTMENTS
    if ((isDesignatedApproverForPost || isAssignedApproverByIdForPost) && (currentPost.status === PostStatus.IN_APPROVAL || currentPost.status === PostStatus.NEEDS_ADJUSTMENTS)) return true;
    return false;
  };
  const canEdit = canEditContent();

  const validatePostForm = (): boolean => {
    const newErrors: { title?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).filter(k => k !== 'general' && k !== 'card' && k !== 'approval').length === 0;
  };

  const handleTagChange = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handlePostDetailsSave = async () => {
    if (!currentPost || !validatePostForm()) return;
    setIsSubmitting(true);
    const updatedPostData: Post = {
      ...currentPost,
      title,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      generalBriefing,
      tags: selectedTagIds,
      releaseId: selectedReleaseId || undefined,
    };
    // Add to history only if value changed
    if (currentPost.title !== title && currentUser) {
        updatedPostData.titleHistory = [...currentPost.titleHistory, { userId: currentUser.id, timestamp: new Date(), value: title }];
    }
    if (currentPost.generalBriefing !== generalBriefing && currentUser) {
        updatedPostData.generalBriefingHistory = [...currentPost.generalBriefingHistory, { userId: currentUser.id, timestamp: new Date(), value: generalBriefing }];
    }

    await updatePostContext(updatedPostData);
    // setCurrentPost(updated); // Will be updated via useEffect
    addNotification({
      type: NotificationType.GENERIC_SUCCESS,
      message: `Post "${updatedPostData.title}" details saved.`,
      postId: currentPost.id, postTitle: updatedPostData.title, recipientId: currentUser!.id
    });
    setIsSubmitting(false);
  };

  const handleCardInputChange = (cardId: string, field: keyof Card, value: string | undefined) => {
    setCardEdits(prev => ({
        ...prev,
        [cardId]: {
            ...prev[cardId],
            [field]: value,
        }
    }));
  };

  const saveCardChanges = async (cardId: string) => {
    if (!currentPost || !currentUser) return;
    const cardDataToSave = cardEdits[cardId];
    if (!cardDataToSave) return;
    setIsSubmitting(true);
    await updateCardInPost(currentPost.id, cardId, cardDataToSave);
    // setCurrentPost will be updated via useEffect watching postContext.posts
    addNotification({
        type: NotificationType.CARD_ACTION,
        message: `Card content saved for post "${currentPost.title}".`,
        postId: currentPost.id, postTitle: currentPost.title, recipientId: currentUser.id
    });
    setIsSubmitting(false);
  };

  const handleAddCard = async () => {
    if (!currentPost || !currentUser) return;
    setIsSubmitting(true);
    await addCardToPost(currentPost.id);
    // setCurrentPost will be updated by useEffect
    addNotification({
        type: NotificationType.CARD_ACTION,
        message: `New card added to post "${currentPost.title}".`,
        postId: currentPost.id, postTitle: currentPost.title, recipientId: currentUser.id
    });
    setIsSubmitting(false);
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!currentPost || currentPost.cards.length <= 1 || !currentUser) {
      addNotification({
        type: NotificationType.GENERIC_ERROR,
        message: 'Cannot delete the last card.',
        postId: currentPost?.id, postTitle: currentPost?.title, recipientId: currentUser!.id
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this card?')) {
      setIsSubmitting(true);
      await removeCardFromPost(currentPost.id, cardId);
      addNotification({
          type: NotificationType.CARD_ACTION,
          message: `Card removed from post "${currentPost.title}".`,
          postId: currentPost.id, postTitle: currentPost.title, recipientId: currentUser.id
      });
      setIsSubmitting(false);
    }
  };
  
  const handleDuplicateCard = async (cardId: string) => {
    if (!currentPost || !currentUser) return;
    setIsSubmitting(true);
    await duplicateCardInPost(currentPost.id, cardId);
    addNotification({
        type: NotificationType.CARD_ACTION,
        message: `Card duplicated in post "${currentPost.title}".`,
        postId: currentPost.id, postTitle: currentPost.title, recipientId: currentUser.id
    });
    setIsSubmitting(false);
  };

  const handleArtFileUpload = async (cardId: string, file: File) => {
    if (!currentPost || !currentUser) return;
    // RF016.1 & RF016.2 Validation
    const fileType = file.type;
    const fileSize = file.size;
    let isValidType = SUPPORTED_IMAGE_TYPES.includes(fileType) || SUPPORTED_VIDEO_TYPES.includes(fileType);
    
    if (!isValidType) {
      setErrors(prev => ({ ...prev, card: { ...prev.card, [cardId]: { art: "Invalid file type. Supported: JPG, PNG, GIF, MP4." }}}));
      return;
    }
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({ ...prev, card: { ...prev.card, [cardId]: { art: `File too large. Max size: ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.` }}}));
      return;
    }
    setErrors(prev => ({ ...prev, card: { ...prev.card, [cardId]: { art: undefined }}})); // Clear previous error

    const reader = new FileReader();
    reader.onloadend = () => {
      handleCardInputChange(cardId, 'finalizedArtUrl', reader.result as string);
      handleCardInputChange(cardId, 'artFileName', file.name);
      // Auto-save or require manual save? For now, updates cardEdits, user saves manually
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveArt = async (cardId: string) => {
    handleCardInputChange(cardId, 'finalizedArtUrl', undefined);
    handleCardInputChange(cardId, 'artFileName', undefined);
    // Auto-save or require manual save? For now, updates cardEdits, user saves manually
  };


  const handleDragStart = (e: DragEvent<HTMLDivElement>, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId); // For Firefox compatibility
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetCardId: string) => {
    e.preventDefault(); // Necessary to allow drop
    if (draggedCardId && draggedCardId !== targetCardId) {
        setDragOverCardId(targetCardId);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, targetCardId: string) => {
    e.preventDefault();
    if (draggedCardId && draggedCardId !== targetCardId) {
        setDragOverCardId(targetCardId);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Check if the new target is still within a valid drop zone
    // For simplicity, just clear if not over any specific card
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
        setDragOverCardId(null);
    }
  };
  
  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetCardId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetCardId || !currentPost) return;

    const currentCardIds = currentPost.cards.map(c => c.id);
    const draggedIndex = currentCardIds.indexOf(draggedCardId);
    const targetIndex = currentCardIds.indexOf(targetCardId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrderedIds = [...currentCardIds];
    const [removed] = newOrderedIds.splice(draggedIndex, 1);
    newOrderedIds.splice(targetIndex, 0, removed);
    
    setIsSubmitting(true);
    await reorderCardsInPost(currentPost.id, newOrderedIds);
    addNotification({
      type: NotificationType.CARD_ACTION,
      message: "Cards reordered successfully.",
      postId: currentPost.id, postTitle: currentPost.title, recipientId: currentUser!.id
    });
    setIsSubmitting(false);
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };
  
  // --- Approval Actions ---
  const openApprovalModal = () => {
    setErrors(prev => ({...prev, approval: undefined }));
    setApprovalDeadline('');
    setIsApprovalModalOpen(true);
  };

  const handleSubmitForApprovalAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost || !currentUser || !approvalDeadline) {
        setErrors(prev => ({...prev, approval: "Deadline is required."}));
        return;
    }
    setErrors(prev => ({...prev, approval: undefined }));
    setIsSubmitting(true);
    
    const deadlineDate = new Date(approvalDeadline);
    if (deadlineDate <= new Date()) {
        setErrors(prev => ({...prev, approval: "Deadline must be in the future."}));
        setIsSubmitting(false);
        return;
    }

    if (currentPost.status === PostStatus.DRAFT) {
      await submitPostForApproval(currentPost.id, deadlineDate);
    } else if (currentPost.status === PostStatus.NEEDS_ADJUSTMENTS) {
      await resubmitPostForApproval(currentPost.id, deadlineDate);
    }
    // Notification is handled in PostContext
    setIsSubmitting(false);
    setIsApprovalModalOpen(false);
  };

  const openRejectionModal = () => {
    setRejectionComment('');
    setIsRejectionModalOpen(true);
  };
  
  const handleApprovalDecisionAction = async (decision: ApprovalDecision) => {
    if (!currentPost || !currentUser) return;

    if (decision === ApprovalDecision.REJECTED && !rejectionComment.trim()) {
        addNotification({ type: NotificationType.GENERIC_ERROR, message: 'Rejection comment is required.', recipientId: currentUser.id });
        setIsRejectionModalOpen(true); // Keep or reopen modal
        return;
    }

    setIsSubmitting(true);
    await recordApprovalDecision(currentPost.id, decision, rejectionComment);
    // Notifications are handled in PostContext
    setIsSubmitting(false);
    setIsRejectionModalOpen(false);
    setRejectionComment(''); 
  };

  const getUserNameById = (userId?: string): string => {
    if (!userId) return 'System';
    return allUsers.find(u => u.id === userId)?.name || 'Unknown User';
  }
  
  const handlePublishPostAction = async () => {
    if (!currentPost || !currentUser) return;
    setIsSubmitting(true);
    await publishPost(currentPost.id);
    // Notification is handled in PostContext
    setIsSubmitting(false);
  };
  
  const handleArchivePostAction = async () => {
    if (!currentPost || !currentUser) return;
    if(window.confirm(`Are you sure you want to archive the post "${currentPost.title}"?`)) {
        setIsSubmitting(true);
        await archivePost(currentPost.id);
        // Notification is handled in PostContext
        setIsSubmitting(false);
    }
  };

  const openHistoryModal = (
    fieldNameDisplay: string,
    fieldIdentifier: string,
    history: VersionHistory<string | undefined>[]
  ) => {
    setHistoryModalData({ fieldNameDisplay, fieldIdentifier, history });
    setIsHistoryModalOpen(true);
  };

  const handleRestoreVersion = (restoredValue: string | undefined) => {
    if (!historyModalData || !currentUser) return;

    const { fieldIdentifier, fieldNameDisplay } = historyModalData;

    if (fieldIdentifier === 'title') {
      setTitle(restoredValue || '');
    } else if (fieldIdentifier === 'generalBriefing') {
      setGeneralBriefing(restoredValue || '');
    } else if (fieldIdentifier.startsWith('card-')) {
      const parts = fieldIdentifier.split('-');
      const cardFieldKey = parts[1] as keyof Card; 
      const cardId = parts[2];

      setCardEdits(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [cardFieldKey]: restoredValue,
          ...(cardFieldKey === 'finalizedArtUrl' && restoredValue === undefined && { artFileName: undefined }),
        }
      }));
    }

    addNotification({
      type: NotificationType.GENERIC_SUCCESS,
      message: `Field "${fieldNameDisplay}" has been updated with the restored version. Please save your changes.`,
      recipientId: currentUser.id,
      postId: currentPost?.id,
      postTitle: currentPost?.title,
    });
    setIsHistoryModalOpen(false);
    setHistoryModalData(null);
  };


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Post Status & Actions Bar */}
      <div className={`p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${POST_STATUS_COLORS[currentPost.status]}`}>
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-secondary-800 mb-1 break-words">{currentPost.title}</h1>
          <p className="text-sm font-semibold">
            Status: <span className="px-2 py-0.5 rounded-full text-xs">{currentPost.status}</span>
          </p>
          {currentPost.status === PostStatus.IN_APPROVAL && currentPost.approvalDeadline && (
            <p className="text-xs mt-1">Approval Deadline: {new Date(currentPost.approvalDeadline).toLocaleDateString()}</p>
          )}
           {currentPost.publicationDate && (
            <p className="text-xs mt-1">Planned Publication: {new Date(currentPost.publicationDate).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-center">
            { (currentPost.status === PostStatus.DRAFT || currentPost.status === PostStatus.NEEDS_ADJUSTMENTS) && (isUserAuthor || isAdmin) && (
                 <button onClick={openApprovalModal} className="btn-primary flex items-center" disabled={isSubmitting}>
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    {currentPost.status === PostStatus.DRAFT ? "Submit for Approval" : "Resubmit for Approval"}
                 </button>
            )}
            { canPerformApprovalAction && (
                <>
                    <button onClick={() => handleApprovalDecisionAction(ApprovalDecision.APPROVED)} className="btn-success flex items-center" disabled={isSubmitting}>
                        <CheckBadgeIcon className="w-5 h-5 mr-2" /> Approve
                    </button>
                    <button onClick={openRejectionModal} className="btn-danger flex items-center" disabled={isSubmitting}>
                        <NoSymbolIcon className="w-5 h-5 mr-2" /> Reject
                    </button>
                </>
            )}
            {currentPost.status === PostStatus.APPROVED && (isUserAuthor || isAdmin) && (
                 <button onClick={handlePublishPostAction} className="btn-success flex items-center" disabled={isSubmitting}>
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" /> Mark as Published
                 </button>
            )}
            {currentPost.status !== PostStatus.ARCHIVED && (isUserAuthor || isAdmin) && ( // Any user with edit access can archive
                <button onClick={handleArchivePostAction} className="btn-secondary-outline flex items-center" disabled={isSubmitting}>
                    <ArchiveBoxIcon className="w-5 h-5 mr-2" /> Archive Post
                </button>
            )}
        </div>
      </div>
      
      {/* Individual Approval Statuses */}
      {currentPost.approvals && currentPost.approvals.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-secondary-700 mb-3 border-b pb-2">Approval Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentPost.approvals.map(appr => (
                    <div key={appr.approverDesignation} className={`p-3 rounded-md border ${APPROVAL_DECISION_COLORS[appr.decision]}`}>
                        <p className="font-semibold text-sm">{appr.approverDesignation}</p>
                        <p className="text-xs">Status: {appr.decision}</p>
                        <p className="text-xs">Approver: {getUserNameById(appr.approverId.startsWith('pending-assignment') ? undefined : appr.approverId)}</p>
                        {appr.timestamp && <p className="text-xs mt-1">Date: {new Date(appr.timestamp).toLocaleString()}</p>}
                        {appr.comment && <p className="text-xs mt-1 italic">Comment: "{appr.comment}"</p>}
                    </div>
                ))}
            </div>
        </div>
      )}


      {/* Post Details Section */}
      <div className="bg-white shadow-xl rounded-lg p-6">
         <h2 className="text-xl font-semibold text-secondary-700 mb-4 border-b pb-3">Post Details</h2>
         <div className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-secondary-600">Title</label>
                <div className="flex items-center">
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} 
                           className={`input-style flex-grow ${!canEdit ? 'bg-secondary-100 cursor-not-allowed' : ''}`} disabled={!canEdit}/>
                    <button onClick={() => openHistoryModal('Post Title', 'title', currentPost.titleHistory)} 
                            className="ml-2 p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded" title="View Title History">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="generalBriefing" className="block text-sm font-medium text-secondary-600">General Briefing</label>
                 <div className="flex items-start">
                    <textarea id="generalBriefing" value={generalBriefing} onChange={(e) => setGeneralBriefing(e.target.value)} rows={3} 
                              className={`textarea-style flex-grow ${!canEdit ? 'bg-secondary-100 cursor-not-allowed' : ''}`} disabled={!canEdit}/>
                    <button onClick={() => openHistoryModal('General Briefing', 'generalBriefing', currentPost.generalBriefingHistory)} 
                            className="ml-2 mt-1 p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded" title="View Briefing History">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {/* ... other post detail fields like publication date, tags, release ... */}
         </div>
         {canEdit && (
            <div className="mt-6 flex justify-end">
                <button onClick={handlePostDetailsSave} className="btn-primary flex items-center" disabled={isSubmitting}><SaveIcon className="w-4 h-4 mr-2"/>Save Post Details</button>
            </div>
         )}
      </div>

      {/* Cards Section */}
      <div className="bg-white shadow-xl rounded-lg p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-secondary-700">Content Cards ({currentPost.cards.length})</h2>
          {canEdit && (
            <button onClick={handleAddCard} className="btn-primary-outline flex items-center text-sm" disabled={isSubmitting}>
              <AddCardIcon className="w-4 h-4 mr-2"/>Add Card
            </button>
          )}
        </div>

        {currentPost.cards.length === 0 && <p className="text-secondary-500 text-center py-4">This post has no content cards yet.</p>}

        {currentPost.cards.map((card, index) => (
          <div 
            key={card.id}
            draggable={canEdit}
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={(e) => handleDragOver(e, card.id)}
            onDragEnter={(e) => handleDragEnter(e, card.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, card.id)}
            onDragEnd={handleDragEnd}
            className={`p-5 border rounded-lg shadow-md transition-all duration-150 ease-in-out 
                        ${draggedCardId === card.id ? 'opacity-50 bg-primary-50' : 'bg-white'}
                        ${dragOverCardId === card.id && draggedCardId !== card.id ? 'border-primary-500 border-2 ring-2 ring-primary-300' : 'border-secondary-200'}
                       `}
            style={{ position: 'relative' }}
          >
            {canEdit && (
                <div className="absolute top-2 right-2 p-1 cursor-grab text-secondary-400 hover:text-secondary-600" title="Drag to reorder card">
                    <Bars3Icon className="w-6 h-6" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-secondary-700 mb-3">
              Card {index + 1}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-600">Main Text</label>
                <div className="flex items-start">
                    <textarea 
                      value={cardEdits[card.id]?.mainText ?? card.mainText} 
                      onChange={(e) => handleCardInputChange(card.id, 'mainText', e.target.value)} 
                      rows={3} 
                      className={`textarea-style flex-grow ${!canEdit ? 'bg-secondary-100 cursor-not-allowed' : ''}`}
                      disabled={!canEdit}
                      maxLength={MAX_MAIN_TEXT_LENGTH}
                    />
                    <button onClick={() => openHistoryModal(`Card ${index + 1} - Main Text`, `card-mainText-${card.id}`, card.mainTextHistory)} 
                            className="ml-2 mt-1 p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded" title="View Main Text History">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                </div>
                {canEdit && <p className="text-xs text-secondary-400 mt-1">{(cardEdits[card.id]?.mainText ?? card.mainText).length}/{MAX_MAIN_TEXT_LENGTH}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-600">Art Text (Text on Image/Video)</label>
                 <div className="flex items-start">
                    <textarea 
                      value={cardEdits[card.id]?.artText ?? card.artText} 
                      onChange={(e) => handleCardInputChange(card.id, 'artText', e.target.value)} 
                      rows={2} 
                      className={`textarea-style flex-grow ${!canEdit ? 'bg-secondary-100 cursor-not-allowed' : ''}`}
                      disabled={!canEdit}
                      maxLength={MAX_ART_TEXT_LENGTH}
                    />
                    <button onClick={() => openHistoryModal(`Card ${index + 1} - Art Text`, `card-artText-${card.id}`, card.artTextHistory)}
                            className="ml-2 mt-1 p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded" title="View Art Text History">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                </div>
                {canEdit && <p className="text-xs text-secondary-400 mt-1">{(cardEdits[card.id]?.artText ?? card.artText).length}/{MAX_ART_TEXT_LENGTH}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-600">Explanation for Designer</label>
                 <div className="flex items-start">
                    <textarea 
                      value={cardEdits[card.id]?.designerNotes ?? card.designerNotes} 
                      onChange={(e) => handleCardInputChange(card.id, 'designerNotes', e.target.value)} 
                      rows={2} 
                      className={`textarea-style flex-grow ${!canEdit ? 'bg-secondary-100 cursor-not-allowed' : ''}`}
                      disabled={!canEdit}
                    />
                    <button onClick={() => openHistoryModal(`Card ${index + 1} - Designer Notes`, `card-designerNotes-${card.id}`, card.designerNotesHistory)}
                            className="ml-2 mt-1 p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded" title="View Designer Notes History">
                        <ClockIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-600">Finalized Art</label>
                <div className="flex items-start">
                    <div className="flex-grow">
                        { (cardEdits[card.id]?.finalizedArtUrl || card.finalizedArtUrl) ? (
                            <div className="mt-2">
                                { (cardEdits[card.id]?.finalizedArtUrl || card.finalizedArtUrl)?.startsWith('data:image/') ?
                                    <img src={cardEdits[card.id]?.finalizedArtUrl || card.finalizedArtUrl} alt="Art preview" className="max-h-40 rounded border border-secondary-200" />
                                    : <p className="text-sm text-secondary-600 p-2 border rounded bg-secondary-50">Video/File: {cardEdits[card.id]?.artFileName || card.artFileName || 'Uploaded file'}</p>
                                }
                                {canEdit && <button onClick={() => handleRemoveArt(card.id)} className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center"><XCircleIcon className="w-4 h-4 mr-1"/>Remove Art</button>}
                            </div>
                        ) : (
                            canEdit && (
                                <input 
                                    type="file" 
                                    ref={el => { if (el) fileInputRefs.current[card.id] = el;}}
                                    onChange={(e) => e.target.files && e.target.files[0] && handleArtFileUpload(card.id, e.target.files[0])}
                                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                                    accept={[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES].join(',')}
                                    disabled={!canEdit}
                                />
                            )
                        )}
                        {errors.card?.[card.id]?.art && <p className="text-xs text-red-500 mt-1">{errors.card[card.id].art}</p>}
                        <button onClick={() => openHistoryModal(`Card ${index + 1} - Finalized Art`, `card-finalizedArtUrl-${card.id}`, card.finalizedArtHistory)}
                                className="mt-1 p-1.5 text-xs text-secondary-500 hover:text-primary-600 hover:bg-primary-100 rounded flex items-center" title="View Art History">
                            <ClockIcon className="w-4 h-4 mr-1" /> View Art History
                        </button>
                    </div>
                </div>
              </div>

            </div>

            {canEdit && (
              <div className="mt-4 flex justify-end space-x-2 border-t pt-3">
                <button onClick={() => handleDuplicateCard(card.id)} className="btn-secondary-outline text-xs flex items-center" disabled={isSubmitting}><DocumentDuplicateIcon className="w-4 h-4 mr-1"/>Duplicate</button>
                <button onClick={() => handleRemoveCard(card.id)} className="btn-danger text-xs flex items-center" disabled={isSubmitting || currentPost.cards.length <= 1}><TrashIcon className="w-4 h-4 mr-1"/>Delete</button>
                <button onClick={() => saveCardChanges(card.id)} className="btn-primary text-xs flex items-center" disabled={isSubmitting}><SaveIcon className="w-4 h-4 mr-1"/>Save Card</button>
              </div>
            )}
             {dragOverCardId === card.id && draggedCardId && draggedCardId !== card.id && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-400 animate-pulse rounded-b-lg"></div>
             )}
          </div>
        ))}
      </div>
      
      {/* Audit Log Section */}
      <div className="bg-white shadow-xl rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary-700 flex items-center">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-primary-600" />
            Post Activity Log
          </h2>
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="btn-secondary-outline text-sm"
          >
            {showAuditLog ? 'Hide' : 'View'} Log
          </button>
        </div>
        {showAuditLog && currentPost && (
          <AuditLogDisplay auditLog={currentPost.auditLog} />
        )}
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isHistoryModalOpen && historyModalData !== null} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title={`${historyModalData?.fieldNameDisplay || 'Field'} - Version History`}
        size="lg"
      >
        {historyModalData && allUsers && (
          <VersionHistoryViewer 
            history={historyModalData.history} 
            fieldName={historyModalData.fieldNameDisplay}
            allUsers={allUsers}
            onRestore={handleRestoreVersion}
          />
        )}
      </Modal>

      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title={currentPost.status === PostStatus.DRAFT ? "Submit for Approval" : "Resubmit for Approval"}>
        <form onSubmit={handleSubmitForApprovalAction} className="space-y-4">
             <div>
                <label htmlFor="approvalDeadline" className="block text-sm font-medium text-secondary-700">
                    Approval Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDaysIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                        type="date"
                        id="approvalDeadline"
                        value={approvalDeadline}
                        onChange={(e) => setApprovalDeadline(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} 
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${errors.approval ? 'border-red-500' : 'border-secondary-300'}`}
                        required
                    />
                </div>
                {errors.approval && <p className="mt-1 text-sm text-red-600">{errors.approval}</p>}
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsApprovalModalOpen(false)} className="btn-secondary-outline" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn-primary flex items-center" disabled={isSubmitting || !approvalDeadline}>
                    {isSubmitting && <LoadingSpinner size="sm" color="text-white" />}
                    {currentPost.status === PostStatus.DRAFT ? 'Submit' : 'Resubmit'}
                </button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title="Rejection Comment">
        <form onSubmit={(e) => { e.preventDefault(); handleApprovalDecisionAction(ApprovalDecision.REJECTED); }} className="space-y-4">
            <div>
                <label htmlFor="rejectionComment" className="block text-sm font-medium text-secondary-700">
                    Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="rejectionComment"
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    rows={4}
                    className={`textarea-style mt-1 ${!rejectionComment.trim() && isSubmitting ? 'border-red-500' : 'border-secondary-300'}`}
                    placeholder="Please provide a clear reason for rejection..."
                    required
                />
                {!rejectionComment.trim() && isSubmitting && <p className="mt-1 text-sm text-red-600">Rejection comment is required.</p>}
            </div>
             <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => { setIsRejectionModalOpen(false); setRejectionComment('');}} className="btn-secondary-outline" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn-danger flex items-center" disabled={isSubmitting || !rejectionComment.trim()}>
                    {isSubmitting && <LoadingSpinner size="sm" color="text-white" />}
                    Confirm Rejection
                </button>
            </div>
        </form>
      </Modal>

    </div>
  );
};
