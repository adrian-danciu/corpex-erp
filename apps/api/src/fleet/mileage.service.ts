import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMileageLogInput } from './dto/create-mileage-log.input';
import { MileageLog } from './entities/mileage-log.entity';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateMileageLogInput): Promise<MileageLog> {
    return this.prisma.mileageLog.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<MileageLog[]> {
    return this.prisma.mileageLog.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string): Promise<MileageLog> {
    const log = await this.prisma.mileageLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException(`Mileage log with ID ${id} not found`);
    return this.prisma.mileageLog.delete({ where: { id } });
  }
}
