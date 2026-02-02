import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentInput } from './dto/create-payment.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => Payment, { description: 'Record a payment for an invoice' })
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Args('createPaymentInput') input: CreatePaymentInput,
    @CurrentUser() user: User,
  ): Promise<Payment> {
    return this.paymentsService.create(input, user.id);
  }
}
