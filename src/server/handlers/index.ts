// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Handler Exports
 *
 * Central export point for all MCP handlers.
 */

export { registerPrompts } from "./prompt-handler.js";
export {
  type ResourceRegistrationContext,
  registerResources,
} from "./resource-handler.js";
export {
  registerAnalysisTools,
  registerDiscoveryTools,
  registerExecutionTools,
  registerGuidanceTools,
  registerMetadataTools,
  registerPlanningTools,
  registerTools,
  type ToolRegistrationContext,
} from "./tool-handlers/index.js";
