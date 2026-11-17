import type { AgentContext } from '../types';
import { buildStudentSystemPrompt, buildStudentContextMessage } from './student';
import type { AiTutorSettings } from '../tutor-config';

export function buildSystemPrompt(
  context: AgentContext,
  options?: { tutorSettings?: AiTutorSettings; isOrgOnPaidPlan?: boolean }
): string {
  return buildStudentSystemPrompt(context, options?.tutorSettings);
}

export function buildContextMessage(
  context: AgentContext
): string {
  return buildStudentContextMessage(context);
}

export { buildStudentSystemPrompt, buildStudentContextMessage };
