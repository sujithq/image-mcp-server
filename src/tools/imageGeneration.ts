import { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { AzureImageService } from '../services/azureImageService.js';
import { ImageGenerationSchema, ImageGenerationInput } from '../schemas/imageSchemas.js';
import { ImageGenerationResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Image generation tool implementation
 */
export class ImageGenerationTool {
  private imageService: AzureImageService;

  constructor(imageService: AzureImageService) {
    this.imageService = imageService;
  }

  /**
   * Tool name
   */
  get name(): string {
    return 'generate_image';
  }

  /**
   * Tool description
   */
  get description(): string {
    return 'Generate images using Azure OpenAI DALL-E models. Supports text-to-image generation with customizable parameters including size, quality, and output format. Automatically handles model fallback for reliability.';
  }

  /**
   * Tool input schema
   */
  get inputSchema() {
    return {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Description of the image to generate',
          minLength: 1,
          maxLength: 4000
        },
        size: {
          type: 'string',
          enum: ['1024x1024', '1024x1792', '1792x1024'],
          description: 'Image dimensions (default: 1024x1024)'
        },
        quality: {
          type: 'string',
          enum: ['standard', 'hd', 'low', 'medium', 'high'],
          description: 'Image quality (default: standard). Accepted values: standard, hd, low, medium, high'
        },
        n: {
          type: 'integer',
          description: 'Number of images to generate (default: 1, max: 10)',
          minimum: 1,
          maximum: 10
        },
        output_format: {
          type: 'string',
          enum: ['png', 'jpeg', 'webp'],
          description: 'Output image format (default: png)'
        },
        output_compression: {
          type: 'string',
          enum: ['none', 'low', 'medium', 'high'],
          description: 'Output compression level (default: none)'
        },
        background: {
          type: 'string',
          description: 'Background color or style (e.g., "transparent", "white")'
        },
        user: {
          type: 'string',
          description: 'User identifier for tracking and rate limiting'
        },
        model: {
          type: 'string',
          enum: ['gpt-image-2', 'gpt-image-1.5'],
          description: 'Model to use (default: gpt-image-2)'
        }
      },
      required: ['prompt']
    };
  }

  /**
   * Validate tool input
   */
  private validateInput(args: unknown): ImageGenerationInput {
    try {
      return ImageGenerationSchema.parse(args);
    } catch (error) {
      logger.error('Input validation failed', { error: String(error) });
      throw new Error(`Invalid input: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  /**
   * Execute the tool
   */
  async execute(args: unknown): Promise<CallToolResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const input = this.validateInput(args);

      logger.info('Executing image generation tool', {
        promptLength: input.prompt.length,
        model: input.model,
        size: input.size,
        quality: input.quality
      });

      // Generate images
      const result = await this.imageService.generateImage({
        prompt: input.prompt,
        size: input.size,
        quality: input.quality,
        n: input.n,
        output_format: input.output_format,
        output_compression: input.output_compression,
        background: input.background,
        user: input.user,
        model: input.model
      });

      const latency = Date.now() - startTime;
      logger.info('Tool execution completed', { latency });

      // Format result for MCP
      return this.formatSuccess(result);
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Tool execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        latency
      });

      return this.formatError(error);
    }
  }

  /**
   * Format successful result
   */
  private formatSuccess(result: ImageGenerationResult): CallToolResult {
    const content: TextContent[] = [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        filePaths: result.filePaths,
        mimeType: result.mimeType,
        dimensions: result.dimensions,
        parameters: result.parameters,
        metadata: result.metadata,
        warnings: result.warnings
      }, null, 2)
    }];

    return { content };
  }

  /**
   * Format error result
   */
  private formatError(error: unknown): CallToolResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Provide actionable error messages
    let suggestion = '';
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('auth') || lowerMessage.includes('401') || lowerMessage.includes('403')) {
      suggestion = 'Check Azure credentials and ensure the signed-in user or managed identity has the Cognitive Services OpenAI User role.';
    } else if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
      suggestion = 'Rate limit exceeded. Please wait and try again. Consider implementing exponential backoff.';
    } else if (lowerMessage.includes('content_filter') || lowerMessage.includes('content policy')) {
      suggestion = 'The prompt was rejected by content filters. Please modify the prompt to comply with content policies.';
    } else if (lowerMessage.includes('quota')) {
      suggestion = 'Quota exceeded. Check your Azure OpenAI resource quota and usage.';
    } else if (lowerMessage.includes('timeout')) {
      suggestion = 'Request timed out. Please try again.';
    }

    const content: TextContent[] = [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: errorMessage,
        suggestion
      }, null, 2)
    }];

    return {
      content,
      isError: true
    };
  }
}
