import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Partner } from './entities/partner.entity';
import { CreatePartnerInput } from './dto/create-partner.input';
import { UpdatePartnerInput } from './dto/update-partner.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { PaginationInput } from '../common/dto/pagination.input';
import { PaginatedPartner } from './dto/paginated-partner.dto';
import { normalizePagination } from '../common/pagination';

@Resolver(() => Partner)
export class PartnersResolver {
  constructor(private readonly partnersService: PartnersService) {}

  @Query(() => PaginatedPartner, {
    name: 'partners',
    description: 'Get all partners (paginated)',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async findAllPartners(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedPartner> {
    return this.partnersService.findAll(normalizePagination(pagination));
  }

  @Query(() => Partner, {
    name: 'partner',
    description: 'Get a partner by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async findOnePartner(@Args('id') id: string): Promise<Partner | null> {
    return this.partnersService.findOne(id);
  }

  @Mutation(() => Partner, { description: 'Create a new partner' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async createPartner(
    @Args('createPartnerInput') input: CreatePartnerInput,
  ): Promise<Partner> {
    return this.partnersService.create(input);
  }

  @Mutation(() => Partner, { description: 'Update a partner' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async updatePartner(
    @Args('updatePartnerInput') input: UpdatePartnerInput,
  ): Promise<Partner> {
    return this.partnersService.update(input);
  }

  @Mutation(() => Partner, { description: 'Delete a partner' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async deletePartner(@Args('id') id: string): Promise<Partner> {
    return this.partnersService.remove(id);
  }
}
