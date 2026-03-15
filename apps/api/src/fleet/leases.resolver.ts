import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { VehicleLease } from './entities/vehicle-lease.entity';
import { CreateVehicleLeaseInput } from './dto/create-vehicle-lease.input';
import { UpdateVehicleLeaseInput } from './dto/update-vehicle-lease.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';

@Resolver(() => VehicleLease)
export class LeasesResolver {
  constructor(private readonly leasesService: LeasesService) {}

  @Query(() => [VehicleLease], { name: 'vehicleLeases' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'read')
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleLease[]> {
    return this.leasesService.findByVehicle(vehicleId);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async createVehicleLease(
    @Args('createVehicleLeaseInput') input: CreateVehicleLeaseInput,
  ): Promise<VehicleLease> {
    return this.leasesService.create(input);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async updateVehicleLease(
    @Args('updateVehicleLeaseInput') input: UpdateVehicleLeaseInput,
  ): Promise<VehicleLease> {
    return this.leasesService.update(input);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async deleteVehicleLease(@Args('id') id: string): Promise<VehicleLease> {
    return this.leasesService.remove(id);
  }
}
