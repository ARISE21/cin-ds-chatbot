import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AiService } from '../src/ai-service/ai-service.service.js';
import { OrchestrationService } from '../src/orchestration/orchestration.service.js';
import { FallbackService } from '../src/orchestration/fallback.service.js';

const consulta = {
  pergunta: 'Como solicitar dispensa?',
  curso: 'SI',
  perfil: 'novo',
  top_k: 1,
};
const pessoal = {
  nome: 'Pessoa Fictícia',
  matricula: 'MAT-FICTICIA',
  resumo: 'Resumo reservado',
};
const recuperado = {
  contexto: 'Trecho oficial.',
  distancia_minima: 0.2,
  fontes: [{ arquivo: 'norma.pdf', pagina: 1, curso: 'SI' }],
};
const interno = 'PROMPT_PRIVADO_FICTICIO credencial-ficticia /interno/modelo';
let app: INestApplication;
let busca: typeof recuperado;
let gerar: () => Promise<Response>;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let gerarEmail: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.8');
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = module.createNestApplication({ logger: false });
  await app.init();
});
beforeEach(() => {
  vi.stubEnv('AI_SERVICE_URL', 'http://ia.test:8000');
  vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '5000');
  busca = structuredClone(recuperado);
  gerar = async () =>
    Response.json({ resposta: 'Resposta baseada no trecho oficial.' });
  fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    if (!(url instanceof URL)) throw new Error('URL esperada');
    if (url.pathname === '/api/v1/buscar') return Response.json(busca);
    if (url.pathname === '/api/v1/gerar') return gerar();
    throw new Error('Endpoint inesperado');
  });
  vi.stubGlobal('fetch', fetchMock);
  gerarEmail = vi.spyOn(app.get(FallbackService), 'gerarEmail');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
afterAll(async () => {
  await app?.close();
});

function postar() {
  return request(app.getHttpServer())
    .post('/api/v1/conversa')
    .send({ consulta, dados_email: pessoal });
}
function esperarFallback(body: Record<string, unknown>) {
  expect(body).toMatchObject({
    ...busca,
    fallback_acionado: true,
    setor_sugerido: 'SecGrad',
  });
  expect(body).not.toHaveProperty('resposta');
  for (const texto of [
    pessoal.nome,
    pessoal.matricula,
    pessoal.resumo,
    consulta.pergunta,
  ])
    expect(body.template_email).toContain(texto);
  expect(gerarEmail).toHaveBeenCalledTimes(1);
}
function esperarErro(
  body: unknown,
  status: number,
  message: string,
  error: string,
) {
  expect(body).toEqual({ statusCode: status, message, error });
  for (const texto of [
    interno,
    ...Object.values(pessoal),
    consulta.pergunta,
    recuperado.contexto,
    'stack',
  ])
    expect(JSON.stringify(body)).not.toContain(texto);
  expect(body).not.toHaveProperty('fallback_acionado');
  expect(body).not.toHaveProperty('template_email');
  expect(gerarEmail).not.toHaveBeenCalled();
}

