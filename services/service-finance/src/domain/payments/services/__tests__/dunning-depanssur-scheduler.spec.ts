import { Test, TestingModule } from '@nestjs/testing';
import { DunningDepanssurSchedulerService } from '../dunning-depanssur-scheduler.service';
import { DunningDepanssurService } from '../dunning-depanssur.service';

describe('DunningDepanssurSchedulerService', () => {
  let service: DunningDepanssurSchedulerService;
  let dunningService: DunningDepanssurService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DunningDepanssurSchedulerService,
        {
          provide: DunningDepanssurService,
          useValue: {
            processPendingSteps: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DunningDepanssurSchedulerService>(
      DunningDepanssurSchedulerService,
    );
    dunningService = module.get<DunningDepanssurService>(DunningDepanssurService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDunningCron', () => {
    it('should call processPendingSteps and log result', async () => {
      // Arrange
      const mockProcessed = 3;
      jest
        .spyOn(dunningService, 'processPendingSteps')
        .mockResolvedValue(mockProcessed);
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handleDunningCron();

      // Assert
      expect(dunningService.processPendingSteps).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Running dunning step processor...');
      expect(logSpy).toHaveBeenCalledWith('Dunning cron: processed 3 step(s)');
    });

    it('should handle zero processed steps', async () => {
      // Arrange
      jest.spyOn(dunningService, 'processPendingSteps').mockResolvedValue(0);
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Act
      await service.handleDunningCron();

      // Assert
      expect(dunningService.processPendingSteps).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Dunning cron: processed 0 step(s)');
    });

    it('should handle processPendingSteps errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest
        .spyOn(dunningService, 'processPendingSteps')
        .mockRejectedValue(error);
      const logSpy = jest.spyOn(service['logger'], 'log');
      const errorSpy = jest.spyOn(service['logger'], 'error');

      // Act & Assert
      await expect(service.handleDunningCron()).rejects.toThrow(
        'Database connection failed',
      );
      expect(errorSpy).not.toHaveBeenCalled(); // Service doesn't catch, lets error propagate
    });
  });
});
