import { ImageGenerationSchema } from '../../src/schemas/imageSchemas';

describe('ImageGenerationSchema', () => {
  describe('valid inputs', () => {
    it('should accept minimal valid input', () => {
      const input = {
        prompt: 'A beautiful sunset'
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept full valid input', () => {
      const input = {
        prompt: 'A beautiful sunset over mountains',
        size: '1024x1024',
        quality: 'hd',
        n: 1,
        output_format: 'png',
        output_compression: 'none',
        background: 'transparent',
        user: 'user123',
        model: 'gpt-image-2'
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept different size options', () => {
      const sizes = ['1024x1024', '1024x1792', '1792x1024'];

      sizes.forEach(size => {
        const result = ImageGenerationSchema.safeParse({
          prompt: 'Test',
          size
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept different quality options', () => {
      const qualities = ['standard', 'hd'];

      qualities.forEach(quality => {
        const result = ImageGenerationSchema.safeParse({
          prompt: 'Test',
          quality
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid n values', () => {
      for (let n = 1; n <= 10; n++) {
        const result = ImageGenerationSchema.safeParse({
          prompt: 'Test',
          n
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty prompt', () => {
      const input = {
        prompt: ''
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject missing prompt', () => {
      const input = {};

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject prompt that is too long', () => {
      const input = {
        prompt: 'a'.repeat(4001)
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid size', () => {
      const input = {
        prompt: 'Test',
        size: '512x512'
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid quality', () => {
      const input = {
        prompt: 'Test',
        quality: 'ultra'
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject n less than 1', () => {
      const input = {
        prompt: 'Test',
        n: 0
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject n greater than 10', () => {
      const input = {
        prompt: 'Test',
        n: 11
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer n', () => {
      const input = {
        prompt: 'Test',
        n: 1.5
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty model', () => {
      const input = {
        prompt: 'Test',
        model: ''
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid output_format', () => {
      const input = {
        prompt: 'Test',
        output_format: 'gif'
      };

      const result = ImageGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
