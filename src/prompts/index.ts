// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Prompts Module - Export all prompt utilities
 */

export type { ErrorPrompt, ErrorPromptArgument } from "./error-resolution.js";
// Phase B: Error resolution prompts (now sourced from upstream)
export {
	clearErrorCache,
	getErrorPrompt,
	getErrorPromptByName,
	getErrorPrompts,
	processErrorTemplate,
} from "./error-resolution.js";
export type { WorkflowArgument, WorkflowPrompt } from "./workflows.js";
export {
	clearWorkflowCache,
	getWorkflowPrompt,
	getWorkflowPrompts,
	processPromptTemplate,
} from "./workflows.js";
