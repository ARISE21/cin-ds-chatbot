import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { FallbackService } from '../../src/orchestration/fallback.service.js';

const detalheInterno = 'TOKEN_INTERNO_FICTICIO caminho=/interno/segredo';
const pessoal = { nome: 'Pessoa Teste Privada', matricula: 'MAT-PRIVADA-999', resumo: 'Resumo pessoal reservado' };
const consulta = { pergunta: 'Como solicitar orientação?', curso: 'SI', perfil: 'novo', top_k: 1 };
const recuperado = { contexto: 'X', distancia_minima: 0.1, fontes: [{ arquivo: 'norma.pdf', pagina: 1, curso: 'SI' }] };
let app: INestApplication;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let gerarEmail: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.8');
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modulo.createNestApplication({ logger: false });
  await app.init();
});

beforeEach(() => {
  vi.stubEnv('AI_SERVICE_URL', 'http://busca.invalid');
  vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '5000');
  fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(recuperado));
  vi.stubGlobal('fetch', fetchMock);
  gerarEmail = vi.spyOn(app.get(FallbackService), 'gerarEmail');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
afterAll(async () => { await app?.close(); });

function esperarErro(body: unknown, status: number, message: string, error: string) {
  expect(body).toEqual({ statusCode: status, message, error });
  const texto = JSON.stringify(body);
  for (const sensivel of [detalheInterno, pessoal.nome, pessoal.matricula, pessoal.resumo, 'stack', 'busca.invalid']) {
    expect(texto).not.toContain(sensivel);
  }
  expect(body).not.toHaveProperty('fallback_acionado');
  expect(body).not.toHaveProperty('template_email');
  expect(body).not.toHaveProperty('setor_sugerido');
  expect(gerarEmail).not.toHaveBeenCalled();
}

function esperarRascunho(body: Record<string, unknown>, pergunta: string, setor = 'SecGrad') {
  expect(body.fallback_acionado).toBe(true);
  expect(body.setor_sugerido).toBe(setor);
  expect(body.template_email).toEqual(expect.any(String));
  for (const trecho of ['Assunto: ', 'Olá,', 'Meu nome é ', 'matrícula ', 'perfil curricular ', 'Resumo da situação:', `Minha dúvida é:\n${pergunta}`, `Setor sugerido:\n${setor}`, 'Atenciosamente,']) {
    expect(body.template_email).toContain(trecho);
  }
  expect(body.template_email).not.toMatch(/undefined|null/);
}

