import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CompanySettings } from './entities/company-settings.entity';
import { UpdateCompanySettingsInput } from './dto/update-settings.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DepartmentGuard } from '../auth/guards/department.guard';

@Resolver(() => CompanySettings)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => CompanySettings, {
    name: 'companySettings',
    description: 'Get company settings',
  })
  @UseGuards(JwtAuthGuard)
  async getSettings(): Promise<CompanySettings> {
    return this.settingsService.getSettings();
  }

  @Mutation(() => CompanySettings, {
    description: 'Update company settings (admin only)',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @Roles('ADMIN')
  async updateCompanySettings(
    @Args('updateCompanySettingsInput') input: UpdateCompanySettingsInput,
  ): Promise<CompanySettings> {
    return this.settingsService.updateSettings(input);
  }
}
