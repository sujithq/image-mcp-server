import { jest } from '@jest/globals';

const ORIGINAL_ENV = process.env;

describe('loadConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws for invalid MCP_TRANSPORT_MODE', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com';
    process.env.MCP_TRANSPORT_MODE = 'invalid';

    const { loadConfig } = await import('../../src/utils/config');

    expect(() => loadConfig()).toThrow(
      'Invalid MCP_TRANSPORT_MODE "invalid". Allowed values: stdio, sse, both'
    );
  });

  it('throws for invalid LOG_LEVEL', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com';
    process.env.LOG_LEVEL = 'verbose';

    const { loadConfig } = await import('../../src/utils/config');

    expect(() => loadConfig()).toThrow(
      'Invalid LOG_LEVEL "verbose". Allowed values: debug, info, warn, error'
    );
  });

  it('loads valid values', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com';
    process.env.MCP_TRANSPORT_MODE = 'sse';
    process.env.LOG_LEVEL = 'warn';

    const { loadConfig } = await import('../../src/utils/config');
    const config = loadConfig();

    expect(config.transport.mode).toBe('sse');
    expect(config.logging.level).toBe('warn');
  });
});
