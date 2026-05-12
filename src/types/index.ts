/**
 * Configuration interface for the MCP server
 */
export interface ServerConfig {
  azure: AzureConfig;
  output: OutputConfig;
  transport: TransportConfig;
  logging: LoggingConfig;
}

/**
 * Azure OpenAI configuration
 */
export interface AzureConfig {
  endpoint: string;
  imageModel: string;
  imageFallbackModel?: string;
}

/**
 * Output configuration for generated images
 */
export interface OutputConfig {
  directory: string;
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  mode: 'stdio' | 'sse' | 'both';
  sse?: {
    port: number;
    host: string;
  };
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Image generation request parameters
 */
export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
  output_format?: string;
  output_compression?: string;
  background?: string;
  user?: string;
  model?: string;
}

/**
 * Image generation result
 */
export interface ImageGenerationResult {
  filePaths: string[];
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
  parameters: {
    model: string;
    size: string;
    quality: string;
    prompt: string;
  };
  metadata: ImageMetadata[];
  warnings?: string[];
}

/**
 * Image metadata stored in sidecar file
 */
export interface ImageMetadata {
  prompt: string;
  revisedPrompt?: string;
  model: string;
  size: string;
  quality: string;
  timestamp: string;
  requestId?: string;
  filename: string;
}

/**
 * Azure OpenAI API error response
 */
export interface AzureOpenAIError {
  error: {
    code: string;
    message: string;
    param?: string;
    type?: string;
  };
}
