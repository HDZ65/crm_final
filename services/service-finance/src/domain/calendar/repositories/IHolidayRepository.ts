import { HolidayEntity } from '../entities/holiday.entity';
import { HolidayZoneEntity } from '../entities/holiday-zone.entity';

export interface IHolidayRepository {
  findById(id: string): Promise<HolidayEntity | null>;
  findByZone(zoneId: string): Promise<HolidayEntity[]>;
  findByZoneAndDateRange(zoneId: string, startDate: Date, endDate: Date): Promise<HolidayEntity[]>;
  isHoliday(zoneId: string, date: Date): Promise<boolean>;
  save(entity: HolidayEntity): Promise<HolidayEntity>;
  delete(id: string): Promise<void>;
}

export interface IHolidayZoneRepository {
  findById(id: string): Promise<HolidayZoneEntity | null>;
  findByOrganisation(organisationId: string): Promise<HolidayZoneEntity[]>;
  findByCode(organisationId: string, code: string): Promise<HolidayZoneEntity | null>;
  save(entity: HolidayZoneEntity): Promise<HolidayZoneEntity>;
  delete(id: string): Promise<void>;
}
