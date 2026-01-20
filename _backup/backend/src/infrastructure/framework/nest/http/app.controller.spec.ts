import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should contain "Hello World!"', () => {
      expect(appController.getHello()).toContain('Hello World!');
    });
  });

  describe('health', () => {
    it('should return ok status', () => {
      expect(appController.health()).toEqual({ status: 'ok' });
    });
  });
});
