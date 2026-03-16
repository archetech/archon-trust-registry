import { config } from '../config.js';

// Cache for name -> DID mappings (refreshed periodically)
let nameCache: Map<string, string> = new Map();
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch the archon.social registry and cache name mappings
 */
async function refreshNameCache(): Promise<void> {
  try {
    // Use archon.social registry endpoint
    const registryUrl = 'https://archon.social/api/registry';
    const response = await fetch(registryUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch registry: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const names = data.names || {};
    
    nameCache = new Map(Object.entries(names));
    lastFetch = Date.now();
    
    console.log(`Name cache refreshed: ${nameCache.size} names`);
  } catch (error) {
    console.error(`Error refreshing name cache: ${error}`);
  }
}

/**
 * Check if a string looks like a DID
 */
export function isDID(value: string): boolean {
  return value.startsWith('did:');
}

/**
 * Resolve a name or DID to a DID
 * - If it's already a DID, return as-is
 * - If it's a name, look up in the registry
 */
export async function resolveToDID(nameOrDid: string): Promise<string | null> {
  // Already a DID
  if (isDID(nameOrDid)) {
    return nameOrDid;
  }
  
  // Normalize name (remove @ prefix if present)
  const name = nameOrDid.replace(/^@/, '').toLowerCase();
  
  // Refresh cache if stale
  if (Date.now() - lastFetch > CACHE_TTL) {
    await refreshNameCache();
  }
  
  // Look up in cache
  const did = nameCache.get(name);
  
  if (did) {
    return did;
  }
  
  // Try direct lookup via registry (in case cache is stale)
  await refreshNameCache();
  return nameCache.get(name) || null;
}

/**
 * Get the display name for a DID (reverse lookup)
 */
export function getNameForDID(did: string): string | null {
  for (const [name, d] of nameCache.entries()) {
    if (d === did) {
      return name;
    }
  }
  return null;
}
