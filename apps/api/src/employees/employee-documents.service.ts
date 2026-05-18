import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeDocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeDocument } from './entities/employee-document.entity';
import {
  CreateEmployeeDocumentInput,
  EmployeeDocumentFilterInput,
} from './dto/employee-document.inputs';

@Injectable()
export class EmployeeDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: EmployeeDocumentFilterInput): Promise<EmployeeDocument[]> {
    return this.prisma.employeeDocument.findMany({
      where: {
        employeeId: filter?.employeeId,
        type: filter?.type,
      },
      include: {
        employee: { include: { user: true } },
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    input: CreateEmployeeDocumentInput,
    uploadedById: string,
  ): Promise<EmployeeDocument> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${input.employeeId} not found`);
    }

    return this.prisma.employeeDocument.create({
      data: {
        employeeId: input.employeeId,
        type: input.type as EmployeeDocumentType,
        title: input.title.trim(),
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        mimeType: input.mimeType,
        size: input.size,
        expiryDate: input.expiryDate ?? null,
        notes: input.notes?.trim() || null,
        uploadedById,
      },
      include: {
        employee: { include: { user: true } },
        uploadedBy: true,
      },
    });
  }

  async remove(id: string): Promise<EmployeeDocument> {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        uploadedBy: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Employee document ${id} not found`);
    }

    await this.prisma.employeeDocument.delete({ where: { id } });
    return document;
  }
}
