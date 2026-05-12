import { jest } from '@jest/globals';

const ORIGINAL_ENV = process.env;

describe('logger LOG_LEVEL validation', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('falls back to info and logs a clear warning when LOG_LEVEL is invalid', async () => {
    process.env.LOG_LEVEL = 'verbose';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { logger } = await import('../../src/utils/logger');
    logger.info('test message');

    const messages = errorSpy.mock.calls.map(([message]) => String(message));
    expect(
      messages.some(message =>
        message.includes('Invalid LOG_LEVEL "verbose". Falling back to "info". Allowed values: debug, info, warn, error')
      )
    ).toBe(true);

    errorSpy.mockRestore();
  });
});
