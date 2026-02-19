// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Server Module Exports
 *
 * Re-exports for modular access.
 */

// Handlers
export {
	type ResourceRegistrationContext,
	registerPrompts,
	registerResources,
	registerTools,
	type ToolRegistrationContext,
} from "./handlers/index.js";

// Response utilities
export {
	createErrorResponse,
	createTextResponse,
	extractStringArguments,
} from "./response-utils.js";
// Types
export type {
	RegisterToolsFunction,
	ServerConfig,
	ToolHandlerContext,
} from "./types.js";
