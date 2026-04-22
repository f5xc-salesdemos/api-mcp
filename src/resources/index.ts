// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Resources Module - Export all resource utilities
 */

export type { ResourceDocumentation, ResourceReadResult } from "./handlers.js";
export { createResourceHandler, ResourceHandler } from "./handlers.js";
export type { ResourceType } from "./templates.js";
export {
  buildApiPath,
  buildResourceUri,
  clearEnhancedTypesCache,
  enhanceWithDomainContext,
  getEnhancedResourceTypes,
  getResourceType,
  getResourceTypesByTier,
  parseResourceUri,
  RESOURCE_SCHEMES,
  RESOURCE_TYPES,
} from "./templates.js";
