import {
  Controller,
  Query,
  Sse,
  MessageEvent,
  Header,
  Post,
  Body,
  Get,
} from '@nestjs/common';
import { Public, Roles } from 'nest-keycloak-connect';
import { GenerateTextUseCase } from '../../../../applications/usecase/generate-text.usecase';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Controller('ai')
export class AiController {
  private readonly defaultSystemPrompt: string;

  constructor(
    private readonly generateText: GenerateTextUseCase,
    private readonly configService: ConfigService,
  ) {
    // Récupérer le DEFAULT_SYSTEM_PROMPT depuis les variables d'environnement
    this.defaultSystemPrompt = this.configService.get<string>(
      'DEFAULT_SYSTEM_PROMPT',
      'Tu es un assistant utile.'
    );
  }

  // TODO: En production, protéger avec @Roles({ roles: ['realm:user', 'realm:admin'] })
  @Public()
  @Post('generate-once')
  async generateOncePost(
    @Body('q') q: string,
    @Body('session_id') sessionId?: string
  ): Promise<{ text: string }> {
    // Utilise toujours le system_prompt configuré dans le backend
    // Ignore tout system_prompt fourni par l'utilisateur pour des raisons de sécurité
    const text = await this.generateText.execute(
      q,
      this.defaultSystemPrompt,
      sessionId
    );
    return { text };
  }

  // TODO: En production, protéger avec @Roles({ roles: ['realm:user', 'realm:admin'] })
  @Public()
  @Sse('generate')
  @Header('Content-Type', 'text/event-stream; charset=utf-8')
  generate(
    @Query('q') q = '',
    @Query('session_id') sessionId?: string
  ): Observable<MessageEvent> {
    // Utilise toujours le system_prompt configuré dans le backend
    // Ignore tout system_prompt fourni par l'utilisateur pour des raisons de sécurité
    return this.generateText
      .executeStream(q, this.defaultSystemPrompt, sessionId)
      .pipe(map((chunk) => ({ data: JSON.stringify(chunk) })));
  }

  @Public()
  @Get('health')
  async checkHealth(): Promise<{ status: string; online: boolean }> {
    try {
      // Teste une génération rapide pour vérifier que le service gRPC répond
      await this.generateText.execute('ping', '', undefined);
      return { status: 'online', online: true };
    } catch (error) {
      return { status: 'offline', online: false };
    }
  }
}
