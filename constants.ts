
import { UserRole, ApproverDesignation, PostStatus, ApprovalDecision, User, Tag, Release, AdminSettings, UserNotificationPreferences } from './types';

export const APP_NAME = "Content Approval System";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB in bytes
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
export const SUPPORTED_VIDEO_TYPES = ["video/mp4"];

export const DEFAULT_USER_ROLE = UserRole.EDITOR;
export const REMINDER_THRESHOLD_HOURS = 24; // Hours before deadline to send a reminder

export const APPROVER_ROLES: ApproverDesignation[] = [
  ApproverDesignation.CEO,
  ApproverDesignation.COO,
  ApproverDesignation.CMO,
];

const defaultNotificationPreferences: UserNotificationPreferences = {
  receiveInAppNewSubmissions: true,
  receiveInAppApprovalDecisions: true,
};

export const INITIAL_USERS: User[] = [
  { id: 'user1', name: 'Alice Editor', email: 'alice@example.com', role: UserRole.EDITOR, notificationPreferences: { ...defaultNotificationPreferences } },
  { id: 'user2', name: 'Bob Admin', email: 'bob@example.com', role: UserRole.ADMIN, notificationPreferences: { ...defaultNotificationPreferences } },
  { id: 'user3', name: 'Charlie CEO', email: 'charlie@example.com', role: UserRole.APPROVER, approverDesignation: ApproverDesignation.CEO, notificationPreferences: { ...defaultNotificationPreferences } },
  { id: 'user4', name: 'Diana COO', email: 'diana@example.com', role: UserRole.APPROVER, approverDesignation: ApproverDesignation.COO, notificationPreferences: { ...defaultNotificationPreferences } },
  { id: 'user5', name: 'Edward CMO', email: 'edward@example.com', role: UserRole.APPROVER, approverDesignation: ApproverDesignation.CMO, notificationPreferences: { ...defaultNotificationPreferences } },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag1', name: 'Product Update' },
  { id: 'tag2', name: 'Marketing Campaign' },
  { id: 'tag3', name: 'Internal Memo' },
];

export const INITIAL_RELEASES: Release[] = [
  { id: 'release1', name: 'Q3 Campaign', startDate: new Date(2024, 6, 1), endDate: new Date(2024, 8, 30) },
  { id: 'release2', name: 'Holiday Season Push', startDate: new Date(2024, 10, 15) },
];

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  restrictedDomain: 'example.com',
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  [PostStatus.DRAFT]: 'bg-gray-200 text-gray-800',
  [PostStatus.IN_APPROVAL]: 'bg-blue-200 text-blue-800',
  [PostStatus.NEEDS_ADJUSTMENTS]: 'bg-yellow-200 text-yellow-800',
  [PostStatus.APPROVED]: 'bg-green-200 text-green-800',
  [PostStatus.PUBLISHED]: 'bg-purple-200 text-purple-800',
  [PostStatus.ARCHIVED]: 'bg-stone-200 text-stone-800',
};

export const APPROVAL_DECISION_COLORS: Record<ApprovalDecision, string> = {
  [ApprovalDecision.PENDING]: 'bg-gray-200 text-gray-800',
  [ApprovalDecision.APPROVED]: 'bg-green-200 text-green-800',
  [ApprovalDecision.REJECTED]: 'bg-red-200 text-red-800',
};

// Simple unique ID generator
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const MAX_MAIN_TEXT_LENGTH = 1000;
export const MAX_ART_TEXT_LENGTH = 200;
