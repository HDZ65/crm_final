import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ThemeMarqueService } from '../../../../infrastructure/persistence/typeorm/repositories/organisations/theme-marque.service';

import type {
  CreateThemeMarqueRequest,
  UpdateThemeMarqueRequest,
  GetThemeMarqueRequest,
  ListThemeMarqueRequest,
  DeleteThemeMarqueRequest,
} from '@crm/proto/organisations';

@Controller()
export class ThemeMarqueController {
  constructor(private readonly themeMarqueService: ThemeMarqueService) {}

  @GrpcMethod('ThemeMarqueService', 'Create')
  async create(data: CreateThemeMarqueRequest) {
    return this.themeMarqueService.create({
      logoUrl: data.logo_url,
      couleurPrimaire: data.couleur_primaire,
      couleurSecondaire: data.couleur_secondaire,
      faviconUrl: data.favicon_url,
    });
  }

  @GrpcMethod('ThemeMarqueService', 'Update')
  async update(data: UpdateThemeMarqueRequest) {
    return this.themeMarqueService.update({
      id: data.id,
      logoUrl: data.logo_url,
      couleurPrimaire: data.couleur_primaire,
      couleurSecondaire: data.couleur_secondaire,
      faviconUrl: data.favicon_url,
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
