import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceStatusInput } from './dto/update-invoice-status.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Invoice)
export class InvoicesResolver {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Query(() => [Invoice], { name: 'invoices', description: 'Get all invoices' })
  @UseGuards(JwtAuthGuard)
  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoicesService.findAll();
  }

  @Query(() => Invoice, {
    name: 'invoice',
    description: 'Get an invoice by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async findOneInvoice(@Args('id') id: string): Promise<Invoice | null> {
    return this.invoicesService.findOne(id);
  }

  @Mutation(() => Invoice, { description: 'Create a new invoice' })
  @UseGuards(JwtAuthGuard)
  async createInvoice(
    @Args('createInvoiceInput') input: CreateInvoiceInput,
    @CurrentUser() user: User,
  ): Promise<Invoice> {
    return this.invoicesService.create(input, user.id);
  }

  @Mutation(() => Invoice, { description: 'Update invoice status' })
  @UseGuards(JwtAuthGuard)
  async updateInvoiceStatus(
    @Args('updateInvoiceStatusInput') input: UpdateInvoiceStatusInput,
  ): Promise<Invoice> {
    return this.invoicesService.updateStatus(input);
  }

  @Mutation(() => Invoice, { description: 'Delete an invoice' })
  @UseGuards(JwtAuthGuard)
  async deleteInvoice(@Args('id') id: string): Promise<Invoice> {
    return this.invoicesService.remove(id);
  }
}
