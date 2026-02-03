import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestsService } from './leave-requests.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;

  const mockPrismaService = {
    leaveRequest: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeaveRequestsService>(LeaveRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all leave requests without pagination', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrismaService.leaveRequest.findMany).toHaveBeenCalledWith({
        include: { employee: true, approver: true },
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should return leave requests with pagination', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.findAll({ skip: 10, take: 5 });

      expect(mockPrismaService.leaveRequest.findMany).toHaveBeenCalledWith({
        include: { employee: true, approver: true },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 5,
      });
    });
  });
});
