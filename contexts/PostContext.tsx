
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Post, Card, PostStatus, VersionHistory, AuditLogEntry, User, PostCreationData, ApprovalDecision, ApproverDesignation, UserRole, NotificationType, IndividualApproval, UserNotificationPreferences } from '../types';
import { generateId, APPROVER_ROLES } from '../constants';
import { AuthContext, AuthContextType } from './AuthContext';
import { NotificationContext } from './NotificationContext';

interface PostContextType {
  posts: Post[];
  isLoading: boolean;
  fetchPosts: () => void;
  getPostById: (postId: string) => Post | undefined;
  createPost: (postData: PostCreationData) => Promise<Post | null>;
  updatePost: (updatedPost: Post, auditDetailOverride?: string) => Promise<Post | null>;
  addCardToPost: (postId: string) => Promise<Post | null>;
  removeCardFromPost: (postId: string, cardId: string) => Promise<Post | null>;
  updateCardInPost: (postId: string, cardId: string, updatedCardFields: Partial<Omit<Card, 'id' | 'mainTextHistory' | 'artTextHistory' | 'designerNotesHistory' | 'finalizedArtHistory'>>) => Promise<Post | null>;
  duplicateCardInPost: (postId: string, cardIdToDuplicate: string) => Promise<Post | null>;
  reorderCardsInPost: (postId: string, orderedCardIds: string[]) => Promise<Post | null>;
  submitPostForApproval: (postId: string, approvalDeadline: Date) => Promise<Post | null>;
  recordApprovalDecision: (postId: string, decision: ApprovalDecision, comment?: string) => Promise<Post | null>;
  resubmitPostForApproval: (postId: string, approvalDeadline: Date) => Promise<Post | null>;
  publishPost: (postId: string) => Promise<Post | null>; 
  archivePost: (postId: string) => Promise<Post | null>;
}

export const PostContext = createContext<PostContextType | undefined>(undefined);

const createDefaultCard = (userId: string, userName: string): Card => {
  const now = new Date();
  const defaultHistoryEntry = <T,>(value: T): VersionHistory<T>[] => [{ userId, timestamp: now, value }];

  return {
    id: generateId(),
    mainText: '',
    mainTextHistory: defaultHistoryEntry(''),
    artText: '',
    artTextHistory: defaultHistoryEntry(''),
    designerNotes: '',
    designerNotesHistory: defaultHistoryEntry(''),
    finalizedArtUrl: undefined,
    finalizedArtHistory: defaultHistoryEntry(undefined),
    artFileName: undefined,
  };
};

const createInitialApprovals = (allUsers: User[]): Post['approvals'] => {
    return APPROVER_ROLES.map(designation => {
        const assignedUser = allUsers.find(u => u.role === UserRole.APPROVER && u.approverDesignation === designation);
        return {
            approverId: assignedUser ? assignedUser.id : `pending-assignment-${designation}`,
            approverDesignation: designation,
            decision: ApprovalDecision.PENDING,
            comment: undefined,
            timestamp: undefined,
        };
    });
};

const createAuditLogEntry = (currentUser: User, event: string, details: string, cardId?: string, oldValue?: string, newValue?: string): AuditLogEntry => {
  return {
    id: generateId(),
    timestamp: new Date(),
    event,
    userId: currentUser.id,
    userName: currentUser.name,
    details,
    cardId,
    oldValue,
    newValue,
  };
};

// Helper to check notification preferences
const canSendNotification = (
  recipientId: string, 
  notificationType: NotificationType, 
  allUsers: User[]
): boolean => {
  if (notificationType === NotificationType.DEADLINE_REMINDER) return true; // Always send deadline reminders

  const recipient = allUsers.find(u => u.id === recipientId);
  if (!recipient || !recipient.notificationPreferences) return true; // Default to send if no prefs

  const prefs = recipient.notificationPreferences;
  switch (notificationType) {
    case NotificationType.SUBMITTED_FOR_APPROVAL:
    case NotificationType.POST_RESUBMITTED:
    case NotificationType.APPROVAL_RESET: // For approvers
      return prefs.receiveInAppNewSubmissions;
    case NotificationType.APPROVAL_DECISION: // For author when an approver decides
    case NotificationType.POST_APPROVED_OVERALL:
    case NotificationType.POST_REJECTED_OVERALL:
    case NotificationType.STATUS_CHANGED: // if status changed related to approval/rejection for author
       // Also check if the current user (author) wants to receive these
      if (recipient.id === recipientId) { // If it's the author being notified about their post
          return prefs.receiveInAppApprovalDecisions;
      }
      return true; // Default for other scenarios unless specific author preferences are checked
    default:
      return true; // Send other types by default
  }
};


