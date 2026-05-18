import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmployeeDocumentsService } from './employee-documents.service';
import { EmployeeDocument } from './entities/employee-document.entity';
import {
  CreateEmployeeDocumentInput,
  EmployeeDocumentFilterInput,
} from './dto/employee-document.inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => EmployeeDocument)
export class EmployeeDocumentsResolver {
  constructor(private readonly documentsService: EmployeeDocumentsService) {}

  @Query(() => [EmployeeDocument], { name: 'employeeDocuments' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async employeeDocuments(
    @Args('filter', { nullable: true, type: () => EmployeeDocumentFilterInput })
    filter?: EmployeeDocumentFilterInput,
  ): Promise<EmployeeDocument[]> {
    return this.documentsService.findAll(filter);
  }

  @Mutation(() => EmployeeDocument)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async createEmployeeDocument(
    @Args('input') input: CreateEmployeeDocumentInput,
    @CurrentUser() user: User,
  ): Promise<EmployeeDocument> {
    return this.documentsService.create(input, user.id);
  }

  @Mutation(() => EmployeeDocument)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async deleteEmployeeDocument(@Args('id') id: string): Promise<EmployeeDocument> {
    return this.documentsService.remove(id);
  }
}
