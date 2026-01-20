/**
 * Client Providers - ClientBase, ClientEntreprise, ClientPartenaire
 * Regroupement des providers liés à la gestion des clients
 */

import { CreateClientBaseUseCase } from '../../../../applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from '../../../../applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from '../../../../applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from '../../../../applications/usecase/client-base/delete-client-base.usecase';
import { TypeOrmClientBaseRepository } from '../../../repositories/typeorm-client-base.repository';

import { CreateClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/create-client-entreprise.usecase';
import { GetClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/get-client-entreprise.usecase';
import { UpdateClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/update-client-entreprise.usecase';
import { DeleteClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/delete-client-entreprise.usecase';
import { TypeOrmClientEntrepriseRepository } from '../../../repositories/typeorm-client-entreprise.repository';

import { CreateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/create-client-partenaire.usecase';
import { GetClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/get-client-partenaire.usecase';
import { UpdateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/update-client-partenaire.usecase';
import { DeleteClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/delete-client-partenaire.usecase';
import { TypeOrmClientPartenaireRepository } from '../../../repositories/typeorm-client-partenaire.repository';

export const CLIENT_PROVIDERS = [
  // ClientBase Use Cases
  CreateClientBaseUseCase,
  GetClientBaseUseCase,
  UpdateClientBaseUseCase,
  DeleteClientBaseUseCase,

  // ClientBase Repository
  {
    provide: 'ClientBaseRepositoryPort',
    useClass: TypeOrmClientBaseRepository,
  },

  // ClientEntreprise Use Cases
  CreateClientEntrepriseUseCase,
  GetClientEntrepriseUseCase,
  UpdateClientEntrepriseUseCase,
  DeleteClientEntrepriseUseCase,

  // ClientEntreprise Repository
  {
    provide: 'ClientEntrepriseRepositoryPort',
    useClass: TypeOrmClientEntrepriseRepository,
  },

  // ClientPartenaire Use Cases
  CreateClientPartenaireUseCase,
  GetClientPartenaireUseCase,
  UpdateClientPartenaireUseCase,
  DeleteClientPartenaireUseCase,

  // ClientPartenaire Repository
  {
    provide: 'ClientPartenaireRepositoryPort',
    useClass: TypeOrmClientPartenaireRepository,
  },
];
