
export enum UserRole {
  EDITOR = 'Editor',
  APPROVER = 'Approver',
  ADMIN = 'Admin',
}

export enum ApproverDesignation {
  CEO = 'CEO',
  COO = 'COO',
  CMO = 'CMO',
}

export interface UserNotificationPreferences {
  receiveInAppNewSubmissions: boolean;
  receiveInAppApprovalDecisions: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approverDesignation?: ApproverDesignation; // Only if role is Approver
  notificationPreferences?: UserNotificationPreferences; // Added for RF039
}

export enum PostStatus {
  DRAFT = 'Draft',
  IN_APPROVAL = 'In Approval',
  NEEDS_ADJUSTMENTS = 'Needs Adjustments',
  APPROVED = 'Approved',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived',
}

export enum ApprovalDecision {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface IndividualApproval {
  approverId: string; // User ID of the approver
  approverDesignation: ApproverDesignation;
  decision: ApprovalDecision;
  comment?: string;
  timestamp?: Date;
}

export interface VersionHistory<T> {
  userId: string;
  timestamp: Date;
  value: T;
}

export interface Card {
  id: string;
  mainText: string;
  mainTextHistory: VersionHistory<string>[];
  artText: string;
  artTextHistory: VersionHistory<string>[];
  designerNotes: string;
  designerNotesHistory: VersionHistory<string>[];
  finalizedArtUrl?: string; // URL or base64 string
  finalizedArtHistory: VersionHistory<string | undefined>[];
  artFileName?: string;
  // Character count limits (conceptual, actual enforcement in UI/logic)
  MAX_MAIN_TEXT_LENGTH?: number; 
  MAX_ART_TEXT_LENGTH?: number;
}

export interface Post {
  id: string;
  title: string;
  titleHistory: VersionHistory<string>[];
  publicationDate?: Date;
  generalBriefing: string;
  generalBriefingHistory: VersionHistory<string>[];
  tags: string[]; // Array of Tag IDs
  releaseId?: string; // Release ID
  cards: Card[];
  status: PostStatus;
  approvals: IndividualApproval[];
  approvalDeadline?: Date;
  auditLog: AuditLogEntry[];
  authorId: string; // User ID of the creator
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvalDate?: Date; // Date when the post was fully approved
  resubmittedAtHistory?: Date[]; // History of resubmission dates
}

// Type for data needed to create a new post
export interface PostCreationData {
  title: string;
  publicationDate?: Date;
  generalBriefing: string;
  tagIds: string[];      // Changed from tags to tagIds for clarity
  releaseId?: string;
}


export interface Release {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TagCreationData {
  name: string;
}

export interface ReleaseCreationData {
  name: string;
  startDate?: string; // Use string for form input, convert to Date on save
  endDate?: string;   // Use string for form input, convert to Date on save
}


export enum NotificationType {
  SUBMITTED_FOR_APPROVAL = 'Submitted for Approval',
  APPROVAL_DECISION = 'Approval Decision',
  STATUS_CHANGED = 'Status Changed',
  DEADLINE_REMINDER = 'Deadline Reminder', // RF036
  POST_EDITED_IN_APPROVAL = 'Post Edited (In Approval)',
  GENERIC_SUCCESS = 'Generic Success',
  GENERIC_ERROR = 'Generic Error',
  ADMIN_ACTION = 'Admin Action', // For tag/release management notifications
  CARD_ACTION = 'Card Action', // For card related notifications
  APPROVAL_RESET = 'Approval Process Reset',
  POST_APPROVED_OVERALL = 'Post Approved',
  POST_REJECTED_OVERALL = 'Post Needs Adjustments', // after a rejection
  POST_RESUBMITTED = 'Post Resubmitted for Approval',
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  postId?: string;
  postTitle?: string;
  isRead: boolean;
  timestamp: Date;
  recipientId: string; // User ID
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  event: string; // e.g., "Post Created", "Card Edited", "Approved by CEO"
  userId: string;
  userName: string; // For easier display
  details?: string; // e.g., "Title changed from 'Old' to 'New'", "Rejection comment: ..."
  oldValue?: string;
  newValue?: string;
  cardId?: string; // For card-specific logs
}

export interface AdminSettings {
  restrictedDomain: string;
}
