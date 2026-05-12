import { config as dotenvConfig } from 'dotenv';
import { ServerConfig } from '../types/index.js';

// Load environment variables
dotenvConfig();

function parseTransportMode(mode?: string): 'stdio' | 'sse' | 'both' {
  const value = mode || 'stdio';

  if (value === 'stdio' || value === 'sse' || value === 'both') {
    return value;
  }

  throw new Error(
    `Invalid MCP_TRANSPORT_MODE "${value}". Allowed values: stdio, sse, both`
  );
}

function parseLogLevel(level?: string): 'debug' | 'info' | 'warn' | 'error' {
  const value = level || 'info';

  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }

  throw new Error(
    `Invalid LOG_LEVEL "${value}". Allowed values: debug, info, warn, error`
  );
}

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

  const transportMode = parseTransportMode(process.env.MCP_TRANSPORT_MODE);

  const ssePort = parseInt(process.env.SSE_PORT || '3000', 10);
  const sseHost = process.env.SSE_HOST || 'localhost';

  const logLevel = parseLogLevel(process.env.LOG_LEVEL);

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
