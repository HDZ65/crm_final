import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GammeEntity, TypeGamme } from '../../../../../domain/products';

@Injectable()
export class GammeService {
  constructor(
    @InjectRepository(GammeEntity)
    private readonly gammeRepository: Repository<GammeEntity>,
  ) {}

  async create(data: Partial<GammeEntity>): Promise<GammeEntity> {
    const gamme = this.gammeRepository.create(data);
    return this.gammeRepository.save(gamme);
  }

  async update(id: string, data: Partial<GammeEntity>): Promise<GammeEntity> {
    const updateData: any = { ...data };
    // Remove relations from update data
    delete updateData.parent;
    delete updateData.children;
    delete updateData.produits;

    await this.gammeRepository.update(id, updateData);
    const updated = await this.gammeRepository.findOneBy({ id });
    return updated!;
  }

  async findById(id: string): Promise<GammeEntity | null> {
    const gamme = await this.gammeRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'produits'],
    });
    return gamme || null;
  }

  async findByOrganisation(organisationId: string): Promise<GammeEntity[]> {
    return this.gammeRepository.find({
      where: { organisationId },
      relations: ['parent', 'children'],
      order: { ordre: 'ASC' },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.gammeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Détecte les cycles dans la hiérarchie
   * Retourne true s'il y a un cycle
   */
  async hasCycle(gammeId: string, parentId: string | null): Promise<boolean> {
    if (!parentId) return false;

    const visited = new Set<string>();
    let current: string | null = parentId;

    while (current) {
      if (visited.has(current)) {
        return true; // Cycle détecté
      }
      if (current === gammeId) {
        return true; // Tentative de créer une boucle directe
      }

      visited.add(current);
      const parent = await this.gammeRepository.findOneBy({ id: current });
      current = parent?.parentId ?? null;
    }

    return false;
  }

  /**
   * Valide la profondeur maximale (3 niveaux)
   * Retourne la profondeur actuelle
   */
  async getDepth(gammeId: string): Promise<number> {
    let depth = 0;
    let current = await this.gammeRepository.findOneBy({ id: gammeId });

    while (current?.parentId) {
      depth++;
      current = await this.gammeRepository.findOneBy({ id: current.parentId });
      if (depth > 3) {
        return depth; // Dépasse la limite
      }
    }

    return depth;
  }

  /**
   * Construit l'arborescence complète pour une organisation
   */
  async buildTree(organisationId: string, parentId?: string): Promise<any[]> {
    const where: any = { organisationId };
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    const gammes = await this.gammeRepository.find({
      where,
      relations: ['children'],
      order: { ordre: 'ASC' },
    });

    const tree: any[] = [];
    for (const gamme of gammes) {
      const node: any = {
        id: gamme.id,
        nom: gamme.nom,
        code: gamme.code,
        niveau: gamme.niveau,
        type_gamme: gamme.typeGamme,
        children: await this.buildTree(organisationId, gamme.id),
      };
      tree.push(node);
    }

    return tree;
  }
}
