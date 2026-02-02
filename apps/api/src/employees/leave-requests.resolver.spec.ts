import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestsResolver } from './leave-requests.resolver';
import { LeaveRequestsService } from './leave-requests.service';
import { PaginationArgs } from '../common/pagination/pagination.args';

describe('LeaveRequestsResolver', () => {
  let resolver: LeaveRequestsResolver;

  const mockLeaveRequestsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestsResolver,
        {
          provide: LeaveRequestsService,
          useValue: mockLeaveRequestsService,
        },
      ],
    }).compile();

    resolver = module.get<LeaveRequestsResolver>(LeaveRequestsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAllLeaveRequests', () => {
    it('should call service.findAll with pagination args', async () => {
      const paginationArgs: PaginationArgs = { skip: 0, take: 10 };
      mockLeaveRequestsService.findAll.mockResolvedValue([]);

      await resolver.findAllLeaveRequests(paginationArgs);

      expect(mockLeaveRequestsService.findAll).toHaveBeenCalledWith(
        paginationArgs,
      );
    });
  });
});
