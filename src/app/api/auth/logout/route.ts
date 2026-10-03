// src/app/api/auth/logout/route.ts - Logout API endpoint
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      await createAuditLog({
        user,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: user.id,
        description: `${user.name} logged out`,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    return response;
  }
}
