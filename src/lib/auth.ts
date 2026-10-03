// src/lib/auth.ts - JWT authentication utilities
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
);

// User role types
export type UserRole = 'OWNER' | 'ASSISTANT' | 'DRIVER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Create a signed JWT token for a user
 */
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Check if user is the owner
 */
export function isOwner(user: AuthUser | null): boolean {
  return hasRole(user, ['OWNER']);
}

/**
 * Check if user can perform owner-only actions:
 * - Approve payments
 * - Submit official filings
 * - Accept loads
 * - Change company info
 * - Delete approved records
 */
export function canApprove(user: AuthUser | null): boolean {
  return isOwner(user);
}

/**
 * Check if user can create/edit records
 */
export function canEdit(user: AuthUser | null): boolean {
  return hasRole(user, ['OWNER', 'ASSISTANT']);
}

/**
 * Check if user can view records
 */
export function canView(user: AuthUser | null): boolean {
  return hasRole(user, ['OWNER', 'ASSISTANT', 'DRIVER']);
}

// Permission matrix for reference:
// Action                    | OWNER | ASSISTANT | DRIVER
// --------------------------|-------|-----------|-------
// View dashboard            |  ✓    |     ✓     |   -
// Add/edit loads            |  ✓    |     ✓     |   -
// Accept loads              |  ✓    |     -     |   -
// Add/edit documents        |  ✓    |     ✓     |   ✓ (own)
// Add/edit settlements      |  ✓    |     ✓     |   -
// Approve settlements       |  ✓    |     -     |   -
// Mark as paid              |  ✓    |     -     |   -
// Add/edit expenses         |  ✓    |     ✓     |   -
// Add/edit compliance       |  ✓    |     ✓     |   -
// Submit filings            |  ✓    |     -     |   -
// Change company info       |  ✓    |     -     |   -
// Manage users              |  ✓    |     -     |   -
// Export reports            |  ✓    |     ✓     |   -
// View audit log            |  ✓    |     -     |   -
// Delete approved records   |  ✓    |     -     |   -
