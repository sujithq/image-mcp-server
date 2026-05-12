import { jest } from '@jest/globals';
import { ImageGenerationTool } from '../../src/tools/imageGeneration';
import { AzureImageService } from '../../src/services/azureImageService';

describe('ImageGenerationTool input schema', () => {
  it('declares n as integer to match runtime validation', () => {
    const mockImageService = {
      generateImage: jest.fn()
    } as unknown as AzureImageService;

    const tool = new ImageGenerationTool(mockImageService);
    const nProperty = tool.inputSchema.properties.n as { type: string };

    expect(nProperty.type).toBe('integer');
  });
});
