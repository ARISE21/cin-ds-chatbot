import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../src/ai-service/ai-service.service.js';
import { AppModule } from '../src/app.module.js';

const mockUrl = process.env.SECGRAD_LIVE_AI_SERVICE_URL;
const disabledUrl = process.env.SECGRAD_LIVE_AI_DISABLED_URL;
const recuperado = {
  contexto: 'Trecho de teste controlado.',
  distancia_minima: 0.2,
  fontes: [{ arquivo: 'fixture.pdf', pagina: 1, curso: 'SI' }],
};
let app: INestApplication | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe.skipIf(!mockUrl)(
  'NestJS → FastAPI real, geração mock e busca controlada',
  () => {
    it('entrega o aviso explícito de simulação e preserva as fontes controladas', async () => {
      vi.stubEnv('AI_SERVICE_URL', mockUrl);
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '5000');
      vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.8');
      const modulo = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      vi.spyOn(modulo.get(AiService), 'buscarContexto').mockResolvedValue(
        recuperado,
      );
      app = modulo.createNestApplication({ logger: false });
      await app.init();
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({ consulta: { pergunta: 'Dúvida de teste' } })
        .expect(201);
      expect(body).toEqual({
        ...recuperado,
        fallback_acionado: false,
        resposta: '[SIMULAÇÃO DE INTEGRAÇÃO — NÃO É RESPOSTA ACADÊMICA]',
      });
      const response = await fetch(new URL('/api/v1/gerar', mockUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: 'P', contexto: '' }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ resposta: null });
    });

    it.skipIf(!disabledUrl)(
      'modo real desabilitado retorna 503 seguro no NestJS',
      async () => {
        vi.stubEnv('AI_SERVICE_URL', disabledUrl);
        vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '5000');
        const modulo = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
        vi.spyOn(modulo.get(AiService), 'buscarContexto').mockResolvedValue(
          recuperado,
        );
        app = modulo.createNestApplication({ logger: false });
        await app.init();
        const { body } = await request(app.getHttpServer())
          .post('/api/v1/conversa')
          .send({ consulta: { pergunta: 'Dúvida de teste' } })
          .expect(503);
        expect(body).toEqual({
          statusCode: 503,
          message: 'Serviço de geração indisponível.',
          error: 'Service Unavailable',
        });
      },
    );
  },
);
