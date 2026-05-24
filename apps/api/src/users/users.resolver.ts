import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { ChangePasswordInput } from './dto/change-password.input';
import { UpdateProfilePictureInput } from './dto/update-profile-picture.input';
import { EmployeeAccountGenerationResult } from './dto/employee-account-generation-result';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User, { description: 'Create a new user account' })
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users', description: 'Get all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, {
    name: 'user',
    description: 'Get a user by ID',
    nullable: true,
  })
  async findOne(@Args('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => EmployeeAccountGenerationResult, {
    description: 'Generate a user account from an employee record',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async generateEmployeeAccount(
    @Args('employeeId') employeeId: string,
  ): Promise<EmployeeAccountGenerationResult> {
    return this.usersService.generateEmployeeAccount(employeeId);
  }

  @Mutation(() => [EmployeeAccountGenerationResult], {
    description: 'Generate user accounts for multiple employee records',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async generateEmployeeAccounts(
    @Args('employeeIds', { type: () => [String] }) employeeIds: string[],
  ): Promise<EmployeeAccountGenerationResult[]> {
    return this.usersService.generateEmployeeAccounts(employeeIds);
  }

  @Mutation(() => User, { description: 'Change user password' })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('changePasswordInput') changePasswordInput: ChangePasswordInput,
  ): Promise<User> {
    return this.usersService.changePassword(
      user.id,
      changePasswordInput.currentPassword,
      changePasswordInput.newPassword,
    );
  }

  @Mutation(() => User, { description: 'Update user profile picture' })
  @UseGuards(JwtAuthGuard)
  async updateProfilePicture(
    @CurrentUser() user: User,
    @Args('updateProfilePictureInput')
    updateProfilePictureInput: UpdateProfilePictureInput,
  ): Promise<User> {
    return this.usersService.updateProfilePicture(
      user.id,
      updateProfilePictureInput.profilePicture,
    );
  }
}
