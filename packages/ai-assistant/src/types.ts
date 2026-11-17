// ─── Agent Roles ─────────────────────────────────────────────────────────────

export const AgentRole = {
  TEACHER: 'teacher',
  STUDENT: 'student'
} as const;

export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

// ─── AI Provider Configuration ───────────────────────────────────────────────

export const AIProvider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  MOONSHOT: 'moonshot'
} as const;

export type AIProvider = (typeof AIProvider)[keyof typeof AIProvider];

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// ─── Agent Context (passed with each chat message) ───────────────────────────

export interface AgentContext {
  orgId: string;
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
  userId: string;
  role: AgentRole;
  locale: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;
  exerciseId?: string;
  exerciseTitle?: string;
  studentSubmission?: unknown;
  documentId?: string;
  documentText?: string;
  /** Metadata for documents attached to this conversation — used to attach originals to lessons. */
  documentAssets?: { documentId: string; assetId: string | null; fileName: string }[];
  existingSectionCount?: number;
  /** When false, content grouping is disabled: lessons/exercises are displayed as a flat ordered list and sections are hidden from students. */
  isContentGroupingEnabled?: boolean;
}

// ─── Tool Names ──────────────────────────────────────────────────────────────

export const ToolName = {
  // Read tools (shared)
  GET_COURSE_STRUCTURE: 'get_course_structure',
  GET_LESSON_CONTENT: 'get_lesson_content',
  GET_EXERCISE_DETAILS: 'get_exercise_details',
  // Student read tools (course-scoped, read-only)
  LIST_COURSE_OUTLINE: 'list_course_outline',
  READ_LESSON: 'read_lesson',
  READ_EXERCISE: 'read_exercise',
  READ_MY_SUBMISSIONS: 'read_my_submissions',
  SEARCH_COURSE: 'search_course'
} as const;

export type ToolName = (typeof ToolName)[keyof typeof ToolName];

// ─── Token Usage ─────────────────────────────────────────────────────────────

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenBalance {
  used: number;
  allowance: number;
  creditBalance: number;
  remaining: number;
}

// ─── Agent Status (returned by GET /agent/status) ────────────────────────────

export interface AgentTutorStatus {
  /** Whether AI tutor is enabled for this workspace. */
  enabled: boolean;
  /** Remaining tutor messages for the current learner this calendar month (only set for students). */
  capRemaining: number | null;
  /** Per-learner monthly cap value (only set for students). */
  cap: number | null;
  /** Whether cap enforcement is on in this environment (Phase 3+). */
  enforced: boolean;
}

export interface AgentStatus {
  enabled: boolean;
  role: AgentRole;
  usage: TokenBalance;
  tutor: AgentTutorStatus;
}

// ─── Document Upload ─────────────────────────────────────────────────────────

export interface DocumentUploadResult {
  documentId: string;
  fileName: string;
  mimeType: string;
  pageCount: number | null;
  wordCount: number;
  textPreview: string;
  truncated: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum characters of extracted document text to include in LLM context */
export const MAX_DOCUMENT_TEXT_LENGTH = 40_000;

/** Maximum file size for document upload (5MB) */
export const MAX_AGENT_DOCUMENT_SIZE = 5 * 1024 * 1024;

/** Redis TTL for uploaded document text (1 hour) */
export const DOCUMENT_REDIS_TTL = 3600;

/** Maximum steps per streamText() round; each step re-bills the full prompt. */
export const MAX_STEPS_PER_ROUND = 8;

/** Supported MIME types for document upload */
export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text'
] as const;

/** Supported file extensions for document upload */
export const SUPPORTED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.odt'] as const;

/** Token cost estimation heuristics (tokens per item) */
export const TOKEN_COST_ESTIMATES = {
  SECTION_CREATE: 500,
  LESSON_CREATE_AND_CONTENT: 3000,
  EXERCISE_CREATE: 1500
} as const;
