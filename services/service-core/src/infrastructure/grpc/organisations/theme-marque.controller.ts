import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateThemeMarqueRequest,
  DeleteThemeMarqueRequest,
  GetThemeMarqueRequest,
  ListThemeMarqueRequest,
  UpdateThemeMarqueRequest,
} from '@proto/organisations';
import { ThemeMarqueService } from '../../persistence/typeorm/repositories/organisations/theme-marque.service';

@Controller()
export class ThemeMarqueController {
  constructor(private readonly themeMarqueService: ThemeMarqueService) {}

  @GrpcMethod('ThemeMarqueService', 'Create')
  async create(data: CreateThemeMarqueRequest) {
    return this.themeMarqueService.create({
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
  }

  @GrpcMethod('ThemeMarqueService', 'Update')
  async update(data: UpdateThemeMarqueRequest) {
    return this.themeMarqueService.update({
      id: data.id,
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
  }

  @GrpcMethod('ThemeMarqueService', 'Get')
  async get(data: GetThemeMarqueRequest) {
    return this.themeMarqueService.findById(data.id);
  }

  @GrpcMethod('ThemeMarqueService', 'List')
  async list(data: ListThemeMarqueRequest) {
    return this.themeMarqueService.findAll(data.pagination);
  }

  @GrpcMethod('ThemeMarqueService', 'Delete')
  async delete(data: DeleteThemeMarqueRequest) {
    const success = await this.themeMarqueService.delete(data.id);
    return { success };
  }
}
