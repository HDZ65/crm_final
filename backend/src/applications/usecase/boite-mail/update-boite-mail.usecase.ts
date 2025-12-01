import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BoiteMailEntity } from '../../../core/domain/boite-mail.entity';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';
import type { UpdateBoiteMailDto } from '../../dto/boite-mail/update-boite-mail.dto';

@Injectable()
export class UpdateBoiteMailUseCase {
  constructor(
    @Inject('BoiteMailRepositoryPort')
    private readonly repository: BoiteMailRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateBoiteMailDto): Promise<BoiteMailEntity> {
    const existingEntity = await this.repository.findById(id);

    if (!existingEntity) {
      throw new NotFoundException(`BoiteMail with id ${id} not found`);
    }

    const updatedEntity = new BoiteMailEntity({
      ...existingEntity,
      ...dto,
    });

    return await this.repository.update(id, updatedEntity);
  }
}
