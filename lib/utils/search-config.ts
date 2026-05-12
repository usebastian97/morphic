/**
 * Search provider configuration utilities
 * Provides environment-aware descriptions and guidance for search tools
 */

/**
 * Checks if a dedicated "general" search provider is available
 */
export function isGeneralSearchProviderAvailable(): boolean {
  return !!process.env.PARALLEL_API_KEY
}

/**
 * Gets the name of the current general search provider
 */
export function getGeneralSearchProviderName(): string {
  if (process.env.PARALLEL_API_KEY) {
    return 'Parallel Search'
  }
  return 'primary provider'
}

/**
 * Checks if the general search provider supports multimedia content types
 */
export function supportsMultimediaContentTypes(): boolean {
  return false
}

/**
 * Gets the appropriate search type description based on available providers
 */
export function getSearchTypeDescription(): string {
  return 'Search type is preserved for compatibility. SwissTaxSearch uses Parallel Search for both general and optimized searches, returning official Swiss tax snippets with official-source metadata.'
}

/**
 * Gets the tool description based on available providers
 */
export function getSearchToolDescription(): string {
  return 'Search official Swiss federal, cantonal, and municipal tax websites with Parallel. The tool enriches the user query, restricts results to official Swiss tax domains from Supabase, and returns provenance metadata.'
}

/**
 * Gets content types guidance for agent prompts
 */
export function getContentTypesGuidance(): string {
  return `- **type="general" and type="optimized":**
  - Both use Parallel Search with SwissTaxSearch query enrichment
  - Returns LLM-optimized snippets from official Swiss tax websites
  - Official federal, cantonal, and municipal domains from Supabase are required
  - Open-web fallback is disabled; insufficient official coverage must be stated clearly
  - Video/image content_types are ignored by the SwissTaxSearch provider`
}

/**
 * Gets the search strategy guidance for planning mode
 */
export function getSearchStrategyGuidance(): string {
  return `Search strategy:
- Use search for every Swiss tax information request before answering
- Let the tool enrich the user query into official Swiss tax search queries
- Use only official federal, cantonal, and municipal source results
- If official coverage is thin, state the limitation instead of using open-web fallback`
}

/**
 * Gets the appropriate search provider type for "general" searches
 * Returns 'brave' if available, otherwise null to indicate fallback
 */
export function getGeneralSearchProviderType(): null {
  return null
}
