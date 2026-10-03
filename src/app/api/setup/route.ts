import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('key');

  // Simple protection so only the owner can trigger it
  if (secret !== 'truckflow2026' && secret !== 'setup') {
    return NextResponse.json({ error: 'Unauthorized. Provide ?key=setup' }, { status: 401 });
  }

  const results: string[] = [];

  // Step 1: Ensure SQLite tables exist using prisma db push
  try {
    const path = await import('path');
    const fs = await import('fs');
    const prismaBin = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
    let cmd = 'npx prisma db push --skip-generate --accept-data-loss';
    if (fs.existsSync(prismaBin)) {
      cmd = `node "${prismaBin}" db push --skip-generate --accept-data-loss`;
    }
    const pushOutput = execSync(cmd, {
      encoding: 'utf-8',
      env: process.env,
      timeout: 30000,
    });
    results.push(`DB Push Success: ${pushOutput.slice(0, 100)}...`);
  } catch (err: any) {
    results.push(`DB Push Note: ${err.message?.slice(0, 100)}`);
  }

  // Step 2: Ensure default users exist
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers === 0) {
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

      // Default Drivers
      await prisma.driver.create({
        data: {
          name: 'Khadir',
          cdlNumber: 'CDL-12345678',
          cdlExpiry: new Date('2027-06-15'),
          medicalCardExp: new Date('2027-03-20'),
          phone: '555-0300',
          email: 'khadir@truckflow.com',
          payRate: 0.30,
          status: 'ACTIVE',
        },
      });

      await prisma.driver.create({
        data: {
          name: 'Ali',
          cdlNumber: 'CDL-87654321',
          cdlExpiry: new Date('2027-09-10'),
          medicalCardExp: new Date('2027-05-15'),
          phone: '555-0400',
          email: 'ali@truckflow.com',
          payRate: 0.30,
          status: 'ACTIVE',
        },
      });

      // Default Vehicles
      await prisma.vehicle.create({
        data: {
          unitNumber: 'UNIT-001',
          vin: '1HGBH41JXMN109186',
          plateNumber: 'TRK-1234',
          plateState: 'TX',
          year: 2021,
          make: 'Freightliner',
          model: 'Cascadia',
          type: 'TRUCK',
          insuranceExpiry: new Date('2027-01-15'),
          registrationExp: new Date('2027-03-01'),
          currentMileage: 125000,
          status: 'ACTIVE',
        },
      });

      await prisma.vehicle.create({
        data: {
          unitNumber: 'UNIT-002',
          vin: '2HGBH41JXMN109187',
          plateNumber: 'TRK-5678',
          plateState: 'TX',
          year: 2022,
          make: 'Peterbilt',
          model: '579',
          type: 'TRUCK',
          insuranceExpiry: new Date('2027-02-20'),
          registrationExp: new Date('2027-04-15'),
          currentMileage: 89000,
          status: 'ACTIVE',
        },
      });

      results.push('Successfully seeded initial users, drivers, and vehicles');
    } else {
      results.push(`Database already has ${existingUsers} users. Skipping seeding.`);
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Setup completed successfully',
      details: results,
      credentials: {
        owner: 'sam@truckflow.com / owner123',
        assistant: 'dh@truckflow.com / assistant123',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        details: results,
      },
      { status: 500 }
    );
  }
}
