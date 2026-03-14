import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { ExpiringDocumentSummary } from './entities/expiring-document-summary.type';
import { CreateVehicleDocumentInput } from './dto/create-vehicle-document.input';
import { UpdateVehicleDocumentInput } from './dto/update-vehicle-document.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => VehicleDocument)
export class VehicleDocumentsResolver {
  constructor(private readonly vehicleDocumentsService: VehicleDocumentsService) {}

  @Query(() => [VehicleDocument], { name: 'vehicleDocuments' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleDocument[]> {
    return this.vehicleDocumentsService.findByVehicle(vehicleId);
  }

  @Query(() => [ExpiringDocumentSummary], { name: 'expiringDocuments' })
  @UseGuards(JwtAuthGuard)
  async findExpiring(
    @Args('daysAhead', { type: () => Int }) daysAhead: number,
  ): Promise<ExpiringDocumentSummary[]> {
    return this.vehicleDocumentsService.findExpiring(daysAhead);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async createVehicleDocument(
    @Args('createVehicleDocumentInput') input: CreateVehicleDocumentInput,
  ): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.create(input);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async updateVehicleDocument(
    @Args('updateVehicleDocumentInput') input: UpdateVehicleDocumentInput,
  ): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.update(input);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async deleteVehicleDocument(@Args('id') id: string): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.remove(id);
  }
}
