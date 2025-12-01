import { PartialType } from '@nestjs/mapped-types';
import { CreatePrixProduitDto } from './create-prix-produit.dto';

export class UpdatePrixProduitDto extends PartialType(CreatePrixProduitDto) {}
