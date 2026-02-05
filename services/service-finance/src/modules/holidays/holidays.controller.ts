import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { HolidaysService } from './holidays.service';

@Controller()
export class HolidaysController {
  constructor(private readonly service: HolidaysService) {}

  @GrpcMethod('HolidayService', 'ListHolidays')
  async listHolidays(req: {
    holidayZoneId: string;
    year: number;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const holidays = await this.service.getHolidaysForYear(req.holidayZoneId, req.year);

      const page = req.pagination?.page ?? 1;
      const limit = req.pagination?.limit ?? 50;
      const offset = (page - 1) * limit;
      const paginatedHolidays = holidays.slice(offset, offset + limit);

      return {
        holidays: paginatedHolidays,
        pagination: {
          total: holidays.length,
          page,
          limit,
          totalPages: Math.ceil(holidays.length / limit),
        },
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('HolidayService', 'ListHolidayZones')
  async listHolidayZones(req: {
    organisationId: string;
    countryCode?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const zones = await this.service.getHolidayZonesByOrganisation(req.organisationId);

      const filteredZones = req.countryCode
        ? zones.filter((z) => z.countryCode === req.countryCode)
        : zones;

      const page = req.pagination?.page ?? 1;
      const limit = req.pagination?.limit ?? 50;
      const offset = (page - 1) * limit;
      const paginatedZones = filteredZones.slice(offset, offset + limit);

      return {
        zones: paginatedZones,
        pagination: {
          total: filteredZones.length,
          page,
          limit,
          totalPages: Math.ceil(filteredZones.length / limit),
        },
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('HolidayService', 'CreateHolidayZone')
  async createHolidayZone(req: {
    organisationId: string;
    code: string;
    name: string;
    countryCode: string;
    regionCode?: string;
  }) {
    try {
      const zone = await this.service.createHolidayZone(
        req.organisationId,
        req.code,
        req.name,
        req.countryCode,
        req.regionCode,
      );
      return zone;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
