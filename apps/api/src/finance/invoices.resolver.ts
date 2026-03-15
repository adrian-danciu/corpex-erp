import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceStatusInput } from './dto/update-invoice-status.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationInput } from '../common/dto/pagination.input';
import { PaginatedInvoice } from './dto/paginated-invoice.dto';

@Resolver(() => Invoice)
export class InvoicesResolver {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Query(() => PaginatedInvoice, {
    name: 'invoices',
    description: 'Get all invoices (paginated)',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async findAllInvoices(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedInvoice> {
    const paginationInput = pagination || { skip: 0, take: 10 };
    return this.invoicesService.findAll(paginationInput);
  }

  @Query(() => Invoice, {
    name: 'invoice',
    description: 'Get an invoice by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async findOneInvoice(@Args('id') id: string): Promise<Invoice | null> {
    return this.invoicesService.findOne(id);
  }

  @Mutation(() => Invoice, { description: 'Create a new invoice' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async createInvoice(
    @Args('createInvoiceInput') input: CreateInvoiceInput,
    @CurrentUser() user: User,
  ): Promise<Invoice> {
    return this.invoicesService.create(input, user.id);
  }

  @Mutation(() => Invoice, { description: 'Update invoice status' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async updateInvoiceStatus(
    @Args('updateInvoiceStatusInput') input: UpdateInvoiceStatusInput,
  ): Promise<Invoice> {
    return this.invoicesService.updateStatus(input);
  }

  @Mutation(() => Invoice, { description: 'Delete an invoice' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'write')
  async deleteInvoice(@Args('id') id: string): Promise<Invoice> {
    return this.invoicesService.remove(id);
  }
}
