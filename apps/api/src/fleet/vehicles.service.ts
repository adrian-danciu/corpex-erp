import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { toPaginatedResult } from '../common/pagination';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        OR: [
          { plateNumber: input.plateNumber },
          { chassisNumber: input.chassisNumber },
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'A vehicle with this plate number or chassis number already exists',
      );
    }

    return this.prisma.vehicle.create({ data: input });
  }

  async findAll(pagination: PaginationInput): Promise<IPaginatedType<Vehicle>> {
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count(),
    ]);

    return toPaginatedResult(items, total, pagination);
  }

  async findOne(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { expiryDate: 'asc' } },
        mileageLogs: { orderBy: { date: 'desc' } },
        leases: { orderBy: { startDate: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
      },
    });
  }

  async update(input: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.id },
    });
    if (!vehicle)
      throw new NotFoundException(`Vehicle with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicle.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle)
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
