import { Injectable, Logger } from '@nestjs/common';
import { McpService } from '../mcp/mcp.service';

/**
 * Service gRPC pour exposer le serveur MCP.
 * Implémente les méthodes définies dans proto/mcp.proto
 */
@Injectable()
export class McpGrpcService {
  private readonly logger = new Logger(McpGrpcService.name);

  constructor(private readonly mcpService: McpService) {}

  /**
   * Liste tous les tools MCP disponibles.
   * Correspond à: rpc ListTools(Empty) returns (ToolsResponse);
   */
  async listTools(call: any, callback: any) {
    try {
      this.logger.log('ListTools called');

      const tools = this.mcpService.listTools();

      callback(null, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: JSON.stringify(t.input_schema),
        })),
      });
    } catch (error: any) {
      this.logger.error(`ListTools error: ${error.message}`, error.stack);
      callback({
        code: 2, // UNKNOWN error code
        message: error.message,
      });
    }
  }

  /**
   * Exécute un tool MCP spécifique.
   * Correspond à: rpc ExecuteTool(ExecuteRequest) returns (ExecuteResponse);
   */
  async executeTool(call: any, callback: any) {
    const { tool_name, input, request_id, organisation_id } = call.request;

    this.logger.log(
      `ExecuteTool called: tool=${tool_name}, requestId=${request_id}, organisationId=${organisation_id}`,
    );

    try {
      // Parse l'input JSON
      let inputObj: any;
      try {
        inputObj = JSON.parse(input);
      } catch (parseError) {
        throw new Error(`Invalid JSON input: ${parseError}`);
      }

      // Force le organisationId depuis la requête gRPC (sécurité)
      inputObj.organisationId = organisation_id;

      // Exécute le tool via McpService
      const result = await this.mcpService.execute(tool_name, inputObj, {
        requestId: request_id,
      });

      this.logger.log(
        `ExecuteTool success: tool=${tool_name}, requestId=${request_id}`,
      );

      callback(null, {
        result: JSON.stringify(result),
        error: '',
        success: true,
      });
    } catch (error: any) {
      this.logger.error(
        `ExecuteTool error: tool=${tool_name}, requestId=${request_id}, error=${error.message}`,
        error.stack,
      );

      callback(null, {
        result: '',
        error: error.message,
        success: false,
      });
    }
  }
}
