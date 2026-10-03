// src/app/api/auth/login/route.ts - Login API endpoint
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

function ensureTablesAndUsers() {
  try {
    const prismaBin = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
    if (fs.existsSync(prismaBin)) {
      execSync(`node "${prismaBin}" db push --skip-generate --accept-data-loss`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: process.env,
      });
    } else {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        encoding: 'utf-8',
        timeout: 30000,
        env: process.env,
      });
    }
  } catch (e) {
    console.error('Auto db push error:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (dbErr: any) {
      console.warn('Initial user lookup failed, attempting schema push:', dbErr?.message);
      ensureTablesAndUsers();
      // Retry lookup
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    }

    // If user is still not found, check if database is empty and seed if attempting demo login
    if (!user) {
      const userCount = await prisma.user.count().catch(() => 0);
      if (userCount === 0) {
        console.log('Seeding initial owner and assistant accounts...');
        const ownerPassword = await bcrypt.hash('owner123', 10);
        const assistantPassword = await bcrypt.hash('assistant123', 10);

        await prisma.user.create({
          data: {
            email: 'sam@truckflow.com',
            passwordHash: ownerPassword,
            name: 'Sam',
            role: 'OWNER',
            phone: '555-0100',
          },
        });

        await prisma.user.create({
          data: {
            email: 'dh@truckflow.com',
            passwordHash: assistantPassword,
            name: 'DH',
            role: 'ASSISTANT',
            phone: '555-0200',
          },
        });

        user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'OWNER' | 'ASSISTANT' | 'DRIVER',
    });

    // Audit log (fail-safe)
    try {
      await createAuditLog({
        user: { id: user.id, email: user.email, name: user.name, role: user.role as 'OWNER' | 'ASSISTANT' | 'DRIVER' },
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        description: `${user.name} logged in`,
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    // Set cookie and return user info
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
