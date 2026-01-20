var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannedDebitEntity } from './entities/planned-debit.entity.js';
import { VolumeForecastEntity } from './entities/volume-forecast.entity.js';
import { VolumeThresholdEntity } from './entities/volume-threshold.entity.js';
import { CalendarEngineService } from './calendar-engine.service.js';
import { ConfigurationModule } from '../configuration/configuration.module.js';
import { HolidaysModule } from '../holidays/holidays.module.js';
let EngineModule = class EngineModule {
};
EngineModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([
                PlannedDebitEntity,
                VolumeForecastEntity,
                VolumeThresholdEntity,
            ]),
            forwardRef(() => ConfigurationModule),
            forwardRef(() => HolidaysModule),
        ],
        providers: [CalendarEngineService],
        exports: [CalendarEngineService],
    })
], EngineModule);
export { EngineModule };
//# sourceMappingURL=engine.module.js.map