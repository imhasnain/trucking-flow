import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const schemaSql = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ASSISTANT',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cdlNumber" TEXT NOT NULL,
    "cdlExpiry" DATETIME NOT NULL,
    "medicalCardExp" DATETIME NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "payRate" REAL NOT NULL DEFAULT 0.30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitNumber" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "plateNumber" TEXT,
    "plateState" TEXT,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TRUCK',
    "insuranceExpiry" DATETIME,
    "registrationExp" DATETIME,
    "currentMileage" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_unitNumber_key" ON "Vehicle"("unitNumber");

CREATE TABLE IF NOT EXISTS "Load" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loadNumber" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "brokerContact" TEXT,
    "brokerPhone" TEXT,
    "brokerEmail" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "pickupCity" TEXT,
    "pickupState" TEXT,
    "deliveryLocation" TEXT NOT NULL,
    "deliveryCity" TEXT,
    "deliveryState" TEXT,
    "pickupDate" DATETIME NOT NULL,
    "deliveryDate" DATETIME,
    "deliveredAt" DATETIME,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "grossRate" REAL NOT NULL,
    "ratePerMile" REAL,
    "loadedMiles" INTEGER,
    "deadheadMiles" INTEGER,
    "accessorials" REAL NOT NULL DEFAULT 0,
    "lumperFee" REAL NOT NULL DEFAULT 0,
    "fuelCost" REAL NOT NULL DEFAULT 0,
    "tolls" REAL NOT NULL DEFAULT 0,
    "otherCosts" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Load_loadNumber_key" ON "Load"("loadNumber");

CREATE TABLE IF NOT EXISTS "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "grossPay" REAL NOT NULL,
    "driverRate" REAL NOT NULL,
    "driverShare" REAL NOT NULL,
    "advances" REAL NOT NULL DEFAULT 0,
    "reimbursements" REAL NOT NULL DEFAULT 0,
    "deductions" REAL NOT NULL DEFAULT 0,
    "balanceOwed" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "weekStart" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Settlement_loadId_key" ON "Settlement"("loadId");

CREATE TABLE IF NOT EXISTS "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loadId" TEXT NOT NULL,
    "dispatcherName" TEXT NOT NULL DEFAULT 'Michael',
    "commissionRate" REAL NOT NULL DEFAULT 0.10,
    "grossRate" REAL NOT NULL,
    "amountDue" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Commission_loadId_key" ON "Commission"("loadId");

CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "loadId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "complianceId" TEXT,
    "expenseId" TEXT,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "amountReceived" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "dateReceived" DATETIME,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "factoringCompany" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_loadId_key" ON "Invoice"("loadId");

CREATE TABLE IF NOT EXISTS "ComplianceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "reminderDays" TEXT NOT NULL DEFAULT '30,15,7,1',
    "notes" TEXT,
    "externalUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "vendor" TEXT,
    "reference" TEXT,
    "loadId" TEXT,
    "vehicleId" TEXT,
    "isOverhead" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ResearchNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "externalUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "changes" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export async function initDatabase() {
  console.log('Running initDatabase...');
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e: any) {
      console.warn('SQL exec notice:', e?.message);
    }
  }

  // Seed default users if none exist
  const count = await prisma.user.count().catch(() => 0);
  if (count === 0) {
    console.log('Seeding initial owner & assistant...');
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const assistantPassword = await bcrypt.hash('assistant123', 10);

    const sam = await prisma.user.create({
      data: {
        email: 'sam@truckflow.com',
        passwordHash: ownerPassword,
        name: 'Sam',
        role: 'OWNER',
        phone: '555-0100',
      },
    });

    const dh = await prisma.user.create({
      data: {
        email: 'dh@truckflow.com',
        passwordHash: assistantPassword,
        name: 'DH',
        role: 'ASSISTANT',
        phone: '555-0200',
      },
    });

    // Seed drivers
    const khadir = await prisma.driver.create({
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

    const driver2 = await prisma.driver.create({
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

    // Seed vehicles
    const truck1 = await prisma.vehicle.create({
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

    const truck2 = await prisma.vehicle.create({
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

    // Seed a couple of demo loads so dashboard isn't completely empty
    const now = new Date();
    const l1 = await prisma.load.create({
      data: {
        loadNumber: 'LD-2026-0001',
        broker: 'ABC Logistics',
        pickupLocation: '1234 Industrial Blvd, Dallas, TX',
        pickupCity: 'Dallas',
        pickupState: 'TX',
        deliveryLocation: '5678 Commerce Dr, Atlanta, GA',
        deliveryCity: 'Atlanta',
        deliveryState: 'GA',
        pickupDate: new Date(now.getTime() - 7 * 86400000),
        deliveryDate: new Date(now.getTime() - 5 * 86400000),
        driverId: khadir.id,
        vehicleId: truck1.id,
        grossRate: 3500,
        loadedMiles: 780,
        deadheadMiles: 45,
        fuelCost: 420,
        status: 'DELIVERED',
      },
    });

    // Create settlement and commission for l1
    await prisma.settlement.create({
      data: {
        loadId: l1.id,
        driverId: khadir.id,
        grossPay: 3500,
        driverRate: 0.30,
        driverShare: 1050,
        balanceOwed: 1050,
        paymentStatus: 'PENDING',
      },
    });

    await prisma.commission.create({
      data: {
        loadId: l1.id,
        dispatcherName: 'Michael',
        commissionRate: 0.10,
        grossRate: 3500,
        amountDue: 350,
        paymentStatus: 'PENDING',
      },
    });

    console.log('✅ Default data successfully created!');
  }
}
