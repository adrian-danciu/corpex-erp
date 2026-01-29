import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequest } from './entities/leave-request.entity';
import { CreateLeaveRequestInput } from './dto/create-leave-request.input';
import { ApproveLeaveRequestInput } from './dto/approve-leave-request.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => LeaveRequest)
export class LeaveRequestsResolver {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
  ) {}

  @Mutation(() => LeaveRequest, {
    description: 'Create a new leave request',
  })
  @UseGuards(JwtAuthGuard)
  async createLeaveRequest(
    @CurrentUser() user: User,
    @Args('createLeaveRequestInput')
    createLeaveRequestInput: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    return this.leaveRequestsService.create(user.id, createLeaveRequestInput);
  }

  @Query(() => [LeaveRequest], {
    name: 'leaveRequests',
    description: 'Get all leave requests',
  })
  @UseGuards(JwtAuthGuard)
  async findAllLeaveRequests(): Promise<LeaveRequest[]> {
    return this.leaveRequestsService.findAll();
  }

  @Query(() => [LeaveRequest], {
    name: 'myLeaveRequests',
    description: 'Get leave requests of current user',
  })
  @UseGuards(JwtAuthGuard)
  async getMyLeaveRequests(@CurrentUser() user: User): Promise<LeaveRequest[]> {
    return this.leaveRequestsService.findByEmployee(user.id);
  }

  @Query(() => [LeaveRequest], {
    name: 'pendingLeaveRequestsForManager',
    description: 'Get pending leave requests for current user subordinates',
  })
  @UseGuards(JwtAuthGuard)
  async getPendingLeaveRequestsForManager(
    @CurrentUser() user: User,
  ): Promise<LeaveRequest[]> {
    return this.leaveRequestsService.findPendingForManager(user.id);
  }

  @Query(() => LeaveRequest, {
    name: 'leaveRequest',
    description: 'Get a leave request by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async findOneLeaveRequest(
    @Args('id') id: string,
  ): Promise<LeaveRequest | null> {
    return this.leaveRequestsService.findOne(id);
  }

  @Mutation(() => LeaveRequest, {
    description: 'Approve or reject a leave request',
  })
  @UseGuards(JwtAuthGuard)
  async approveOrRejectLeaveRequest(
    @CurrentUser() user: User,
    @Args('approveLeaveRequestInput')
    approveLeaveRequestInput: ApproveLeaveRequestInput,
  ): Promise<LeaveRequest> {
    return this.leaveRequestsService.approveOrReject(
      user.id,
      approveLeaveRequestInput,
    );
  }

  @Mutation(() => LeaveRequest, {
    description: 'Cancel a leave request',
  })
  @UseGuards(JwtAuthGuard)
  async cancelLeaveRequest(
    @CurrentUser() user: User,
    @Args('leaveRequestId') leaveRequestId: string,
  ): Promise<LeaveRequest> {
    return this.leaveRequestsService.cancel(user.id, leaveRequestId);
  }
}
