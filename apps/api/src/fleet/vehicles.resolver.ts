import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { PaginatedVehicle } from './dto/paginated-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { PaginationInput } from '../common/dto/pagination.input';

@Resolver(() => Vehicle)
export class VehiclesResolver {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Query(() => PaginatedVehicle, { name: 'vehicles' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'read')
  async findAll(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedVehicle> {
    return this.vehiclesService.findAll(pagination ?? { skip: 0, take: 10 });
  }

  @Query(() => Vehicle, { name: 'vehicle', nullable: true })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'read')
  async findOne(@Args('id') id: string): Promise<Vehicle | null> {
    return this.vehiclesService.findOne(id);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async createVehicle(
    @Args('createVehicleInput') input: CreateVehicleInput,
  ): Promise<Vehicle> {
    return this.vehiclesService.create(input);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async updateVehicle(
    @Args('updateVehicleInput') input: UpdateVehicleInput,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(input);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async deleteVehicle(@Args('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.remove(id);
  }
}