export const PostProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(AuthContext) as AuthContextType; 
  const notificationContext = useContext(NotificationContext);

  const getPostsFromStorage = (): Post[] => {
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts) {
      return JSON.parse(storedPosts).map((post: Post) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        publicationDate: post.publicationDate ? new Date(post.publicationDate) : undefined,
        approvalDeadline: post.approvalDeadline ? new Date(post.approvalDeadline) : undefined,
        submittedAt: post.submittedAt ? new Date(post.submittedAt) : undefined,
        approvalDate: post.approvalDate ? new Date(post.approvalDate) : undefined,
        resubmittedAtHistory: post.resubmittedAtHistory?.map(d => new Date(d)) || [],
        auditLog: post.auditLog.map(log => ({ ...log, timestamp: new Date(log.timestamp) })),
        cards: post.cards.map((card: Card) => ({ 
          ...card,
          id: card.id || generateId(), 
          mainTextHistory: card.mainTextHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
          artTextHistory: card.artTextHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
          designerNotesHistory: card.designerNotesHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
          finalizedArtHistory: card.finalizedArtHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
        })),
        approvals: post.approvals.map(appr => ({...appr, timestamp: appr.timestamp ? new Date(appr.timestamp): undefined})),
        titleHistory: post.titleHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
        generalBriefingHistory: post.generalBriefingHistory.map(h => ({...h, timestamp: new Date(h.timestamp)})),
      }));
    }
    return [];
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setIsLoading(true);
    setPosts(getPostsFromStorage());
    setIsLoading(false);
  };

  const savePostsToStorage = (updatedPosts: Post[]) => {
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts); 
  };

  const getPostById = (postId: string): Post | undefined => {
    return posts.find(p => p.id === postId);
  };
  
  const internalUpdatePostState = (updatedPost: Post, auditLogEntry: AuditLogEntry) => {
    const newPostState = {
        ...updatedPost,
        updatedAt: new Date(),
        auditLog: [...(updatedPost.auditLog || []), auditLogEntry],
    };
    const updatedPostsList = posts.map(p => (p.id === newPostState.id ? newPostState : p));
    savePostsToStorage(updatedPostsList);
    return newPostState;
  };


  const createPost = async (postData: PostCreationData): Promise<Post | null> => {
    if (!authContext?.currentUser) {
      console.error("No current user found. Cannot create post.");
      return null;
    }
    const { currentUser, allUsers } = authContext; 
    const now = new Date();

    const newPost: Post = {
      id: generateId(),
      title: postData.title,
      titleHistory: [{ userId: currentUser.id, timestamp: now, value: postData.title }],
      publicationDate: postData.publicationDate,
      generalBriefing: postData.generalBriefing,
      generalBriefingHistory: [{ userId: currentUser.id, timestamp: now, value: postData.generalBriefing }],
      tags: postData.tagIds || [],
      releaseId: postData.releaseId,
      cards: [createDefaultCard(currentUser.id, currentUser.name)],
      status: PostStatus.DRAFT,
      approvals: createInitialApprovals(allUsers),
      auditLog: [createAuditLogEntry(currentUser, 'Post Created', `Post "${postData.title}" created as draft.`)],
      authorId: currentUser.id,
      createdAt: now,
      updatedAt: now,
      resubmittedAtHistory: [],
    };

    const updatedPosts = [newPost, ...posts];
    savePostsToStorage(updatedPosts);
    return newPost;
  };
  
  const resetApprovalsIfNeeded = (post: Post, currentUser: User): Post => {
    if (post.status === PostStatus.IN_APPROVAL || post.status === PostStatus.NEEDS_ADJUSTMENTS) {
        const newApprovals = post.approvals.map(appr => ({
            ...appr,
            decision: ApprovalDecision.PENDING,
            comment: undefined,
            timestamp: undefined,
        }));
        const auditEntry = createAuditLogEntry(currentUser, 'Approval Reset', 'Post content or card order edited, approval process reset.');
        
        const notificationMessage = `The approval process for post "${post.title}" has been reset due to content/card order changes.`;
        
        if (canSendNotification(post.authorId, NotificationType.APPROVAL_RESET, authContext.allUsers)) {
            notificationContext?.addNotification({
                type: NotificationType.APPROVAL_RESET,
                message: notificationMessage,
                postId: post.id, postTitle: post.title, recipientId: post.authorId, 
            });
        }

        post.approvals.forEach(appr => {
            if (appr.approverId && !appr.approverId.startsWith('pending-assignment')) {
                if (canSendNotification(appr.approverId, NotificationType.APPROVAL_RESET, authContext.allUsers)) {
                    notificationContext?.addNotification({
                        type: NotificationType.APPROVAL_RESET,
                        message: `${notificationMessage} Please review the changes.`,
                        postId: post.id, postTitle: post.title, recipientId: appr.approverId,
                    });
                }
            }
        });

        return { ...post, approvals: newApprovals, auditLog: [...post.auditLog, auditEntry] };
    }
    return post;
  };


  const updatePost = async (updatedPostData: Post, auditDetailOverride?: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    
    let originalPost = posts.find(p => p.id === updatedPostData.id);
    if (!originalPost) return null;

    let changesDetail = auditDetailOverride || "Post details updated. ";
    if (!auditDetailOverride) {
      if(originalPost.title !== updatedPostData.title) changesDetail += `Title changed. `;
      if(originalPost.generalBriefing !== updatedPostData.generalBriefing) changesDetail += `Briefing changed. `;
      if (JSON.stringify(originalPost.tags.sort()) !== JSON.stringify(updatedPostData.tags.sort())) changesDetail += `Tags updated. `;
      if (originalPost.releaseId !== updatedPostData.releaseId) changesDetail += `Release updated. `;
    }
    
    let postToSave = { ...updatedPostData };
    postToSave = resetApprovalsIfNeeded(postToSave, currentUser);
    
    const auditEntry = createAuditLogEntry(currentUser, 'Post Edited', changesDetail.trim());
    return internalUpdatePostState(postToSave, auditEntry);
  };

  const addCardToPost = async (postId: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    let post = posts.find(p => p.id === postId);
    if (!post) return null;

    const newCard = createDefaultCard(currentUser.id, currentUser.name);
    const updatedCards = [...post.cards, newCard];
    
    post = resetApprovalsIfNeeded({...post, cards: updatedCards }, currentUser);
    
    const auditEntry = createAuditLogEntry(currentUser, 'Card Added', `New card (ID: ${newCard.id}) added to post "${post.title}".`, newCard.id);
    return internalUpdatePostState({...post, cards: updatedCards}, auditEntry);
  };

  const removeCardFromPost = async (postId: string, cardId: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    let post = posts.find(p => p.id === postId);
    if (!post) return null;

    const updatedCards = post.cards.filter(c => c.id !== cardId);
    if (updatedCards.length === post.cards.length) return post; 

    post = resetApprovalsIfNeeded({...post, cards: updatedCards }, currentUser);
    
    const auditEntry = createAuditLogEntry(currentUser, 'Card Removed', `Card (ID: ${cardId}) removed from post "${post.title}".`, cardId);
    return internalUpdatePostState({...post, cards:updatedCards}, auditEntry);
  };

  const updateCardInPost = async (
    postId: string, 
    cardId: string, 
    updatedCardFields: Partial<Omit<Card, 'id' | 'mainTextHistory' | 'artTextHistory' | 'designerNotesHistory' | 'finalizedArtHistory'>>
  ): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    let post = posts.find(p => p.id === postId);
    if (!post) return null;

    let cardUpdated = false;
    let auditDetails = `Card (ID: ${cardId}) in post "${post.title}" updated: `;
    const now = new Date();

    const updatedCards = post.cards.map(card => {
      if (card.id === cardId) {
        cardUpdated = true;
        const newCardData = { ...card };
        
        if (updatedCardFields.mainText !== undefined && card.mainText !== updatedCardFields.mainText) {
          newCardData.mainText = updatedCardFields.mainText;
          newCardData.mainTextHistory = [...card.mainTextHistory, { userId: currentUser.id, timestamp: now, value: newCardData.mainText }];
          auditDetails += "Main text changed. ";
        }
        if (updatedCardFields.artText !== undefined && card.artText !== updatedCardFields.artText) {
          newCardData.artText = updatedCardFields.artText;
          newCardData.artTextHistory = [...card.artTextHistory, { userId: currentUser.id, timestamp: now, value: newCardData.artText }];
          auditDetails += "Art text changed. ";
        }
        if (updatedCardFields.designerNotes !== undefined && card.designerNotes !== updatedCardFields.designerNotes) {
          newCardData.designerNotes = updatedCardFields.designerNotes;
          newCardData.designerNotesHistory = [...card.designerNotesHistory, { userId: currentUser.id, timestamp: now, value: newCardData.designerNotes }];
          auditDetails += "Designer notes changed. ";
        }
        if (updatedCardFields.finalizedArtUrl !== undefined || (updatedCardFields.finalizedArtUrl === undefined && card.finalizedArtUrl !== undefined) ) { 
          newCardData.finalizedArtUrl = updatedCardFields.finalizedArtUrl;
          newCardData.artFileName = updatedCardFields.artFileName; 
          newCardData.finalizedArtHistory = [...card.finalizedArtHistory, { userId: currentUser.id, timestamp: now, value: newCardData.finalizedArtUrl }];
          auditDetails += newCardData.finalizedArtUrl ? "Art file updated. " : "Art file removed. ";
        }
        return newCardData;
      }
      return card;
    });

    if (!cardUpdated) return post; 
    
    post = resetApprovalsIfNeeded({ ...post, cards: updatedCards }, currentUser);
    const finalAuditDetails = auditDetails.trim() === `Card (ID: ${cardId}) in post "${post.title}" updated:` ? `Card (ID: ${cardId}) metadata updated (no textual/art change detected).` : auditDetails.trim();
    const auditEntry = createAuditLogEntry(currentUser, 'Card Edited', finalAuditDetails, cardId);
    return internalUpdatePostState({...post, cards: updatedCards}, auditEntry);
  };

  const duplicateCardInPost = async (postId: string, cardIdToDuplicate: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    let post = posts.find(p => p.id === postId);
    if (!post) return null;

    const cardToDuplicate = post.cards.find(c => c.id === cardIdToDuplicate);
    if (!cardToDuplicate) return null;
    
    const now = new Date();
    const historyEntry = <T,>(value: T): VersionHistory<T>[] => [{ userId: currentUser.id, timestamp: now, value }];

    const newCard: Card = {
      ...cardToDuplicate, 
      id: generateId(),   
      mainTextHistory: historyEntry(cardToDuplicate.mainText),
      artTextHistory: historyEntry(cardToDuplicate.artText),
      designerNotesHistory: historyEntry(cardToDuplicate.designerNotes),
      finalizedArtHistory: historyEntry(cardToDuplicate.finalizedArtUrl), 
    };

    const cardIndex = post.cards.findIndex(c => c.id === cardIdToDuplicate);
    const updatedCards = [...post.cards];
    updatedCards.splice(cardIndex + 1, 0, newCard); 

    post = resetApprovalsIfNeeded({ ...post, cards: updatedCards }, currentUser);
    
    const auditEntry = createAuditLogEntry(currentUser, 'Card Duplicated', `Card (ID: ${cardToDuplicate.id}) duplicated as new card (ID: ${newCard.id}) in post "${post.title}".`, newCard.id);
    return internalUpdatePostState({...post, cards: updatedCards}, auditEntry);
  };

  const reorderCardsInPost = async (postId: string, orderedCardIds: string[]): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const currentUser = authContext.currentUser;
    let post = posts.find(p => p.id === postId);
    if (!post) return null;

    const reorderedCards: Card[] = [];
    const cardMap = new Map(post.cards.map(card => [card.id, card]));
    
    for (const cardId of orderedCardIds) {
        const card = cardMap.get(cardId);
        if (card) {
            reorderedCards.push(card);
        } else {
            console.warn(`Card with ID ${cardId} not found during reorder for post ${postId}. Skipping.`);
        }
    }
    
     if (reorderedCards.length !== post.cards.length) {
        console.error("Card reorder failed: Mismatch in card count. Ordered IDs did not match existing cards.");
        post.cards.forEach(originalCard => {
            if (!reorderedCards.find(rc => rc.id === originalCard.id)) {
                reorderedCards.push(originalCard);
            }
        });
         if (reorderedCards.length !== post.cards.length) { 
            console.error("Card reorder failed critically. Aborting reorder.");
            return post; 
         }
    }

    let postWithReorderedCards = { ...post, cards: reorderedCards };
    postWithReorderedCards = resetApprovalsIfNeeded(postWithReorderedCards, currentUser);

    const auditEntry = createAuditLogEntry(currentUser, 'Cards Reordered', `Order of cards changed in post "${post.title}".`);
    return internalUpdatePostState(postWithReorderedCards, auditEntry);
  };

  const submitPostForApproval = async (postId: string, approvalDeadline: Date): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext;
    let post = posts.find(p => p.id === postId);
    if (!post || post.status !== PostStatus.DRAFT) return null;

    const now = new Date();
    const newApprovals = post.approvals.map(appr => ({
        ...appr,
        decision: ApprovalDecision.PENDING,
        comment: undefined,
        timestamp: undefined,
    }));

    const updatedPost = {
        ...post,
        status: PostStatus.IN_APPROVAL,
        submittedAt: now,
        approvalDeadline,
        approvals: newApprovals,
    };
    
    const auditEntry = createAuditLogEntry(currentUser, 'Post Submitted for Approval', `Post "${updatedPost.title}" submitted for approval. Deadline: ${approvalDeadline.toLocaleDateString()}.`);
    
    updatedPost.approvals.forEach(appr => {
        if (appr.approverId && !appr.approverId.startsWith('pending-assignment')) {
            if(canSendNotification(appr.approverId, NotificationType.SUBMITTED_FOR_APPROVAL, allUsers)) {
                notificationContext?.addNotification({
                    type: NotificationType.SUBMITTED_FOR_APPROVAL,
                    message: `Post "${updatedPost.title}" by ${currentUser.name} is ready for your approval.`,
                    postId: updatedPost.id,
                    postTitle: updatedPost.title,
                    recipientId: appr.approverId,
                });
            }
        }
    });

    return internalUpdatePostState(updatedPost, auditEntry);
  };
  
  const resubmitPostForApproval = async (postId: string, approvalDeadline: Date): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext;
    let post = posts.find(p => p.id === postId);
    if (!post || post.status !== PostStatus.NEEDS_ADJUSTMENTS) return null;

    const now = new Date();
    const newApprovals = post.approvals.map(appr => ({
        ...appr,
        decision: ApprovalDecision.PENDING,
        comment: undefined,
        timestamp: undefined,
    }));
    const resubmittedAtHistory = [...(post.resubmittedAtHistory || []), now];

    const updatedPost = {
        ...post,
        status: PostStatus.IN_APPROVAL,
        submittedAt: now, 
        approvalDeadline,
        approvals: newApprovals,
        resubmittedAtHistory,
    };
    
    const auditEntry = createAuditLogEntry(currentUser, 'Post Resubmitted for Approval', `Post "${updatedPost.title}" resubmitted for approval. Deadline: ${approvalDeadline.toLocaleDateString()}.`);
    
    updatedPost.approvals.forEach(appr => {
        if (appr.approverId && !appr.approverId.startsWith('pending-assignment')) {
             if(canSendNotification(appr.approverId, NotificationType.POST_RESUBMITTED, allUsers)) {
                notificationContext?.addNotification({
                    type: NotificationType.POST_RESUBMITTED,
                    message: `Post "${updatedPost.title}" has been resubmitted by ${currentUser.name} and is ready for your approval again.`,
                    postId: updatedPost.id,
                    postTitle: updatedPost.title,
                    recipientId: appr.approverId,
                });
            }
        }
    });
    return internalUpdatePostState(updatedPost, auditEntry);
  };


  const recordApprovalDecision = async (postId: string, decision: ApprovalDecision, comment?: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext;
    let post = posts.find(p => p.id === postId);
    if (!post || post.status !== PostStatus.IN_APPROVAL) return null;

    const approverRecord = post.approvals.find(appr => 
      (appr.approverId === currentUser.id || appr.approverDesignation === currentUser.approverDesignation) && 
      !appr.approverId.startsWith("pending-assignment")
    );

    if (!approverRecord || approverRecord.decision !== ApprovalDecision.PENDING) {
        console.error("User not an active approver for this post or already decided.");
        notificationContext?.addNotification({
            type: NotificationType.GENERIC_ERROR,
            message: "You are not currently an active approver for this post or have already submitted your decision.",
            postId: post.id, postTitle: post.title, recipientId: currentUser.id,
        });
        return post; 
    }

    const now = new Date();
    const updatedApprovals = post.approvals.map(appr => 
        appr.approverDesignation === approverRecord.approverDesignation 
        ? { ...appr, approverId: currentUser.id, decision, comment: comment || appr.comment, timestamp: now } 
        : appr
    );

    let newStatus: PostStatus = post.status; 
    let auditEvent = `Approval: ${currentUser.name} (${approverRecord.approverDesignation}) ${decision}`;
    let auditDetails = `Decision: ${decision}.`;
    if (comment) auditDetails += ` Comment: ${comment}`;
    
    let updatedPost: Post = { ...post, approvals: updatedApprovals };

    if (decision === ApprovalDecision.REJECTED) {
        newStatus = PostStatus.NEEDS_ADJUSTMENTS;
        updatedPost = { ...updatedPost, status: newStatus };
        if(canSendNotification(post.authorId, NotificationType.POST_REJECTED_OVERALL, allUsers)) {
            notificationContext?.addNotification({
                type: NotificationType.POST_REJECTED_OVERALL,
                message: `Post "${post.title}" was marked as 'Needs Adjustments' by ${currentUser.name}. Reason: ${comment}`,
                postId: post.id, postTitle: post.title, recipientId: post.authorId,
            });
        }
    } else if (decision === ApprovalDecision.APPROVED) {
         if(canSendNotification(post.authorId, NotificationType.APPROVAL_DECISION, allUsers)) {
            notificationContext?.addNotification({
                type: NotificationType.APPROVAL_DECISION,
                message: `Post "${post.title}" was approved by ${currentUser.name} (${approverRecord.approverDesignation}).`,
                postId: post.id, postTitle: post.title, recipientId: post.authorId,
            });
        }
    }
    
    const finalPostAfterDecision = internalUpdatePostState(updatedPost, createAuditLogEntry(currentUser, auditEvent, auditDetails));
    
    if (finalPostAfterDecision && decision === ApprovalDecision.APPROVED) {
        return checkAndUpdateOverallPostStatus(postId, currentUser.id);
    }
    
    return finalPostAfterDecision;
  };

  const checkAndUpdateOverallPostStatus = async (postId: string, performingUserId: string): Promise<Post | null> => {
    let post = posts.find(p => p.id === postId);
    if (!post || !authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext; // Use allUsers here for canSendNotification
    const performingUser = allUsers.find(u => u.id === performingUserId) || currentUser;


    const ceoApproval = post.approvals.find(a => a.approverDesignation === ApproverDesignation.CEO);
    const cooApproval = post.approvals.find(a => a.approverDesignation === ApproverDesignation.COO);
    const cmoApproval = post.approvals.find(a => a.approverDesignation === ApproverDesignation.CMO);

    let newOverallStatus = post.status;
    let overallApprovalEvent = "";

    if (ceoApproval?.decision === ApprovalDecision.APPROVED &&
        cooApproval?.decision === ApprovalDecision.APPROVED &&
        cmoApproval?.decision === ApprovalDecision.APPROVED) {
        newOverallStatus = PostStatus.APPROVED;
        overallApprovalEvent = "Post Approved (All Approvers)";
    }
    else if (cmoApproval?.decision === ApprovalDecision.APPROVED && post.approvalDeadline && new Date() >= post.approvalDeadline) {
        const otherMainApproversPending = [ceoApproval, cooApproval].some(a => a?.decision === ApprovalDecision.PENDING);
        if (otherMainApproversPending) { 
            newOverallStatus = PostStatus.APPROVED;
            overallApprovalEvent = "Post Approved (CMO Override at Deadline)";
        }
    }
    
    if (newOverallStatus === PostStatus.APPROVED && post.status !== PostStatus.APPROVED) {
        const now = new Date();
        const updatedPost = { ...post, status: newOverallStatus, approvalDate: now };
        const auditEntry = createAuditLogEntry(performingUser, overallApprovalEvent, `Post "${post.title}" status changed to Approved.`);
        
        if(canSendNotification(post.authorId, NotificationType.POST_APPROVED_OVERALL, allUsers)) {
            notificationContext?.addNotification({
                type: NotificationType.POST_APPROVED_OVERALL,
                message: `Congratulations! Your post "${post.title}" has been fully approved.`,
                postId: post.id, postTitle: post.title, recipientId: post.authorId,
            });
        }
        return internalUpdatePostState(updatedPost, auditEntry);
    }
    return post; 
  };

  const publishPost = async (postId: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext;
    let post = posts.find(p => p.id === postId);

    if (!post) {
      notificationContext?.addNotification({
        type: NotificationType.GENERIC_ERROR, message: `Post with ID ${postId} not found.`, recipientId: currentUser.id,
      });
      return null;
    }

    if (post.status !== PostStatus.APPROVED) {
      notificationContext?.addNotification({
        type: NotificationType.GENERIC_ERROR, message: `Post "${post.title}" must be Approved before publishing. Current status: ${post.status}.`,
        postId: post.id, postTitle: post.title, recipientId: currentUser.id,
      });
      return post;
    }

    if (post.authorId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      notificationContext?.addNotification({
        type: NotificationType.GENERIC_ERROR, message: `You do not have permission to publish the post "${post.title}".`,
        postId: post.id, postTitle: post.title, recipientId: currentUser.id,
      });
      return post;
    }

    const updatedPostData = { ...post, status: PostStatus.PUBLISHED };
    const auditEntry = createAuditLogEntry(currentUser, 'Post Published', `Post "${post.title}" was marked as Published.`);
    
    // Notify author (current user might be admin, so check author's prefs too)
    if (canSendNotification(post.authorId, NotificationType.STATUS_CHANGED, allUsers)) {
        notificationContext?.addNotification({
            type: NotificationType.STATUS_CHANGED,
            message: `Post "${post.title}" has been successfully published!`,
            postId: post.id, postTitle: post.title, recipientId: post.authorId,
        });
    }
    // If current user is admin and not author, also notify admin if they have preferences set (though usually admin actions aren't self-notified like this unless specific logic)
    
    return internalUpdatePostState(updatedPostData, auditEntry);
  };

  const archivePost = async (postId: string): Promise<Post | null> => {
    if (!authContext?.currentUser) return null;
    const { currentUser, allUsers } = authContext;
    let post = posts.find(p => p.id === postId);

    if (!post) {
      notificationContext?.addNotification({
        type: NotificationType.GENERIC_ERROR, message: `Post with ID ${postId} not found.`, recipientId: currentUser.id,
      });
      return null;
    }

    if (post.status === PostStatus.ARCHIVED) {
      notificationContext?.addNotification({
        type: NotificationType.GENERIC_ERROR, message: `Post "${post.title}" is already archived.`,
        postId: post.id, postTitle: post.title, recipientId: currentUser.id,
      });
      return post;
    }
    
    const canArchive = currentUser.id === post.authorId || currentUser.role === UserRole.ADMIN;
    if (!canArchive) {
        notificationContext?.addNotification({
            type: NotificationType.GENERIC_ERROR, message: `You do not have permission to archive the post "${post.title}".`,
            postId: post.id, postTitle: post.title, recipientId: currentUser.id,
        });
        return post;
    }

    const updatedPostData = { ...post, status: PostStatus.ARCHIVED };
    const auditEntry = createAuditLogEntry(currentUser, 'Post Archived', `Post "${post.title}" was marked as Archived.`);
    
    if (canSendNotification(post.authorId, NotificationType.STATUS_CHANGED, allUsers)) {
      notificationContext?.addNotification({
          type: NotificationType.STATUS_CHANGED,
          message: `Post "${post.title}" has been archived.`,
          postId: post.id, postTitle: post.title, recipientId: post.authorId,
      });
    }
    
    return internalUpdatePostState(updatedPostData, auditEntry);
  };


  return (
    <PostContext.Provider value={{ 
        posts, isLoading, fetchPosts, getPostById, createPost, updatePost,
        addCardToPost, removeCardFromPost, updateCardInPost, duplicateCardInPost, reorderCardsInPost,
        submitPostForApproval, recordApprovalDecision, resubmitPostForApproval,
        publishPost, archivePost
    }}>
      {children}
    </PostContext.Provider>
  );
};
