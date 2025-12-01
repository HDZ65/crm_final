import { Header, Injectable, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Readable } from 'node:stream';
import * as path from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { ILlmPort, TokenChunk } from '../../core/port/llm.port';

// Types pour le client gRPC généré (correspondent au proto Langchain)
interface GenerateRequest {
  prompt: string;
  params?: Record<string, string>; // temperature, max_tokens, etc.
}

interface GenerateReply {
  text: string;
}

interface LlmGrpcService {
  Generate(
    req: GenerateRequest,
    callback: (err: grpc.ServiceError | null, response: GenerateReply) => void,
  ): void;
  GenerateStream(req: GenerateRequest): Readable;
}

@Injectable()
export class LlmGrpcClient implements ILlmPort {
  private client: LlmGrpcService;

  constructor() {
    // Utiliser le chemin depuis la racine du projet
    // En dev: __dirname = .../src/infrastructure/grpc
    // En prod: __dirname = .../dist/src/infrastructure/grpc
    // On remonte à la racine puis on va dans src/
    const projectRoot = path.join(__dirname, '../../../../');
    const protoPath = path.join(projectRoot, 'src/infrastructure/grpc/llm.proto');
    const pkgDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      bytes: String, // Force string conversion for bytes
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const grpcObj = (grpc.loadPackageDefinition(pkgDef) as any).llm;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.client = new grpcObj.LLM(
      process.env.LLM_GRPC_ADDR || 'localhost:50051',
      grpc.credentials.createInsecure(),
      {
        'grpc.default_compression_algorithm': 0,
        'grpc.default_compression_level': 0,
      },
    ) as LlmGrpcService;
  }

  async generate(prompt: string, systemPrompt?: string, sessionId?: string): Promise<string> {
    const req: GenerateRequest = { prompt, params: {} };
    if (systemPrompt !== undefined) {
      req.params!.system_prompt = systemPrompt;
    }
    if (sessionId) {
      req.params!.session_id = sessionId;
    }
    const resp = await new Promise<GenerateReply>((resolve, reject) => {
      this.client.Generate(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    return resp.text;
  }

  @Sse('generate')
  @Header('Content-Type', 'text/event-stream; charset=utf-8')
  generateStream(prompt: string, systemPrompt?: string, sessionId?: string): Observable<TokenChunk> {
    const req: GenerateRequest = { prompt, params: {} };
    if (systemPrompt !== undefined) {
      req.params!.system_prompt = systemPrompt;
    }
    if (sessionId) {
      req.params!.session_id = sessionId;
    }
    return new Observable<TokenChunk>((subscriber) => {
      const call: Readable = this.client.GenerateStream(req);

      call.on('data', (chunk: any) => {
        // Get token from chunk
        let token = chunk.token || '';

        // If token is a Buffer, decode as UTF-8
        if (Buffer.isBuffer(token)) {
          token = token.toString('utf-8');
        }

        // Create token chunk with the string as-is
        const tokenChunk: TokenChunk = {
          token: String(token),
          is_final: Boolean(chunk.is_final),
        };
        subscriber.next(tokenChunk);
      });
      call.on('end', () => subscriber.complete());
      call.on('error', (err) => subscriber.error(err));

      return () => call.destroy();
    });
  }
}
