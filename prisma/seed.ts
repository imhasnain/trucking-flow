// prisma/seed.ts - Seed data for testing
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========================================
  // USERS
  // ========================================
  const ownerPassword = await bcryptjs.hash('owner123', 10);
  const assistantPassword = await bcryptjs.hash('assistant123', 10);

  const sam = await prisma.user.upsert({
    where: { email: 'sam@truckflow.com' },
    update: {},
    create: {
      email: 'sam@truckflow.com',
      passwordHash: ownerPassword,
      name: 'Sam',
      role: 'OWNER',
      phone: '555-0100',
    },
  });

  const dh = await prisma.user.upsert({
    where: { email: 'dh@truckflow.com' },
    update: {},
    create: {
      email: 'dh@truckflow.com',
      passwordHash: assistantPassword,
      name: 'DH',
      role: 'ASSISTANT',
      phone: '555-0200',
    },
  });

  console.log('✅ Users created');

  // ========================================
  // DRIVERS
  // ========================================
  const khadir = await prisma.driver.create({
    data: {
      name: 'Khadir',
      cdlNumber: 'CDL-12345678',
      cdlExpiry: new Date('2027-06-15'),
      medicalCardExp: new Date('2027-03-20'),
      phone: '555-0300',
      email: 'khadir@truckflow.com',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '555-0301',
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

  console.log('✅ Drivers created');

  // ========================================
  // VEHICLES
  // ========================================
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

  console.log('✅ Vehicles created');

  // ========================================
  // LOADS (with various statuses for testing)
  // ========================================
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const loads = [
    {
      loadNumber: 'LD-2026-0001',
      broker: 'ABC Logistics',
      pickupLocation: '1234 Industrial Blvd, Dallas, TX',
      pickupCity: 'Dallas',
      pickupState: 'TX',
      deliveryLocation: '5678 Commerce Dr, Atlanta, GA',
      deliveryCity: 'Atlanta',
      deliveryState: 'GA',
      pickupDate: monthAgo,
      deliveryDate: new Date(monthAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(monthAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      driverId: khadir.id,
      vehicleId: truck1.id,
      grossRate: 3500,
      loadedMiles: 780,
      deadheadMiles: 45,
      accessorials: 0,
      lumperFee: 0,
      fuelCost: 420,
      tolls: 35,
      status: 'PAID',
    },
    {
      loadNumber: 'LD-2026-0002',
      broker: 'FastFreight Inc',
      pickupLocation: '9101 Warehouse Rd, Houston, TX',
      pickupCity: 'Houston',
      pickupState: 'TX',
      deliveryLocation: '2345 Distribution Way, Memphis, TN',
      deliveryCity: 'Memphis',
      deliveryState: 'TN',
      pickupDate: twoWeeksAgo,
      deliveryDate: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      driverId: driver2.id,
      vehicleId: truck2.id,
      grossRate: 2800,
      loadedMiles: 560,
      deadheadMiles: 30,
      accessorials: 150,
      lumperFee: 75,
      fuelCost: 340,
      tolls: 20,
      status: 'INVOICED',
    },
    {
      loadNumber: 'LD-2026-0003',
      broker: 'National Transport Co',
      pickupLocation: '6789 Cargo Lane, Chicago, IL',
      pickupCity: 'Chicago',
      pickupState: 'IL',
      deliveryLocation: '3456 Freight St, Nashville, TN',
      deliveryCity: 'Nashville',
      deliveryState: 'TN',
      pickupDate: weekAgo,
      deliveryDate: new Date(weekAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(weekAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      driverId: khadir.id,
      vehicleId: truck1.id,
      grossRate: 2200,
      loadedMiles: 440,
      deadheadMiles: 55,
      fuelCost: 280,
      tolls: 15,
      status: 'DELIVERED',
    },
    {
      loadNumber: 'LD-2026-0004',
      broker: 'ABC Logistics',
      pickupLocation: '1111 Pickup Rd, San Antonio, TX',
      pickupCity: 'San Antonio',
      pickupState: 'TX',
      deliveryLocation: '2222 Delivery Ave, Jacksonville, FL',
      deliveryCity: 'Jacksonville',
      deliveryState: 'FL',
      pickupDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      driverId: driver2.id,
      vehicleId: truck2.id,
      grossRate: 4200,
      loadedMiles: 1050,
      deadheadMiles: 80,
      fuelCost: 0,
      tolls: 0,
      status: 'BOOKED',
    },
    {
      loadNumber: 'LD-2026-0005',
      broker: 'QuickShip Brokers',
      pickupLocation: '3333 Logistics Park, Phoenix, AZ',
      pickupCity: 'Phoenix',
      pickupState: 'AZ',
      deliveryLocation: '4444 Terminal Dr, Los Angeles, CA',
      deliveryCity: 'Los Angeles',
      deliveryState: 'CA',
      pickupDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000),
      driverId: khadir.id,
      vehicleId: truck1.id,
      grossRate: 1800,
      loadedMiles: 370,
      deadheadMiles: 20,
      fuelCost: 220,
      tolls: 10,
      status: 'IN_TRANSIT',
    },
  ];

  const createdLoads = [];
  for (const load of loads) {
    const created = await prisma.load.create({ data: load });
    createdLoads.push(created);
  }

  console.log('✅ Loads created');

  // ========================================
  // SETTLEMENTS
  // ========================================
  // Load 1 - Paid
  await prisma.settlement.create({
    data: {
      loadId: createdLoads[0].id,
      driverId: khadir.id,
      grossPay: 3500,
      driverRate: 0.30,
      driverShare: 1050,
      advances: 0,
      reimbursements: 0,
      deductions: 0,
      balanceOwed: 1050,
      paymentStatus: 'PAID',
      paymentDate: new Date(monthAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
      approvedBy: sam.id,
      approvedAt: new Date(monthAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Load 2 - Pending
  await prisma.settlement.create({
    data: {
      loadId: createdLoads[1].id,
      driverId: driver2.id,
      grossPay: 2800,
      driverRate: 0.30,
      driverShare: 840,
      advances: 100,
      reimbursements: 50,
      deductions: 0,
      balanceOwed: 790,
      paymentStatus: 'PENDING',
    },
  });

  // Load 3 - Pending
  await prisma.settlement.create({
    data: {
      loadId: createdLoads[2].id,
      driverId: khadir.id,
      grossPay: 2200,
      driverRate: 0.30,
      driverShare: 660,
      advances: 0,
      reimbursements: 0,
      deductions: 0,
      balanceOwed: 660,
      paymentStatus: 'PENDING',
    },
  });

  console.log('✅ Settlements created');

  // ========================================
  // COMMISSIONS
  // ========================================
  for (const load of createdLoads) {
    await prisma.commission.create({
      data: {
        loadId: load.id,
        dispatcherName: 'Michael',
        commissionRate: 0.10,
        grossRate: load.grossRate,
        amountDue: load.grossRate * 0.10,
        paymentStatus: load.status === 'PAID' ? 'PAID' : 'PENDING',
        paymentDate: load.status === 'PAID' ? new Date(monthAgo.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
      },
    });
  }

  console.log('✅ Commissions created');

  // ========================================
  // INVOICES
  // ========================================
  // Load 1 - Paid invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      loadId: createdLoads[0].id,
      broker: 'ABC Logistics',
      invoiceDate: new Date(monthAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(monthAgo.getTime() + 33 * 24 * 60 * 60 * 1000),
      amount: 3500,
      amountReceived: 3500,
      paymentStatus: 'PAID',
      dateReceived: new Date(monthAgo.getTime() + 25 * 24 * 60 * 60 * 1000),
    },
  });

  // Load 2 - Unpaid invoice (overdue)
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      loadId: createdLoads[1].id,
      broker: 'FastFreight Inc',
      invoiceDate: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(twoWeeksAgo.getTime() - 5 * 24 * 60 * 60 * 1000),
      amount: 2950,
      paymentStatus: 'OVERDUE',
      daysOverdue: 19,
    },
  });

  console.log('✅ Invoices created');

  // ========================================
  // COMPLIANCE ITEMS
  // ========================================
  const complianceItems = [
    {
      title: 'MCS-150 Biennial Update',
      type: 'MCS150',
      description: 'File biennial update with FMCSA',
      dueDate: new Date('2027-01-15'),
      status: 'UPCOMING',
      priority: 'HIGH',
    },
    {
      title: 'Commercial Auto Insurance Renewal',
      type: 'INSURANCE',
      description: 'Renew commercial auto insurance policy',
      dueDate: new Date('2027-01-15'),
      status: 'UPCOMING',
      priority: 'CRITICAL',
    },
    {
      title: 'Khadir CDL Renewal',
      type: 'CDL_EXPIRY',
      description: 'CDL expires - needs renewal',
      dueDate: new Date('2027-06-15'),
      status: 'UPCOMING',
      priority: 'HIGH',
      driverId: khadir.id,
    },
    {
      title: 'Khadir Medical Card',
      type: 'MEDICAL_CARD',
      description: 'Medical card examination due',
      dueDate: new Date('2027-03-20'),
      status: 'UPCOMING',
      priority: 'HIGH',
      driverId: khadir.id,
    },
    {
      title: 'Drug & Alcohol Testing - Random',
      type: 'DRUG_TESTING',
      description: 'Random drug & alcohol testing due this quarter',
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'DUE_SOON',
      priority: 'HIGH',
    },
    {
      title: 'IFTA Quarterly Filing',
      type: 'IFTA',
      description: 'File IFTA quarterly fuel tax return',
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      status: 'DUE_SOON',
      priority: 'MEDIUM',
    },
    {
      title: 'HVUT Form 2290',
      type: 'HVUT',
      description: 'Annual Heavy Vehicle Use Tax filing',
      dueDate: new Date('2027-08-31'),
      status: 'UPCOMING',
      priority: 'MEDIUM',
    },
    {
      title: 'Unit 001 Registration Renewal',
      type: 'VEHICLE_REGISTRATION',
      description: 'Vehicle registration renewal for UNIT-001',
      dueDate: new Date('2027-03-01'),
      status: 'UPCOMING',
      priority: 'MEDIUM',
      vehicleId: truck1.id,
    },
  ];

  for (const item of complianceItems) {
    await prisma.complianceItem.create({
      data: {
        ...item,
        driverId: item.driverId || undefined,
        vehicleId: item.vehicleId || undefined,
      },
    });
  }

  console.log('✅ Compliance items created');

  // ========================================
  // EXPENSES
  // ========================================
  const expenses = [
    {
      description: 'Fuel - Dallas to Atlanta run',
      category: 'FUEL',
      amount: 420,
      date: monthAgo,
      vendor: 'Loves Travel Stop',
      loadId: createdLoads[0].id,
      vehicleId: truck1.id,
    },
    {
      description: 'Fuel - Houston to Memphis run',
      category: 'FUEL',
      amount: 340,
      date: twoWeeksAgo,
      vendor: 'Pilot Flying J',
      loadId: createdLoads[1].id,
      vehicleId: truck2.id,
    },
    {
      description: 'Monthly insurance premium',
      category: 'INSURANCE',
      amount: 1800,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      vendor: 'Progressive Commercial',
      isOverhead: true,
    },
    {
      description: 'Oil change - Unit 001',
      category: 'MAINTENANCE',
      amount: 350,
      date: weekAgo,
      vendor: 'FleetPride',
      vehicleId: truck1.id,
    },
    {
      description: 'ELD monthly subscription',
      category: 'OVERHEAD',
      amount: 45,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      vendor: 'KeepTruckin',
      isOverhead: true,
    },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        ...expense,
        loadId: expense.loadId || undefined,
        vehicleId: expense.vehicleId || undefined,
      },
    });
  }

  console.log('✅ Expenses created');

  // ========================================
  // RESEARCH NOTES
  // ========================================
  await prisma.researchNote.create({
    data: {
      title: 'FMCSA Household Goods Authority Correction',
      category: 'FMCSA_DOT',
      content: 'Need to correct household goods authority status with FMCSA. Filed support ticket #12345.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      externalUrl: 'https://portal.fmcsa.dot.gov',
    },
  });

  await prisma.researchNote.create({
    data: {
      title: 'Box Truck Research - 26ft Options',
      category: 'BOX_TRUCK',
      content: 'Researching 26ft box trucks for local delivery routes. Comparing Hino, Isuzu, and Ford options.',
      status: 'OPEN',
      priority: 'LOW',
    },
  });

  console.log('✅ Research notes created');

  // ========================================
  // NOTIFICATIONS
  // ========================================
  await prisma.notification.create({
    data: {
      userId: sam.id,
      type: 'INVOICE',
      title: 'Invoice Overdue',
      message: 'Invoice INV-2026-0002 from FastFreight Inc is 19 days overdue ($2,950)',
      link: '/receivables',
    },
  });

  await prisma.notification.create({
    data: {
      userId: sam.id,
      type: 'COMPLIANCE',
      title: 'IFTA Filing Due Soon',
      message: 'IFTA quarterly filing is due in 15 days',
      link: '/compliance',
    },
  });

  await prisma.notification.create({
    data: {
      userId: sam.id,
      type: 'SETTLEMENT',
      title: 'Settlements Pending Approval',
      message: '2 driver settlements are pending your approval',
      link: '/settlements',
    },
  });

  console.log('✅ Notifications created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Owner:     sam@truckflow.com / owner123');
  console.log('  Assistant: dh@truckflow.com / assistant123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
