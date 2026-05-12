import { ImageGenerationTool } from '../../src/tools/imageGeneration';

describe('ImageGenerationTool input schema', () => {
  it('declares n as integer to match runtime validation', () => {
    const tool = new ImageGenerationTool({} as never);
    const nProperty = tool.inputSchema.properties.n as { type: string };

    expect(nProperty.type).toBe('integer');
  });
});
