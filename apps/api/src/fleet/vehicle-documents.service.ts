import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDocumentInput } from './dto/create-vehicle-document.input';
import { UpdateVehicleDocumentInput } from './dto/update-vehicle-document.input';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { ExpiringDocumentSummary } from './entities/expiring-document-summary.type';
import { DocumentType } from '@prisma/client';

@Injectable()
export class VehicleDocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleDocumentInput): Promise<VehicleDocument> {
    return this.prisma.vehicleDocument.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleDocument[]> {
    return this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async update(input: UpdateVehicleDocumentInput): Promise<VehicleDocument> {
    const doc = await this.prisma.vehicleDocument.findUnique({
      where: { id: input.id },
    });
    if (!doc)
      throw new NotFoundException(`Document with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: cleanData,
    });
  }

  async remove(id: string): Promise<VehicleDocument> {
    const doc = await this.prisma.vehicleDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document with ID ${id} not found`);
    return this.prisma.vehicleDocument.delete({ where: { id } });
  }

  async findExpiring(daysAhead: number): Promise<ExpiringDocumentSummary[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const documents = await this.prisma.vehicleDocument.findMany({
      where: { expiryDate: { gte: now, lte: future } },
      select: { type: true },
    });

    const counts = new Map<DocumentType, number>();
    for (const doc of documents) {
      counts.set(doc.type, (counts.get(doc.type) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }
}
