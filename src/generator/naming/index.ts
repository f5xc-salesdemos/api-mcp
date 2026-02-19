// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Naming Module - Export all naming utilities
 *
 * Pre-enriched specs from robinmordasiewicz/f5xc-api-enriched already have
 * naming transformations applied, so legacy transform functions have been removed.
 */

export {
  clearAcronymCache,
  getCanonicalAcronym,
  getTechnicalAcronyms,
  isAcronym,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from "./acronyms.js";

export {
  extractResourceFromPath,
  generateToolName,
  methodToOperation,
} from "./volterra-mapping.js";