describe('Conversa com busca e geração — contrato novo', () => {
  it('retorna resposta e mantém todos os campos/fontes da busca, sem enviar dados pessoais à IA', async () => {
    gerar = async () =>
      Response.json({
        resposta: 'Resposta baseada no trecho oficial.',
        fontes: [{ arquivo: 'inventado.pdf' }],
        prompt: interno,
      });
    const { body } = await postar().expect(201);
    expect(body).toEqual({
      ...recuperado,
      fallback_acionado: false,
      resposta: 'Resposta baseada no trecho oficial.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [[buscarUrl, buscarInit], [gerarUrl, gerarInit]] =
      fetchMock.mock.calls;
    expect((buscarUrl as URL).pathname).toBe('/api/v1/buscar');
    expect((gerarUrl as URL).pathname).toBe('/api/v1/gerar');
    expect(JSON.parse(buscarInit!.body as string)).toEqual(consulta);
    expect(JSON.parse(gerarInit!.body as string)).toEqual({
      pergunta: consulta.pergunta,
      contexto: recuperado.contexto,
    });
    for (const texto of Object.values(pessoal))
      expect(gerarInit!.body).not.toContain(texto);
    expect(gerarEmail).not.toHaveBeenCalled();
  });

  it('conserva explicitamente a identificação do modo mock', async () => {
    const resposta = '[SIMULAÇÃO DE INTEGRAÇÃO — NÃO É RESPOSTA ACADÊMICA]';
    gerar = async () => Response.json({ resposta });
    const { body } = await postar().expect(201);
    expect(body).toEqual({ ...recuperado, fallback_acionado: false, resposta });
  });

  it.each([null, '', ' \n'])(
    'resposta de geração %j aciona fallback com e-mail',
    async (resposta) => {
      gerar = async () => Response.json({ resposta });
      const { body } = await postar().expect(201);
      esperarFallback(body);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['', ' \n'])('contexto %j não chama geração', async (contexto) => {
    busca.contexto = contexto;
    esperarFallback((await postar().expect(201)).body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fontes vazias não chamam geração mesmo com contexto e distância adequados', async () => {
    busca.fontes = [];
    esperarFallback((await postar().expect(201)).body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([0.7999, 0.8, 0.8001])(
    'respeita distância literal %s',
    async (distancia) => {
      busca.distancia_minima = distancia;
      const { body } = await postar().expect(201);
      if (distancia < 0.8) {
        expect(body).toEqual({
          ...busca,
          fallback_acionado: false,
          resposta: 'Resposta baseada no trecho oficial.',
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } else {
        esperarFallback(body);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('usa o limiar injetado em vez de fixar 0.8', async () => {
    const service = new OrchestrationService(
      app.get(AiService),
      app.get(FallbackService),
      0.3,
    );
    busca.distancia_minima = 0.3;
    esperarFallback(
      await service.processar({ consulta, dados_email: pessoal }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mantém marcadores quando não há dados opcionais e a geração retorna null', async () => {
    gerar = async () => Response.json({ resposta: null });
    const { body } = await request(app.getHttpServer())
      .post('/api/v1/conversa')
      .send({ consulta: { pergunta: 'P' } })
      .expect(201);
    for (const marcador of [
      '[Nome]',
      '[Matrícula]',
      '[Curso]',
      '[Perfil curricular]',
      '[Resumo da situação]',
    ])
      expect(body.template_email).toContain(marcador);
    expect(body.template_email).not.toMatch(/undefined|null/);
  });

  it.each([503, 504, 500])(
    'falha HTTP de geração %s retorna erro seguro sem fallback',
    async (status) => {
      gerar = async () => new Response(interno, { status });
      const expected = status === 500 ? 502 : status;
      const { body } = await postar().expect(expected);
      const message =
        status === 503
          ? 'Serviço de geração indisponível.'
          : status === 504
            ? 'Tempo limite do serviço de geração excedido.'
            : 'Falha na resposta do serviço de geração.';
      esperarErro(
        body,
        expected,
        message,
        status === 503
          ? 'Service Unavailable'
          : status === 504
            ? 'Gateway Timeout'
            : 'Bad Gateway',
      );
    },
  );

  it('falha de rede da geração retorna 503 sem detalhes internos', async () => {
    gerar = async () => {
      throw new Error(interno);
    };
    esperarErro(
      (await postar().expect(503)).body,
      503,
      'Serviço de geração indisponível.',
      'Service Unavailable',
    );
  });

  it('timeout real da geração retorna 504 seguro', async () => {
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '15');
    const original = fetchMock.getMockImplementation()!;
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(async (url, init) => {
      if ((url as URL).pathname === '/api/v1/buscar')
        return original(url, init);
      signal = init?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) =>
        signal!.addEventListener('abort', () => reject(new Error(interno)), {
          once: true,
        }),
      );
    });
    esperarErro(
      (await postar().expect(504)).body,
      504,
      'Tempo limite do serviço de geração excedido.',
      'Gateway Timeout',
    );
    expect(signal?.aborted).toBe(true);
  });

  it.each([{}, { resposta: 42 }, { resposta: false }, { resposta: [] }])(
    'geração incompatível %j retorna 502',
    async (result) => {
      gerar = async () => Response.json({ ...result, prompt: interno });
      esperarErro(
        (await postar().expect(502)).body,
        502,
        'Resposta inválida do serviço de geração.',
        'Bad Gateway',
      );
    },
  );

  it('JSON de geração inválido retorna 502', async () => {
    gerar = async () => new Response(interno);
    esperarErro(
      (await postar().expect(502)).body,
      502,
      'Resposta inválida do serviço de geração.',
      'Bad Gateway',
    );
  });
});
