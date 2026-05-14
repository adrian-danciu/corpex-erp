import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleLeaseInput } from './dto/create-vehicle-lease.input';
import { UpdateVehicleLeaseInput } from './dto/update-vehicle-lease.input';
import { VehicleLease } from './entities/vehicle-lease.entity';

@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleLeaseInput): Promise<VehicleLease> {
    return this.prisma.vehicleLease.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleLease[]> {
    return this.prisma.vehicleLease.findMany({
      where: { vehicleId },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(input: UpdateVehicleLeaseInput): Promise<VehicleLease> {
    const lease = await this.prisma.vehicleLease.findUnique({
      where: { id: input.id },
    });
    if (!lease)
      throw new NotFoundException(`Lease with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicleLease.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<VehicleLease> {
    const lease = await this.prisma.vehicleLease.findUnique({ where: { id } });
    if (!lease) throw new NotFoundException(`Lease with ID ${id} not found`);
    return this.prisma.vehicleLease.delete({ where: { id } });
  }
}
