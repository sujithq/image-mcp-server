import { z } from 'zod';

/**
 * Input schema for image generation tool
 */
export const ImageGenerationSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(4000, 'Prompt exceeds maximum length of 4000 characters')
    .describe('Description of the image to generate'),

  size: z
    .enum(['1024x1024', '1024x1792', '1792x1024'])
    .optional()
    .describe('Image dimensions (default: 1024x1024)'),

  quality: z
    .enum(['standard', 'hd', 'low', 'medium', 'high'])
    .optional()
    .describe('Image quality (default: high)'),

  n: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe('Number of images to generate (default: 1, max: 10)'),

  output_format: z
    .enum(['png', 'jpeg', 'webp'])
    .optional()
    .describe('Output image format (default: png)'),

  output_compression: z
    .enum(['none', 'low', 'medium', 'high'])
    .optional()
    .describe('Output compression level (default: none)'),

  background: z
    .string()
    .optional()
    .describe('Background color or style (e.g., "transparent", "white")'),

  user: z
    .string()
    .optional()
    .describe('User identifier for tracking and rate limiting'),

  model: z
    .string()
    .min(1, 'Model or deployment name cannot be empty')
    .optional()
    .describe('Model or Azure OpenAI deployment name to use (default: gpt-image-2)')
});

export type ImageGenerationInput = z.infer<typeof ImageGenerationSchema>;

/**
 * Output schema for image generation tool
 */
export const ImageGenerationOutputSchema = z.object({
  filePaths: z.array(z.string()).describe('Paths to generated image files'),
  mimeType: z.string().describe('MIME type of generated images'),
  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }).describe('Image dimensions'),
  parameters: z.object({
    model: z.string(),
    size: z.string(),
    quality: z.string(),
    prompt: z.string()
  }).describe('Generation parameters used'),
  metadata: z.array(z.object({
    prompt: z.string(),
    revisedPrompt: z.string().optional(),
    model: z.string(),
    size: z.string(),
    quality: z.string(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    filename: z.string()
  })).describe('Metadata for each generated image'),
  warnings: z.array(z.string()).optional().describe('Any warnings or notices')
});

export type ImageGenerationOutput = z.infer<typeof ImageGenerationOutputSchema>;
