import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Partner } from './entities/partner.entity';
import { CreatePartnerInput } from './dto/create-partner.input';
import { UpdatePartnerInput } from './dto/update-partner.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => Partner)
export class PartnersResolver {
  constructor(private readonly partnersService: PartnersService) {}

  @Query(() => [Partner], { name: 'partners', description: 'Get all partners' })
  @UseGuards(JwtAuthGuard)
  async findAllPartners(): Promise<Partner[]> {
    return this.partnersService.findAll();
  }

  @Query(() => Partner, {
    name: 'partner',
    description: 'Get a partner by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async findOnePartner(@Args('id') id: string): Promise<Partner | null> {
    return this.partnersService.findOne(id);
  }

  @Mutation(() => Partner, { description: 'Create a new partner' })
  @UseGuards(JwtAuthGuard)
  async createPartner(
    @Args('createPartnerInput') input: CreatePartnerInput,
  ): Promise<Partner> {
    return this.partnersService.create(input);
  }

  @Mutation(() => Partner, { description: 'Update a partner' })
  @UseGuards(JwtAuthGuard)
  async updatePartner(
    @Args('updatePartnerInput') input: UpdatePartnerInput,
  ): Promise<Partner> {
    return this.partnersService.update(input);
  }

  @Mutation(() => Partner, { description: 'Delete a partner' })
  @UseGuards(JwtAuthGuard)
  async deletePartner(@Args('id') id: string): Promise<Partner> {
    return this.partnersService.remove(id);
  }
}
