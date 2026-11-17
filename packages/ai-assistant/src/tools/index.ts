import { AgentRole, ToolName } from '../types';
import type { ZodType } from 'zod';
import { getCourseStructureSchema, getLessonContentSchema, getExerciseDetailsSchema } from './shared';
import {
  listCourseOutlineSchema,
  readLessonSchema,
  readExerciseSchema,
  readMySubmissionsSchema,
  searchCourseSchema
} from './student';

export type ToolSchema = {
  description: string;
  parameters: ZodType;
};

type ToolRegistry = Record<string, ToolSchema>;

const sharedTools: ToolRegistry = {
  [ToolName.GET_COURSE_STRUCTURE]: getCourseStructureSchema,
  [ToolName.GET_LESSON_CONTENT]: getLessonContentSchema,
  [ToolName.GET_EXERCISE_DETAILS]: getExerciseDetailsSchema
};

const studentTools: ToolRegistry = {
  [ToolName.LIST_COURSE_OUTLINE]: listCourseOutlineSchema,
  [ToolName.READ_LESSON]: readLessonSchema,
  [ToolName.READ_EXERCISE]: readExerciseSchema,
  [ToolName.READ_MY_SUBMISSIONS]: readMySubmissionsSchema,
  [ToolName.SEARCH_COURSE]: searchCourseSchema
};

export function getToolSchemas(role: AgentRole): ToolRegistry {
  return { ...sharedTools, ...studentTools };
}

export {
  getCourseStructureSchema,
  getLessonContentSchema,
  getExerciseDetailsSchema,
  listCourseOutlineSchema,
  readLessonSchema,
  readExerciseSchema,
  readMySubmissionsSchema,
  searchCourseSchema
};
