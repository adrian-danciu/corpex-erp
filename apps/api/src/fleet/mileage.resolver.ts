import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageLog } from './entities/mileage-log.entity';
import { CreateMileageLogInput } from './dto/create-mileage-log.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => MileageLog)
export class MileageResolver {
  constructor(private readonly mileageService: MileageService) {}

  @Query(() => [MileageLog], { name: 'mileageLogs' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<MileageLog[]> {
    return this.mileageService.findByVehicle(vehicleId);
  }

  @Mutation(() => MileageLog)
  @UseGuards(JwtAuthGuard)
  async createMileageLog(
    @Args('createMileageLogInput') input: CreateMileageLogInput,
  ): Promise<MileageLog> {
    return this.mileageService.create(input);
  }

  @Mutation(() => MileageLog)
  @UseGuards(JwtAuthGuard)
  async deleteMileageLog(@Args('id') id: string): Promise<MileageLog> {
    return this.mileageService.remove(id);
  }
}
