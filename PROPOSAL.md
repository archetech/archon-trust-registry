# Archon Trust Registry

**ToIP-Compliant Trust Registry Protocol (TRQP) Implementation**

## Overview

A trust registry answers one question: **"Is this entity authorized to do this thing?"**

Archon Trust Registry implements the [ToIP Trust Registry Query Protocol (TRQP) v2.0](https://trustoverip.github.io/tswg-trust-registry-protocol/) specification, exposing Archon's existing group/credential infrastructure through a standardized API.

**Use cases:**
- Is `@genitrix` authorized to issue credentials on behalf of `archon.social`?
- Does `archon.social` recognize `did:web:riaa.com` as a peer authority?
- Is this AI agent authorized to act for this human?

## Why a Separate Repo?

Anyone running an Archon node can become a trust registry. This repo provides:
- Standalone TRQP server (connects to any Gatekeeper)
- Reference implementation for the creative industry
- Easy deployment for ecosystems wanting their own registry

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  TRQP Consumer  │────▶│  Archon Trust        │────▶│  Gatekeeper     │
│  (verifier app) │     │  Registry Server     │     │  (DID resolver) │
└─────────────────┘     └──────────┬───────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Authority Wallet    │
                        │  (groups, creds)     │
                        └──────────────────────┘
```

## TRQP ↔ Archon Mapping

| TRQP Concept | Archon Primitive |
|--------------|------------------|
| Authority | DID with groups (e.g., `did:cid:archon.social`) |
| Entity | Any DID (user, agent, organization) |
| Authorization Statement | Group membership OR issued credential |
| Recognition Statement | Mutual group membership OR trust credential |
| Action | `issue`, `verify`, `hold`, `present`, `revoke` |
| Resource | Credential schema DID |

## API Endpoints

### 1. Authorization Query

**"Has Authority A authorized Entity B to take Action X on Resource Y?"**

```http
GET /trqp/v1/authorization
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `authority_id` | Yes | DID of the governing authority |
| `entity_id` | Yes | DID of the entity being queried |
| `action` | Yes | Action type: `issue`, `verify`, `hold`, `present` |
| `resource` | No | Schema DID or credential type |

**Example Request:**
```http
GET /trqp/v1/authorization?authority_id=did:cid:bagaaiera...archon.social&entity_id=did:cid:bagaaiera...genitrix&action=issue&resource=did:cid:bagaaiera...MembershipCredential
```

**Response (authorized):**
```json
{
  "authorized": true,
  "authority_id": "did:cid:bagaaiera...archon.social",
  "entity_id": "did:cid:bagaaiera...genitrix",
  "action": "issue",
  "resource": "MembershipCredential",
  "statement": {
    "type": "GroupMembership",
    "group": "IssuerGroup",
    "role": "issuer"
  }
}
```

**Response (not authorized):**
```json
{
  "authorized": false,
  "error": "Entity is not a member of any authorized group"
}
```

### 2. Recognition Query

**"Does Authority X recognize Authority Y as a peer?"**

```http
GET /trqp/v1/recognition
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `authority_id` | Yes | DID of the querying authority |
| `recognized_authority_id` | Yes | DID of the authority being checked |
| `scope` | No | Scope of recognition (e.g., credential types) |

**Example Request:**
```http
GET /trqp/v1/recognition?authority_id=did:cid:bagaaiera...archon.social&recognized_authority_id=did:web:riaa.com
```

**Response (recognized):**
```json
{
  "recognized": true,
  "authority_id": "did:cid:bagaaiera...archon.social",
  "recognized_authority_id": "did:web:riaa.com",
  "recognition_type": "bilateral",
  "scope": ["MusicRightsCredential", "ArtistVerification"]
}
```

**Response (not recognized):**
```json
{
  "recognized": false,
  "error": "Authority not in recognized list"
}
```

### 3. Registry Metadata

**Discover what this registry governs**

```http
GET /trqp/v1/metadata
```

**Response:**
```json
{
  "registry_id": "did:cid:bagaaiera...archon.social",
  "name": "Archon Social Trust Registry",
  "description": "Trust registry for archon.social naming service",
  "governance_framework": "https://archon.social/governance",
  "supported_actions": ["issue", "verify", "hold", "present"],
  "supported_resources": [
    {
      "schema_id": "did:cid:bagaaiera...MembershipCredential",
      "name": "DTG Membership Credential",
      "description": "Proves membership in archon.social"
    }
  ],
  "recognized_authorities": [
    "did:web:archon.technology",
    "did:cid:bagaaiera...another-registry"
  ],
  "trqp_version": "2.0",
  "endpoints": {
    "authorization": "/trqp/v1/authorization",
    "recognition": "/trqp/v1/recognition"
  }
}
```

## Authorization Logic

### How Authorization is Determined

```
Authorization Check Flow:
───────────────────────────────────────────────────────────
1. Is entity_id a member of authority's admin group?
   └─ YES → authorized for all actions
   
2. Is entity_id a member of authority's issuer group?
   └─ YES → authorized for "issue" action
   
3. Does entity_id hold a credential from authority 
   granting the specific action + resource?
   └─ YES → authorized for that action/resource
   
4. Otherwise → NOT authorized
───────────────────────────────────────────────────────────
```

### Group → Action Mapping (Configurable)

| Group Role | Authorized Actions |
|------------|-------------------|
| `owner` | `*` (all) |
| `admin` | `issue`, `revoke`, `verify` |
| `issuer` | `issue` (specific schemas) |
| `member` | `hold`, `present` |

## Implementation Phases

### Phase 1: Core TRQP Server ← Start Here
- [ ] `/trqp/v1/authorization` endpoint
- [ ] `/trqp/v1/metadata` endpoint  
- [ ] Group membership → authorization check
- [ ] Connect to Gatekeeper API

### Phase 2: Recognition & Federation
- [ ] `/trqp/v1/recognition` endpoint
- [ ] Cross-registry trust credentials
- [ ] did:web authority bridging (RIAA, etc.)

### Phase 3: Production Hardening
- [ ] Error handling per RFC 7807 (Problem Details)
- [ ] Rate limiting (open but not abusable)
- [ ] Health check endpoint
- [ ] OpenAPI/Swagger docs

## Configuration

```env
# Trust Registry Configuration
REGISTRY_DID=did:cid:bagaaiera...archon.social
REGISTRY_NAME=Archon Social Trust Registry
GATEKEEPER_URL=https://archon.technology
REGISTRY_WALLET_PATH=./wallet.json
REGISTRY_PASSPHRASE=your-secure-passphrase

# Resource Format: "did" (full DID) or "name" (short name) or "both"
# - "did": resource=did:cid:bagaaiera...MembershipCredential
# - "name": resource=MembershipCredential  
# - "both": accepts either in queries, responses use "name"
RESOURCE_FORMAT=both

# Group → Role Mapping
ADMIN_GROUP_DID=did:cid:bagaaiera...admin-group
ISSUER_GROUP_DID=did:cid:bagaaiera...issuer-group
MEMBER_GROUP_DID=did:cid:bagaaiera...member-group

# Server
PORT=4260
```

## Example: archon.social as Trust Registry

```
Authority: did:cid:archon.social
│
├── Admin Group (can do everything)
│   └── @flaxscrip, @cypher
│
├── Issuer Group (can issue membership credentials)  
│   └── @genitrix (AI agent)
│
└── Member Group (can hold/present credentials)
    └── All registered @handles
```

Query: "Can @genitrix issue MembershipCredentials?"
```http
GET /trqp/v1/authorization?authority_id=did:cid:...archon.social&entity_id=did:cid:...genitrix&action=issue&resource=MembershipCredential

→ { "authorized": true, "statement": { "group": "IssuerGroup" } }
```

## Design Decisions

1. **Caching**: ❌ No caching — freshness preferred. Every query hits live data.
2. **Privacy**: 🌐 Open trust registry — no auth required for queries. Trust is public.
3. **Delegation**: 1 level max. A → B is supported. A → B → C is not (keeps verification simple).
4. **Actions**: `issue`, `verify`, `hold`, `present`, `revoke` — generic set for any trust registry.
5. **Resource format**: Configurable — accept full DID, short name, or both.
6. **Error format**: Simple `{ "error": "message" }` — no RFC 7807 complexity.

### Delegation Pattern (Single Level)

```
Authority (archon.social)
    │
    └── delegates to ──▶ Issuer (genitrix)
                              │
                              └── can issue ──▶ MembershipCredential
                              
✅ Verifier asks: "Can genitrix issue?"
   Registry checks: "Is genitrix in Issuer group?" → YES

❌ NOT supported:
   Authority → Delegate A → Delegate B → issues credential
   (Too complex to verify, audit nightmare)
```

## References

- [ToIP TRQP Specification v2.0](https://trustoverip.github.io/tswg-trust-registry-protocol/)
- [ToIP Trust Registry Task Force](https://wiki.trustoverip.org/display/HOME/Trust+Registry+Task+Force)
- [Archon Protocol](https://archon.technology)
- [archon.social Roles Implementation](https://github.com/archetech/archon-social)

---

**Status:** Draft Proposal  
**Authors:** Christian Saucier, GenitriX-AI  
**Date:** 2026-03-16
