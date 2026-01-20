import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { McpStandaloneModule } from '../mcp/mcp-standalone.module';
import { McpGrpcService } from './mcp-grpc.service';

/**
 * Démarre un serveur gRPC standalone pour le serveur MCP.
 * Port par défaut: 50052
 */
export async function startMcpGrpcServer(port: number = 50052) {
  // Créer l'application NestJS (contexte standalone avec TypeORM intégré)
  const app = await NestFactory.createApplicationContext(McpStandaloneModule);

  // Récupérer le service gRPC
  const mcpGrpcService = app.get(McpGrpcService);

  // Charger le fichier proto
  const PROTO_PATH = join(__dirname, '../../../proto/mcp.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const mcpProto = protoDescriptor.mcp;

  // Créer le serveur gRPC
  const server = new grpc.Server();

  // Enregistrer le service MCP
  server.addService(mcpProto.MCPService.service, {
    listTools: mcpGrpcService.listTools.bind(mcpGrpcService),
    executeTool: mcpGrpcService.executeTool.bind(mcpGrpcService),
  });

  // Démarrer le serveur
  return new Promise<void>((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error('Failed to start MCP gRPC server:', error);
          reject(error);
          return;
        }

        server.start();
        console.log(`✅ MCP gRPC Server started on port ${boundPort}`);
        resolve();
      },
    );
  });
}

// Si le fichier est exécuté directement
if (require.main === module) {
  const port = process.env.MCP_GRPC_PORT
    ? parseInt(process.env.MCP_GRPC_PORT, 10)
    : 50052;

  startMcpGrpcServer(port).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
