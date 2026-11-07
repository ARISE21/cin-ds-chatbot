import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { AiService } from '../src/ai-service/ai-service.service.js';
import { OrchestrationService } from '../src/orchestration/orchestration.service.js';

describe('AiService (HTTP integration)', () => {
  let upstream: Server;
  let module: TestingModule;
  let received: { method?: string; url?: string; body: unknown };
  let distancia: number;
  let contexto: string;
  let status: number;
  let fontes: { arquivo: string; pagina: number; curso: string }[];
  let chamadas: (typeof received)[];

  beforeEach(async () => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.8');
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', undefined);
    distancia = 1;
    contexto = '';
    status = 200;
    fontes = [];
    chamadas = [];
    upstream = createServer((req, res) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => {
        body += chunk;
      });
      req.on('end', () => {
        received = {
          method: req.method,
          url: req.url,
          body: JSON.parse(body) as unknown,
        };
        chamadas.push(received);
        if (req.url !== '/api/v1/buscar' && req.url !== '/api/v1/gerar') {
          res.writeHead(404).end();
          return;
        }
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            req.url === '/api/v1/gerar'
              ? { resposta: 'Resposta gerada.' }
              : { contexto, fontes, distancia_minima: distancia },
          ),
        );
      });
    });
    await new Promise<void>((resolve, reject) => {
      upstream.once('error', reject);
      upstream.listen(0, '127.0.0.1', resolve);
    });
    const port = (upstream.address() as AddressInfo).port;
    vi.stubEnv('AI_SERVICE_URL', `http://127.0.0.1:${port}`);
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await module?.close();
    if (upstream?.listening) {
      await new Promise<void>((resolve, reject) => {
        upstream.close((error) => (error ? reject(error) : resolve()));
        upstream.closeAllConnections();
      });
    }
  });

  it('resolve o serviço no NestJS e consulta um servidor HTTP', async () => {
    const consulta = {
      pergunta: 'Dispensa?',
      curso: 'CC',
      perfil: '2023',
      top_k: 2,
    };
    await expect(
      module.get(AiService).buscarContexto(consulta),
    ).resolves.toEqual({ contexto: '', fontes: [], distancia_minima: 1 });
    expect(received).toEqual({
      method: 'POST',
      url: '/api/v1/buscar',
      body: consulta,
    });
  });

  it.each([
    [0.4, 'Trecho normativo', false],
    [0.8, 'Trecho normativo', true],
    [1, 'Trecho normativo', true],
    [0.1, '', true],
    [0.1, '   ', true],
  ] as const)(
    'orquestra a resposta HTTP com distância %s, contexto %j e fallback %s',
    async (valor, trecho, esperado) => {
      distancia = valor;
      contexto = trecho;
      fontes = [{ arquivo: 'norma.pdf', pagina: 1, curso: 'CC' }];
      const consulta = { pergunta: 'Apoio pedagógico?', curso: 'CC' };
      const result = await module.get(OrchestrationService).processar({
        consulta,
        dados_email: { nome: 'Ana', matricula: '123' },
      });
      expect(result).toMatchObject({
        contexto: trecho,
        fontes,
        distancia_minima: valor,
        fallback_acionado: esperado,
      });
      expect(chamadas[0].body).toEqual({
        ...consulta,
        perfil: 'Todos',
        top_k: 3,
      });
      if (result.fallback_acionado) {
        expect(chamadas).toHaveLength(1);
        expect(result.setor_sugerido).toBe('NEAP');
        expect(result.template_email).toContain('Ana');
      } else {
        expect(result).not.toHaveProperty('template_email');
        expect(result.resposta).toBe('Resposta gerada.');
        expect(chamadas[1]).toEqual({
          method: 'POST',
          url: '/api/v1/gerar',
          body: { pergunta: consulta.pergunta, contexto: trecho },
        });
      }
    },
  );

  it('contexto sem fontes aciona fallback e não chama geração', async () => {
    distancia = 0.4;
    contexto = 'Trecho sem referência';
    const result = await module
      .get(OrchestrationService)
      .processar({ consulta: { pergunta: 'Dispensa?' } });
    expect(result).toMatchObject({
      contexto,
      fontes: [],
      distancia_minima: distancia,
      fallback_acionado: true,
      setor_sugerido: 'SecGrad',
    });
    expect(result.template_email).toContain('Dispensa?');
    expect(result).not.toHaveProperty('resposta');
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].url).toBe('/api/v1/buscar');
  });

  it('propaga falha HTTP como erro seguro em vez de fallback', async () => {
    status = 503;
    await expect(
      module.get(OrchestrationService).processar({
        consulta: { pergunta: 'Dispensa?' },
      }),
    ).rejects.toThrow('Falha na resposta do serviço de busca.');
  });
});
