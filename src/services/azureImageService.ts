import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { AzureOpenAI } from 'openai';
import '@azure/openai/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { AzureConfig, ImageGenerationRequest, ImageGenerationResult, ImageMetadata } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Service for generating images using Azure OpenAI
 */
export class AzureImageService {
  private client: AzureOpenAI;
  private config: AzureConfig;
  private outputDir: string;

  constructor(config: AzureConfig, outputDir: string) {
    this.config = config;
    this.outputDir = outputDir;

    // Initialize Azure OpenAI client with DefaultAzureCredential (keyless auth)
    const credential = new DefaultAzureCredential();
    const scope = 'https://cognitiveservices.azure.com/.default';
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);

    this.client = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: '2024-10-21',
      endpoint: config.endpoint
    });

    logger.info('Azure Image Service initialized', {
      endpoint: config.endpoint,
      primaryModel: config.imageModel,
      fallbackModel: config.imageFallbackModel
    });
  }

  /**
   * Generate images based on the request parameters
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const model = request.model || this.config.imageModel;

    logger.info('Starting image generation', {
      model,
      promptLength: request.prompt.length,
      size: request.size,
      quality: request.quality,
      n: request.n
    });

    try {
      const result = await this.generateWithModel(request, model);

      const latency = Date.now() - startTime;
      logger.info('Image generation completed', {
        model,
        latency,
        imageCount: result.filePaths.length
      });

      return result;
    } catch (error) {
      // Try fallback model if configured and not already using it
      if (this.config.imageFallbackModel && model !== this.config.imageFallbackModel) {
        logger.warn('Primary model failed, attempting fallback', {
          primaryModel: model,
          fallbackModel: this.config.imageFallbackModel,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        try {
          const result = await this.generateWithModel(request, this.config.imageFallbackModel);

          const latency = Date.now() - startTime;
          logger.info('Image generation completed with fallback model', {
            model: this.config.imageFallbackModel,
            latency,
            imageCount: result.filePaths.length
          });

          result.warnings = result.warnings || [];
          result.warnings.push(`Used fallback model ${this.config.imageFallbackModel} due to primary model failure`);

          return result;
        } catch (fallbackError) {
          logger.error('Fallback model also failed', {
            fallbackModel: this.config.imageFallbackModel,
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Generate images with a specific model
   */
  private async generateWithModel(
    request: ImageGenerationRequest,
    model: string
  ): Promise<ImageGenerationResult> {
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const n = request.n || 1;

    try {
      // Call Azure OpenAI image generation endpoint
      const response = await this.client.images.generate({
        model,
        prompt: request.prompt,
        n,
        size: size as '1024x1024' | '1024x1792' | '1792x1024',
        quality: quality as 'standard' | 'hd',
        user: request.user,
        response_format: 'b64_json'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No images returned from Azure OpenAI');
      }

      // Parse dimensions from size string
      const [width, height] = size.split('x').map(Number);

      // Save images and create metadata
      const filePaths: string[] = [];
      const metadataList: ImageMetadata[] = [];

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      for (let i = 0; i < response.data.length; i++) {
        const imageData = response.data[i];

        if (!imageData.b64_json) {
          logger.warn('Image data missing base64 content', { index: i });
          continue;
        }

        // Generate deterministic filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `image-${timestamp}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        // Decode base64 and write to file
        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        await writeFile(filepath, imageBuffer);

        filePaths.push(filepath);

        // Create metadata
        const metadata: ImageMetadata = {
          prompt: request.prompt,
          revisedPrompt: imageData.revised_prompt,
          model,
          size,
          quality,
          timestamp: new Date().toISOString(),
          filename
        };

        metadataList.push(metadata);

        // Write metadata sidecar file
        const metadataPath = filepath.replace('.png', '.json');
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

        logger.debug('Image saved', { filepath, metadataPath });
      }

      return {
        filePaths,
        mimeType: 'image/png',
        dimensions: { width, height },
        parameters: {
          model,
          size,
          quality,
          prompt: request.prompt
        },
        metadata: metadataList
      };
    } catch (error) {
      this.handleAzureError(error);
      throw error;
    }
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
      logger.debug('Created output directory', { path: this.outputDir });
    }
  }

  /**
   * Handle Azure OpenAI specific errors with proper logging
   */
  private handleAzureError(error: unknown): void {
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Authentication errors
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
        logger.error('Authentication failed', {
          error: errorMessage,
          suggestion: 'Check Azure credentials and role assignments'
        });
        return;
      }

      // Rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        logger.error('Rate limit exceeded', {
          error: errorMessage,
          suggestion: 'Retry with exponential backoff'
        });
        return;
      }

      // Content filter errors
      if (errorMessage.includes('content_filter') || errorMessage.includes('content policy')) {
        logger.error('Content filter rejection', {
          error: errorMessage,
          suggestion: 'Modify prompt to comply with content policy'
        });
        return;
      }

      // Quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
        logger.error('Quota exceeded', {
          error: errorMessage,
          suggestion: 'Check Azure OpenAI quota limits'
        });
        return;
      }

      // Timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        logger.error('Request timeout', {
          error: errorMessage,
          suggestion: 'Retry the request'
        });
        return;
      }

      // Generic error
      logger.error('Azure OpenAI error', { error: errorMessage });
    } else {
      logger.error('Unknown error', { error: String(error) });
    }
  }

  /**
   * Verify Azure credentials and connectivity
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      logger.info('Verifying Azure credentials...');

      // Attempt a simple operation to verify credentials
      const credential = new DefaultAzureCredential();
      const scope = 'https://cognitiveservices.azure.com/.default';
      const token = await credential.getToken(scope);

      if (token) {
        logger.info('Azure credentials verified successfully');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Credential verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}
