import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFallbackDistanceThreshold } from '../../src/orchestration/fallback.config.js';

afterEach(() => vi.unstubAllEnvs());

describe('US-02 — configuração do limite de distância', () => {
  it('usa o limite provisório 0.8 quando a variável está ausente', () => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', undefined);
    expect(readFallbackDistanceThreshold()).toBe(0.8);
  });

  it.each([
    ['0', 0], ['0.8', 0.8], [' 1.5 ', 1.5], ['.5', 0.5],
    ['1.', 1], ['2e-1', 0.2], ['2E+1', 20],
  ])('aceita limite decimal finito não negativo %s', (raw, esperado) => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', raw);
    expect(readFallbackDistanceThreshold()).toBe(esperado);
  });

  it.each(['', ' ', '-1', '-0', 'NaN', 'Infinity', '1e309', '0x10', 'abc', '1,2', '+1'])('rejeita configuração inválida %j', (raw) => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', raw);
    expect(() => readFallbackDistanceThreshold()).toThrow('FALLBACK_DISTANCE_THRESHOLD deve ser um número decimal finito não negativo.');
  });
});