describe('US-02 e US-03 — contrato HTTP com AiService real e transporte simulado', () => {
  it.each([
    ['CT-02.01', 0.7999, false],
    ['CT-02.02', 0.8, true],
    ['CT-02.03', 0.8001, true],
  ])('%s: usa o limite literal %s e preserva as fontes', async (_id, distancia, fallback) => {
    const resultado = { ...recuperado, distancia_minima: distancia };
    fetchMock.mockResolvedValue(Response.json(resultado));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(201);
    if (fallback) {
      expect(body).toMatchObject({ ...resultado, fallback_acionado: true });
      esperarRascunho(body, consulta.pergunta);
      expect(gerarEmail).toHaveBeenCalledTimes(1);
    } else {
      expect(body).toEqual({ ...resultado, fallback_acionado: false });
      expect(gerarEmail).not.toHaveBeenCalled();
    }
  });

  it.each(['', ' ', '\n\t'])('CT-02.04: contexto %j com distância literal 0.1 entrega rascunho', async (contexto) => {
    fetchMock.mockResolvedValue(Response.json({ ...recuperado, contexto }));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(201);
    expect(body).toMatchObject({ ...recuperado, contexto });
    esperarRascunho(body, consulta.pergunta);
    expect(body.template_email).toContain(pessoal.nome);
    expect(body.template_email).toContain(pessoal.matricula);
    expect(body.template_email).toContain(pessoal.resumo);
  });

  it('CT-02.05: falha de transporte retorna 503 seguro sem fallback', async () => {
    fetchMock.mockRejectedValue(new Error(detalheInterno));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(503);
    esperarErro(body, 503, 'Serviço de busca indisponível.', 'Service Unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['fetch', 'leitura do JSON'])('CT-02.06: timeout real durante %s retorna 504 seguro', async (fase) => {
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '15');
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(async (_url, init) => {
      signal = init?.signal as AbortSignal;
      const aguardarAbort = () => new Promise<never>((_resolve, reject) => {
        signal!.addEventListener('abort', () => reject(new Error(detalheInterno)), { once: true });
      });
      if (fase === 'fetch') return aguardarAbort();
      return { ok: true, json: aguardarAbort } as unknown as Response;
    });
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(504);
    expect(signal?.aborted).toBe(true);
    esperarErro(body, 504, 'Tempo limite do serviço de busca excedido.', 'Gateway Timeout');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('CT-02.07: JSON textual malformado retorna 502 seguro', async () => {
    fetchMock.mockResolvedValue(new Response(`{${detalheInterno}`));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(502);
    esperarErro(body, 502, 'Resposta inválida do serviço de busca.', 'Bad Gateway');
  });

  it.each([
    ['campo contexto ausente', { distancia_minima: 0.1, fontes: [] }],
    ['distância textual', { ...recuperado, distancia_minima: '0.1' }],
    ['fontes ausentes', { contexto: 'X', distancia_minima: 0.1 }],
    ['página zero', { ...recuperado, fontes: [{ ...recuperado.fontes[0], pagina: 0 }] }],
  ])('CT-02.07: contrato com %s retorna 502 seguro', async (_caso, resultado) => {
    fetchMock.mockResolvedValue(Response.json({ ...resultado, detalhe: detalheInterno }));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(502);
    esperarErro(body, 502, 'Resposta inválida do serviço de busca.', 'Bad Gateway');
  });

  it.each([NaN, Infinity, -Infinity])('CT-02.07: distância não finita %s no objeto decodificado retorna 502', async (distancia) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...recuperado, distancia_minima: distancia, detalhe: detalheInterno }) } as Response);
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(502);
    esperarErro(body, 502, 'Resposta inválida do serviço de busca.', 'Bad Gateway');
  });

  it('CA-02.4: HTTP upstream inválido não expõe corpo interno', async () => {
    fetchMock.mockResolvedValue(new Response(detalheInterno, { status: 500 }));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: pessoal }).expect(502);
    esperarErro(body, 502, 'Falha na resposta do serviço de busca.', 'Bad Gateway');
  });

  it.each([
    ['CT-03.01', 'estágio', 'SecGrad'],
    ['CA-03.1', 'requerimento', 'SecGrad'],
    ['CT-03.02', 'dispensa', 'SecGrad'],
    ['CA-03.1', 'segunda chamada', 'SecGrad'],
    ['CT-03.03', 'pedagógico', 'NEAP'],
    ['CT-03.04', 'pós-graduação', 'Secretaria de Pós-Graduação'],
    ['CT-03.05', 'declaração', 'SecGrad'],
  ])('%s: assunto %s entrega setor %s no HTTP', async (_id, assunto, setor) => {
    fetchMock.mockResolvedValue(Response.json({ ...recuperado, distancia_minima: 0.8 }));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: { ...pessoal, assunto } }).expect(201);
    esperarRascunho(body, consulta.pergunta, setor);
    expect(body.template_email).toContain(`Assunto: ${assunto}\n`);
  });

  it('CT-03.06: fallback sem dados opcionais entrega os cinco marcadores no HTTP', async () => {
    fetchMock.mockResolvedValue(Response.json({ contexto: '', distancia_minima: 0.1, fontes: [] }));
    const pergunta = 'Como solicitar declaração?';
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta: { pergunta } }).expect(201);
    expect(body).toEqual({
      contexto: '', distancia_minima: 0.1, fontes: [], fallback_acionado: true, setor_sugerido: 'SecGrad',
      template_email: `Assunto: Como solicitar declaração?

Olá,

Meu nome é [Nome], matrícula [Matrícula], aluno(a) do curso de [Curso], perfil curricular [Perfil curricular].

Estou entrando em contato sobre: Como solicitar declaração?.

Resumo da situação:
[Resumo da situação]

Minha dúvida é:
Como solicitar declaração?

Setor sugerido:
SecGrad

Atenciosamente,
[Nome]`,
    });
    expect(body.template_email).not.toMatch(/undefined|null/);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://busca.invalid/api/v1/buscar');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' });
    expect(JSON.parse(init!.body as string)).toEqual({ pergunta, curso: 'Geral', perfil: 'Todos', top_k: 3 });
  });

  it('CT-03.07: preserva textos no rascunho e envia somente consulta à busca', async () => {
    fetchMock.mockResolvedValue(Response.json({ ...recuperado, distancia_minima: 0.8, detalhe: detalheInterno, fontes: [{ ...recuperado.fontes[0], detalhe: detalheInterno }] }));
    const dados_email = { ...pessoal, assunto: 'Apoio pedagógico' };
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email }).expect(201);
    esperarRascunho(body, consulta.pergunta, 'NEAP');
    for (const texto of [...Object.values(dados_email), consulta.curso, consulta.perfil]) expect(body.template_email).toContain(texto);
    expect(body.fontes).toEqual(recuperado.fontes);
    expect(JSON.stringify(body)).not.toContain(detalheInterno);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1]!;
    expect(JSON.parse(init.body as string)).toEqual(consulta);
    for (const dado of Object.values(dados_email)) expect(init.body).not.toContain(dado);
  });

  it.each(['nome', 'matricula', 'assunto', 'resumo'])('CA-03.6: tipos inválidos em %s retornam HTTP 400 seguro', async (campo) => {
    for (const valor of [null, 123, false, [], {}]) {
      const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email: { ...pessoal, [campo]: valor } }).expect(400);
      esperarErro(body, 400, 'Dados para o e-mail de fallback inválidos.', 'Bad Request');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([null, []])('CA-03.6: estrutura de dados_email %j retorna HTTP 400', async (dados_email) => {
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta, dados_email }).expect(400);
    esperarErro(body, 400, 'Dados para o e-mail de fallback inválidos.', 'Bad Request');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limite útil 1: pergunta e contexto de um caractere preservam resposta sem fallback', async () => {
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta: { pergunta: 'P' } }).expect(201);
    expect(body).toEqual({ ...recuperado, fallback_acionado: false });
    expect(gerarEmail).not.toHaveBeenCalled();
  });

  it('limite útil 1: campos textuais mínimos aparecem no rascunho', async () => {
    fetchMock.mockResolvedValue(Response.json({ ...recuperado, distancia_minima: 0.8 }));
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send({ consulta: { pergunta: 'P', curso: 'C', perfil: 'F' }, dados_email: { nome: 'N', matricula: 'M', assunto: 'A', resumo: 'R' } }).expect(201);
    esperarRascunho(body, 'P');
    for (const trecho of ['Assunto: A\n', 'Meu nome é N, matrícula M', 'curso de C, perfil curricular F', 'Resumo da situação:\nR']) expect(body.template_email).toContain(trecho);
  });

  it.each(['nome', 'matricula', 'curso', 'perfil', 'resumo'])('CA-03.5: ausência individual de %s usa marcador e preserva os demais textos', async (campo) => {
    fetchMock.mockResolvedValue(Response.json({ ...recuperado, distancia_minima: 0.8 }));
    const entrada = { consulta: { ...consulta }, dados_email: { ...pessoal } };
    const marcadores = { nome: '[Nome]', matricula: '[Matrícula]', curso: '[Curso]', perfil: '[Perfil curricular]', resumo: '[Resumo da situação]' };
    if (campo === 'curso' || campo === 'perfil') delete (entrada.consulta as Record<string, unknown>)[campo];
    else delete (entrada.dados_email as Record<string, unknown>)[campo];
    const { body } = await request(app.getHttpServer()).post('/api/v1/conversa').send(entrada).expect(201);
    esperarRascunho(body, consulta.pergunta);
    expect(body.template_email).toContain(marcadores[campo as keyof typeof marcadores]);
    for (const texto of [...Object.values(entrada.dados_email), entrada.consulta.curso, entrada.consulta.perfil].filter(Boolean)) expect(body.template_email).toContain(texto);
  });
});
