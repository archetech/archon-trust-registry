import { config, roleHierarchy } from '../config.js';

interface GroupTestResult {
  isMember: boolean;
  role?: string;
}

/**
 * Test if a DID is a member of a group via Gatekeeper API
 */
async function testGroup(groupDid: string, memberDid: string): Promise<boolean> {
  try {
    const url = `${config.gatekeeperUrl}/api/v1/did/${encodeURIComponent(groupDid)}/test/${encodeURIComponent(memberDid)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result === true || result?.member === true;
  } catch (error) {
    console.error(`Error testing group membership: ${error}`);
    return false;
  }
}

/**
 * Resolve a DID document
 */
export async function resolveDid(did: string): Promise<any> {
  try {
    const url = `${config.gatekeeperUrl}/api/v1/did/${encodeURIComponent(did)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error resolving DID: ${error}`);
    return null;
  }
}

/**
 * Check entity's role in the registry's group hierarchy
 * Returns the highest role the entity holds
 */
export async function getEntityRole(entityDid: string): Promise<GroupTestResult> {
  // Check from highest to lowest in hierarchy
  const groupChecks = [
    { role: 'owner', groupDid: config.groups.owner },
    { role: 'admin', groupDid: config.groups.admin },
    { role: 'moderator', groupDid: config.groups.moderator },
    { role: 'member', groupDid: config.groups.member },
  ];
  
  for (const { role, groupDid } of groupChecks) {
    if (!groupDid) continue;
    
    const isMember = await testGroup(groupDid, entityDid);
    if (isMember) {
      return { isMember: true, role };
    }
  }
  
  return { isMember: false };
}

/**
 * Check if entity is authorized to perform action
 */
export async function checkAuthorization(
  entityDid: string,
  action: string,
  resource?: string
): Promise<{
  authorized: boolean;
  role?: string;
  error?: string;
}> {
  // Get entity's role
  const { isMember, role } = await getEntityRole(entityDid);
  
  if (!isMember || !role) {
    return {
      authorized: false,
      error: 'Entity is not a member of any authorized group'
    };
  }
  
  // Check if role can perform action
  const roleConfig = config.roles[role];
  if (!roleConfig) {
    return {
      authorized: false,
      error: `Unknown role: ${role}`
    };
  }
  
  const canPerform = roleConfig.actions.includes(action);
  
  if (!canPerform) {
    return {
      authorized: false,
      role,
      error: `Role '${role}' is not authorized for action '${action}'`
    };
  }
  
  return {
    authorized: true,
    role
  };
}
