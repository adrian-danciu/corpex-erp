import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerInput } from './dto/create-partner.input';
import { UpdatePartnerInput } from './dto/update-partner.input';
import { Partner } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreatePartnerInput): Promise<Partner> {
    const existing = await this.prisma.partner.findUnique({
      where: { cui: input.cui },
    });

    if (existing) {
      throw new ConflictException(
        `Partner with CUI ${input.cui} already exists`,
      );
    }

    return this.prisma.partner.create({
      data: {
        name: input.name,
        cui: input.cui,
        regCom: input.regCom,
        address: input.address,
        city: input.city,
        country: input.country,
        email: input.email,
        phone: input.phone,
        contactPerson: input.contactPerson,
        partnerType: input.partnerType,
        bankName: input.bankName,
        bankAccount: input.bankAccount,
        notes: input.notes,
      },
    });
  }

  async findAll(): Promise<Partner[]> {
    return this.prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Partner | null> {
    return this.prisma.partner.findUnique({
      where: { id },
    });
  }

  async update(input: UpdatePartnerInput): Promise<Partner> {
    const partner = await this.findOne(input.id);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${input.id} not found`);
    }

    if (input.cui && input.cui !== partner.cui) {
      const existing = await this.prisma.partner.findUnique({
        where: { cui: input.cui },
      });
      if (existing) {
        throw new ConflictException(
          `Partner with CUI ${input.cui} already exists`,
        );
      }
    }

    const { id, ...data } = input;
    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.partner.update({
      where: { id },
      data: cleanData,
    });
  }

  async remove(id: string): Promise<Partner> {
    const partner = await this.findOne(id);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return this.prisma.partner.delete({ where: { id } });
  }
}
