import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AiService } from '../ai-service/ai-service.service.js';
import { OrchestrationModule } from './orchestration.module.js';
import { OrchestrationService } from './orchestration.service.js';
import type { OrchestrationRequest } from './orchestration.types.js';

const response = {
  contexto: 'Trecho normativo',
  fontes: [{ arquivo: 'normas.pdf', pagina: 2, curso: 'CC' }],
  distancia_minima: 0.4,
};
const request = {
  consulta: { pergunta: 'Como solicitar dispensa?', curso: 'CC' },
  dados_email: { nome: 'Ana', matricula: '123' },
};

describe('OrchestrationService', () => {
  let module: TestingModule;
  const buscarContexto = vi.fn();
  const gerarResposta = vi.fn();

  async function createService() {
    module = await Test.createTestingModule({ imports: [OrchestrationModule] })
      .overrideProvider(AiService)
      .useValue({ buscarContexto, gerarResposta })
      .compile();
    return module.get(OrchestrationService);
  }

  beforeEach(() => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', undefined);
    buscarContexto.mockReset().mockResolvedValue(response);
    gerarResposta.mockReset().mockResolvedValue('Resposta gerada.');
  });
  afterEach(async () => {
    await module?.close();
    vi.unstubAllEnvs();
  });

  it('retorna resposta gerada abaixo do limite e não envia dados pessoais ao ai-service', async () => {
    const service = await createService();
    expect(await service.processar(request)).toEqual({
      ...response,
      fallback_acionado: false,
      resposta: 'Resposta gerada.',
    });
    expect(buscarContexto).toHaveBeenCalledExactlyOnceWith(request.consulta);
    expect(gerarResposta).toHaveBeenCalledExactlyOnceWith(
      request.consulta.pergunta,
      response.contexto,
    );
  });

  it.each([0.8, 0.9])(
    'aciona fallback na igualdade ou acima do limite: %s',
    async (distancia) => {
      buscarContexto.mockResolvedValue({
        ...response,
        distancia_minima: distancia,
      });
      const service = await createService();
      const result = await service.processar(request);
      expect(result).toMatchObject({
        ...response,
        distancia_minima: distancia,
        fallback_acionado: true,
        setor_sugerido: 'SecGrad',
      });
      if (!result.fallback_acionado) throw new Error('Fallback esperado');
      expect(result.template_email).toContain('Ana');
    },
  );

  it('usa limite customizado por ambiente', async () => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '0.3');
    const service = await createService();
    expect((await service.processar(request)).fallback_acionado).toBe(true);
  });

  it.each(['', '   ', '\t\n '])(
    'aciona fallback com contexto %j mesmo abaixo do limite customizado',
    async (contexto) => {
      vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', '1.2');
      buscarContexto.mockResolvedValue({
        contexto,
        fontes: [],
        distancia_minima: 0.1,
      });
      const service = await createService();
      expect(await service.processar(request)).toMatchObject({
        contexto,
        fontes: [],
        distancia_minima: 0.1,
        fallback_acionado: true,
        setor_sugerido: 'SecGrad',
        template_email: expect.any(String),
      });
    },
  );

  it.each([
    new BadRequestException('Consulta de busca inválida.'),
    new BadGatewayException('Resposta inválida do serviço de busca.'),
    new ServiceUnavailableException('Serviço de busca indisponível.'),
    new GatewayTimeoutException('Tempo limite do serviço de busca excedido.'),
  ])(
    'propaga exceção segura do AiService sem converter em fallback: %s',
    async (error) => {
      buscarContexto.mockRejectedValue(error);
      const service = await createService();
      await expect(service.processar(request)).rejects.toBe(error);
    },
  );

  it('rejeita ausência de consulta antes da busca', async () => {
    const service = await createService();
    await expect(service.processar({} as OrchestrationRequest)).rejects.toThrow(
      BadRequestException,
    );
    expect(buscarContexto).not.toHaveBeenCalled();
  });

  it('rejeita dados pessoais inválidos antes da busca', async () => {
    const service = await createService();
    await expect(
      service.processar({
        ...request,
        dados_email: { nome: 1 },
      } as unknown as OrchestrationRequest),
    ).rejects.toThrow(BadRequestException);
    expect(buscarContexto).not.toHaveBeenCalled();
  });

  it('impede inicialização do módulo com configuração inválida', async () => {
    vi.stubEnv('FALLBACK_DISTANCE_THRESHOLD', 'segredo-inválido');
    await expect(createService()).rejects.toThrow(
      'FALLBACK_DISTANCE_THRESHOLD deve ser um número decimal finito não negativo.',
    );
    expect(buscarContexto).not.toHaveBeenCalled();
  });
});
