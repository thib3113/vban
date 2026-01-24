import { describe, expect, it } from '@jest/globals';
import { Buffer } from 'node:buffer';
import { bufferToHex } from '../src/commons.js';

describe('bufferToHex', () => {
    it('should return empty string for empty buffer', () => {
        expect(bufferToHex(Buffer.alloc(0))).toBe('');
    });

    it('should format single byte correctly', () => {
        expect(bufferToHex(Buffer.from([0]))).toBe('00');
        expect(bufferToHex(Buffer.from([255]))).toBe('FF');
        expect(bufferToHex(Buffer.from([10]))).toBe('0A');
    });

    it('should format multiple bytes with spaces', () => {
        expect(bufferToHex(Buffer.from([0, 1, 255]))).toBe('00 01 FF');
    });

    it('should handle non-buffer input by throwing TypeError', () => {
        // @ts-expect-error Testing invalid input
        expect(() => bufferToHex('not a buffer')).toThrow('need to be a buffer');
    });

    it('should handle large buffer correctly', () => {
        const buffer = Buffer.alloc(3).fill(0xAB);
        expect(bufferToHex(buffer)).toBe('AB AB AB');
    });
});
