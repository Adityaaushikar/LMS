export const AI_COURSE_CHAT_DEFAULT_WIDTH = 360;
export const AI_COURSE_CHAT_MIN_WIDTH = 280;
export const AI_COURSE_CHAT_MAX_WIDTH = 520;
export const AI_COURSE_CHAT_STORAGE_KEY = 'classroomio-ai-course-chat-width';
export const AI_CHAT_MODEL_STORAGE_KEY = 'classroomio-ai-chat-model';

export const AI_COURSE_CHAT_FLOATING_STORAGE_KEY = 'classroomio-ai-course-chat-floating';
export const AI_COURSE_CHAT_FLOATING_DEFAULT_WIDTH_REM = 26;
export const AI_COURSE_CHAT_FLOATING_DEFAULT_HEIGHT = 560;
export const AI_COURSE_CHAT_FLOATING_MIN_WIDTH = 320;
export const AI_COURSE_CHAT_FLOATING_MIN_HEIGHT = 380;
export const AI_ASSISTANT_POPOUT_TIP_DISMISSED_KEY = 'classroomio-ai-assistant-popout-tip-dismissed';

export const STUDENT_QUICK_ACTION_ENTRIES = [
  {
    key: 'ai_assistant.student_quick_action.explain_lesson',
    prompt: 'Explain this lesson'
  },
  {
    key: 'ai_assistant.student_quick_action.quiz_me',
    prompt: 'Quiz me on this'
  },
  {
    key: 'ai_assistant.student_quick_action.summarize_section',
    prompt: 'Summarize this section'
  },
  {
    key: 'ai_assistant.student_quick_action.what_to_review',
    prompt: 'What should I review next?'
  }
] as const;
