import { config as dotenvConfig } from 'dotenv';
import { ServerConfig } from '../types/index.js';

// Load environment variables
dotenvConfig();

/**
 * Load and validate server configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!endpoint) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is required');
  }

  const imageModel = process.env.AZURE_OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const imageFallbackModel = process.env.AZURE_OPENAI_IMAGE_FALLBACK_MODEL;

  const outputDir = process.env.IMAGE_OUTPUT_DIR || './output/images';

  const transportMode = (process.env.MCP_TRANSPORT_MODE || 'stdio') as 'stdio' | 'sse' | 'both';

  const ssePort = parseInt(process.env.SSE_PORT || '3000', 10);
  const sseHost = process.env.SSE_HOST || 'localhost';

  const logLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

  return {
    azure: {
      endpoint,
      imageModel,
      imageFallbackModel
    },
    output: {
      directory: outputDir
    },
    transport: {
      mode: transportMode,
      sse: {
        port: ssePort,
        host: sseHost
      }
    },
    logging: {
      level: logLevel
    }
  };
}
