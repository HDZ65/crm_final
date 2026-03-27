import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GammeEntity } from '../../../../../domain/products';

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

  async findByOrganisation(keycloakGroupId: string, societeId?: string): Promise<GammeEntity[]> {
    const where: any = { keycloakGroupId };
    if (societeId) {
      where.societeId = societeId;
    }
    return this.gammeRepository.find({
      where,
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
   * PERFORMANCE: Charge tous les ancêtres en une requête au lieu de N requêtes
   */
  async hasCycle(gammeId: string, parentId: string | null): Promise<boolean> {
    if (!parentId) return false;

    // Charger toutes les gammes de l'organisation en une seule requête
    const gamme = await this.gammeRepository.findOneBy({ id: gammeId });
    if (!gamme) return false;

    const allGammes = await this.gammeRepository.find({
      where: { keycloakGroupId: gamme.keycloakGroupId },
      select: ['id', 'parentId'],
    });

    const parentMap = new Map(allGammes.map((g) => [g.id, g.parentId]));

    const visited = new Set<string>();
    let current: string | null = parentId;

    while (current) {
      if (visited.has(current) || current === gammeId) {
        return true;
      }
      visited.add(current);
      current = parentMap.get(current) ?? null;
    }

    return false;
  }

  /**
   * Valide la profondeur maximale (3 niveaux)
   * Retourne la profondeur actuelle
   * PERFORMANCE: Charge tous les ancêtres en une requête
   */
  async getDepth(gammeId: string): Promise<number> {
    const gamme = await this.gammeRepository.findOneBy({ id: gammeId });
    if (!gamme) return 0;

    const allGammes = await this.gammeRepository.find({
      where: { keycloakGroupId: gamme.keycloakGroupId },
      select: ['id', 'parentId'],
    });

    const parentMap = new Map(allGammes.map((g) => [g.id, g.parentId]));

    let depth = 0;
    let currentParentId = gamme.parentId;

    while (currentParentId && depth <= 3) {
      depth++;
      currentParentId = parentMap.get(currentParentId) ?? null;
    }

    return depth;
  }

  /**
   * Construit l'arborescence complète pour une organisation
   * PERFORMANCE: Une seule requête au lieu de N+1 récursif
   */
  async buildTree(keycloakGroupId: string, _parentId?: string): Promise<any[]> {
    // Charger TOUTES les gammes de l'organisation en une seule requête
    const allGammes = await this.gammeRepository.find({
      where: { keycloakGroupId },
      order: { ordre: 'ASC' },
    });

    // Construire l'arbre en mémoire
    const nodeMap = new Map<string, any>();
    const roots: any[] = [];

    // Créer tous les nœuds
    for (const gamme of allGammes) {
      nodeMap.set(gamme.id, {
        id: gamme.id,
        nom: gamme.nom,
        code: gamme.code,
        niveau: gamme.niveau,
        type_gamme: gamme.typeGamme,
        children: [],
      });
    }

    // Relier parents et enfants
    for (const gamme of allGammes) {
      const node = nodeMap.get(gamme.id)!;
      if (gamme.parentId && nodeMap.has(gamme.parentId)) {
        nodeMap.get(gamme.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
