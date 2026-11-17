// Types
export {
  AgentRole,
  AIProvider,
  ToolName,
  MAX_DOCUMENT_TEXT_LENGTH,
  MAX_AGENT_DOCUMENT_SIZE,
  DOCUMENT_REDIS_TTL,
  MAX_STEPS_PER_ROUND,
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  TOKEN_COST_ESTIMATES
} from './types';

export type {
  AIProviderConfig,
  AgentContext,
  TokenUsage,
  TokenBalance,
  AgentStatus,
  AgentTutorStatus,
  DocumentUploadResult
} from './types';

// Providers
export { createModel, getProviderConfigForProvider, pickAnyConfiguredProvider } from './providers';

// Tools
export { getToolSchemas } from './tools';
export type { ToolSchema } from './tools';

// Prompts
export {
  buildSystemPrompt,
  buildStudentSystemPrompt,
  buildContextMessage,
  buildStudentContextMessage
} from './prompt';

// Tutor configuration
export {
  TUTOR_PERSONA_IDS,
  TUTOR_RESPONSE_LENGTHS,
  TUTOR_ASSESSMENT_MODES,
  TUTOR_CODE_POLICIES,
  TUTOR_GROUNDING_SCOPES,
  defaultAiTutorSettings,
  mergeAiTutorSettings,
  STUDENT_TUTOR_MONTHLY_CAP,
  STUDENT_TUTOR_APPROACHING_THRESHOLD,
  type AiTutorSettings,
  type AiTutorEscalation,
  type TutorPersonaId,
  type TutorResponseLength,
  type TutorAssessmentMode,
  type TutorCodePolicy,
  type TutorGroundingScope
} from './tutor-config';
