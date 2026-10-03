import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'OTHER';
    const loadId = (formData.get('loadId') as string) || null;
    const driverId = (formData.get('driverId') as string) || null;
    const vehicleId = (formData.get('vehicleId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const folder = loadId || 'general';
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filePathOnDisk = path.join(uploadDir, filename);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePathOnDisk, buffer);

    const relativePath = `/uploads/${folder}/${filename}`;

    // If a document record for this load and type is currently MISSING, update it
    let document;
    if (loadId) {
      const existingMissing = await prisma.document.findFirst({
        where: { loadId, type, status: 'MISSING' }
      });
      if (existingMissing) {
        document = await prisma.document.update({
          where: { id: existingMissing.id },
          data: {
            name: file.name,
            filePath: relativePath,
            fileSize: file.size,
            mimeType: file.type,
            status: 'UPLOADED',
            uploadedBy: user.name
          }
        });
      }
    }

    if (!document) {
      document = await prisma.document.create({
        data: {
          name: file.name,
          type,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.type,
          status: 'UPLOADED',
          loadId,
          driverId,
          vehicleId,
          uploadedBy: user.name
        }
      });
    }

    await createAuditLog({
      user,
      action: 'CREATE',
      entityType: 'Document',
      entityId: document.id,
      description: `Uploaded document: ${file.name} (${type})`
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
