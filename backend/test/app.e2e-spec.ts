import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

const resultado = {
  contexto: 'Trecho de uma norma sobre dispensa.',
  fontes: [{ arquivo: 'norma.pdf', pagina: 3, curso: 'Ciência da Computação' }],
  distancia_minima: 0.2,
};
const consulta = {
  pergunta: 'Como solicitar dispensa?',
  curso: 'Ciência da Computação',
  perfil: 'novo',
  top_k: 3,
};

describe('AppController (HTTP com orquestração real)', () => {
  let app: INestApplication<App>;
  const fetchMock = vi.fn<typeof fetch>();

  function simularBusca(resultadoBusca: unknown) {
    fetchMock.mockImplementation(async (url) => {
      if (!(url instanceof URL)) throw new Error('URL esperada');
      if (url.pathname === '/api/v1/buscar')
        return Response.json(resultadoBusca);
      if (url.pathname === '/api/v1/gerar')
        return Response.json({ resposta: 'Resposta gerada.' });
      throw new Error('Endpoint inesperado');
    });
  }

  beforeEach(async () => {
    vi.stubEnv('AI_SERVICE_URL', 'http://busca.test:8000');
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', undefined);
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.8');
    fetchMock.mockReset();
    simularBusca(resultado);
    vi.stubGlobal('fetch', fetchMock);
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('/ (GET)', () =>
    request(app.getHttpServer()).get('/').expect(200).expect('Hello World!'));

  it('retorna contexto e fontes, preserva filtros e não envia dados pessoais', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/conversa')
      .send({ consulta, dados_email: { nome: 'Ana', matricula: '123' } })
      .expect(201)
      .expect({
        ...resultado,
        fallback_acionado: false,
        resposta: 'Resposta gerada.',
      });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('http://busca.test:8000/api/v1/buscar');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options!.body as string)).toEqual(consulta);
    const [gerarUrl, gerarInit] = fetchMock.mock.calls[1]!;
    expect((gerarUrl as URL).pathname).toBe('/api/v1/gerar');
    expect(JSON.parse(gerarInit!.body as string)).toEqual({
      pergunta: consulta.pergunta,
      contexto: resultado.contexto,
    });
  });

  it.each([
    [0.2, false],
    [0.8, true],
  ] as const)(
    'remove campos externos extras do HTTP com distância %s e fallback %s',
    async (distancia, fallback) => {
      simularBusca({
        ...resultado,
        distancia_minima: distancia,
        debug: { detalhe: 'metadado interno' },
        setor_sugerido: 'setor externo',
        template_email: 'template externo',
        fallback_acionado: !fallback,
        fontes: resultado.fontes.map((fonte) => ({
          ...fonte,
          caminho_interno: '/interno/norma.pdf',
          metadados: { detalhe: 'metadado interno' },
        })),
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({ consulta, dados_email: { nome: 'Ana', matricula: '123' } })
        .expect(201);

      expect(response.body).toEqual({
        ...resultado,
        distancia_minima: distancia,
        fallback_acionado: fallback,
        ...(fallback
          ? {
              setor_sugerido: 'SecGrad',
              template_email: expect.stringContaining('Ana, matrícula 123'),
            }
          : { resposta: 'Resposta gerada.' }),
      });
      expect(response.text).not.toContain('metadado interno');
      expect(response.text).not.toContain('/interno/norma.pdf');
      expect(response.text).not.toContain('template externo');
    },
  );

  it('aplica os padrões quando os filtros são omitidos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/conversa')
      .send({ consulta: { pergunta: 'Dispensa?' } })
      .expect(201);
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
      pergunta: 'Dispensa?',
      curso: 'Geral',
      perfil: 'Todos',
      top_k: 3,
    });
  });

  it.each([
    [0.8, 'Trecho normativo'],
    [1, 'Trecho normativo'],
    [0.1, ''],
    [0.1, '   '],
  ])(
    'gera fallback para distância %s e contexto %j',
    async (distancia, contexto) => {
      const busca = { ...resultado, contexto, distancia_minima: distancia };
      simularBusca(busca);
      const response = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({
          consulta,
          dados_email: {
            nome: 'Ana',
            matricula: '123',
            resumo: 'Preciso de orientação.',
          },
        })
        .expect(201);
      expect(response.body).toEqual({
        ...busca,
        fallback_acionado: true,
        setor_sugerido: 'SecGrad',
        template_email: expect.any(String),
      });
      expect(response.body.template_email).toContain('Ana, matrícula 123');
      expect(response.body.template_email).toContain(consulta.pergunta);
      expect(response.body.template_email).toContain('Preciso de orientação.');
      expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual(
        consulta,
      );
    },
  );

  it.each([
    {},
    { consulta: { pergunta: '' } },
    { consulta: { pergunta: '   ' } },
    { consulta: { ...consulta, curso: 123 } },
    { consulta: { ...consulta, perfil: [] } },
    { consulta: { ...consulta, top_k: 0 } },
    { consulta, dados_email: { nome: 123 } },
  ])(
    'rejeita entrada inválida sem consultar o serviço externo: %j',
    async (body) => {
      await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send(body)
        .expect(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      'HTTP externo',
      () => new Response('segredo interno', { status: 500 }),
      'Falha na resposta do serviço de busca.',
    ],
    [
      'JSON inválido',
      () => new Response('segredo interno'),
      'Resposta inválida do serviço de busca.',
    ],
    [
      'contrato inválido',
      () => Response.json({ contexto: 'segredo interno' }),
      'Resposta inválida do serviço de busca.',
    ],
  ] as const)(
    'retorna 502 para %s sem fallback ou detalhes internos',
    async (_caso, resposta, mensagem) => {
      fetchMock.mockResolvedValue(resposta());
      const response = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({ consulta })
        .expect(502);
      expect(response.body.message).toBe(mensagem);
      expect(response.body).not.toHaveProperty('fallback_acionado');
      expect(response.text).not.toContain('segredo');
    },
  );

  it('retorna 503 para falha de rede sem expor detalhes internos', async () => {
    fetchMock.mockRejectedValue(new Error('segredo interno ECONNREFUSED'));
    const response = await request(app.getHttpServer())
      .post('/api/v1/conversa')
      .send({ consulta })
      .expect(503);
    expect(response.body.message).toBe('Serviço de busca indisponível.');
    expect(response.body).not.toHaveProperty('fallback_acionado');
    expect(response.text).not.toContain('segredo');
  });

  it('retorna 503 quando AI_SERVICE_URL está ausente', async () => {
    vi.stubEnv('AI_SERVICE_URL', undefined);
    const response = await request(app.getHttpServer())
      .post('/api/v1/conversa')
      .send({ consulta })
      .expect(503);
    expect(response.body.message).toBe('Serviço de busca não configurado.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['0', '2147483648', 'segredo-interno'])(
    'retorna 503 seguro para timeout inválido %s',
    async (raw) => {
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', raw);
      const response = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({ consulta })
        .expect(503);
      expect(response.body.message).toBe(
        'Tempo limite do serviço de busca não configurado corretamente.',
      );
      expect(response.body).not.toHaveProperty('fallback_acionado');
      expect(response.body).not.toHaveProperty('template_email');
      expect(response.body.message).not.toContain(raw);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, '30000'])(
    'retorna 504 no timeout sem converter a falha em fallback (configuração %s)',
    async (configuredTimeout) => {
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', configuredTimeout);
      const controller = new AbortController();
      const timeout = vi
        .spyOn(AbortSignal, 'timeout')
        .mockReturnValue(controller.signal);
      fetchMock.mockImplementation(() => {
        controller.abort();
        return Promise.reject(
          new DOMException('segredo interno', 'TimeoutError'),
        );
      });
      const response = await request(app.getHttpServer())
        .post('/api/v1/conversa')
        .send({ consulta })
        .expect(504);
      expect(timeout).toHaveBeenCalledWith(Number(configuredTimeout ?? 5000));
      expect(response.body.message).toBe(
        'Tempo limite do serviço de busca excedido.',
      );
      expect(response.body).not.toHaveProperty('fallback_acionado');
      expect(response.text).not.toContain('segredo');
    },
  );
});
