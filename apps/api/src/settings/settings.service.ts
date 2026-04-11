import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsInput } from './dto/update-settings.input';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.companySettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async updateSettings(input: UpdateCompanySettingsInput) {
    return this.prisma.companySettings.upsert({
      where: { id: SINGLETON_ID },
      update: input,
      create: { id: SINGLETON_ID, ...input },
    });
  }
}
