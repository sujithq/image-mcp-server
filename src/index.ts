#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { AzureImageService } from './services/azureImageService.js';
import { ImageGenerationTool } from './tools/imageGeneration.js';

/**
 * Main MCP server for Azure OpenAI image generation
 */
class AzureImageMcpServer {
  private server: Server;
  private imageService: AzureImageService;
  private imageGenerationTool: ImageGenerationTool;
  private config: ReturnType<typeof loadConfig>;

  constructor() {
    // Load configuration
    this.config = loadConfig();

    // Initialize Azure Image Service
    this.imageService = new AzureImageService(
      this.config.azure,
      this.config.output.directory
    );

    // Initialize image generation tool
    this.imageGenerationTool = new ImageGenerationTool(this.imageService);

    // Create MCP server
    this.server = new Server(
      {
        name: 'azure-image-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  /**
   * Set up MCP protocol handlers
   */
  private setupHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: this.imageGenerationTool.name,
            description: this.imageGenerationTool.description,
            inputSchema: this.imageGenerationTool.inputSchema
          }
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === this.imageGenerationTool.name) {
        return await this.imageGenerationTool.execute(request.params.arguments);
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    logger.info('MCP server handlers configured');
  }

  /**
   * Start the server with stdio transport
   */
  async startStdio() {
    logger.info('Starting MCP server with stdio transport');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('Azure Image MCP Server running on stdio');
  }

  /**
   * Verify Azure credentials before starting
   */
  async verifySetup(): Promise<boolean> {
    logger.info('Verifying Azure setup...');

    try {
      const credentialsValid = await this.imageService.verifyCredentials();

      if (!credentialsValid) {
        logger.error('Azure credentials verification failed');
        return false;
      }

      logger.info('Azure setup verified successfully');
      return true;
    } catch (error) {
      logger.error('Setup verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    logger.info('Initializing Azure Image MCP Server...');

    const server = new AzureImageMcpServer();

    // Verify setup (optional - can be disabled for faster startup)
    const setupValid = await server.verifySetup();
    if (!setupValid) {
      logger.warn('Azure setup verification failed, but continuing anyway');
    }

    // Start server based on transport mode
    await server.startStdio();
  } catch (error) {
    logger.error('Fatal error in main()', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
