import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load roles configuration
const rolesPath = join(__dirname, '..', 'roles.json');
const rolesConfig = JSON.parse(readFileSync(rolesPath, 'utf-8'));

export interface RoleConfig {
  actions: string[];
  description: string;
}

export interface Config {
  // Registry identity
  registryDid: string;
  registryName: string;
  
  // Gatekeeper
  gatekeeperUrl: string;
  
  // Resource format
  resourceFormat: 'did' | 'name' | 'both';
  
  // Server
  port: number;
  
  // Group DIDs
  groups: {
    owner: string;
    admin: string;
    moderator: string;
    member: string;
  };
  
  // Role mappings
  roles: Record<string, RoleConfig>;
  
  // Supported actions
  supportedActions: string[];
}

export const config: Config = {
  registryDid: process.env.REGISTRY_DID || '',
  registryName: process.env.REGISTRY_NAME || 'Archon Trust Registry',
  gatekeeperUrl: process.env.GATEKEEPER_URL || 'https://archon.technology',
  resourceFormat: (process.env.RESOURCE_FORMAT as Config['resourceFormat']) || 'both',
  port: parseInt(process.env.PORT || '4260', 10),
  
  groups: {
    owner: process.env.OWNER_GROUP || '',
    admin: process.env.ADMIN_GROUP || '',
    moderator: process.env.MODERATOR_GROUP || '',
    member: process.env.MEMBER_GROUP || '',
  },
  
  roles: rolesConfig.roles,
  supportedActions: ['issue', 'verify', 'hold', 'present', 'revoke'],
};

// Role hierarchy (for group membership checks)
export const roleHierarchy = ['member', 'moderator', 'admin', 'owner'];

export function getActionsForRole(role: string): string[] {
  return config.roles[role]?.actions || [];
}

export function canRolePerformAction(role: string, action: string): boolean {
  const actions = getActionsForRole(role);
  return actions.includes(action);
}
