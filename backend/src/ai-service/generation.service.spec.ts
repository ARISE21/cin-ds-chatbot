import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from './ai-service.service.js';

const service = new AiService();
const interno = 'PROMPT_INTERNO_FICTICIO TOKEN_FICTICIO /interno/modelo';
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
beforeEach(() => {
  vi.stubEnv('AI_SERVICE_URL', 'http://ia.test:8000');
  vi.stubEnv('AI_SERVICE_TIMEOUT_MS', undefined);
  fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ resposta: 'Resposta documental.' }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('AiService.gerarResposta', () => {
  it('envia somente pergunta e contexto ao endpoint de geração e usa timeout configurado', async () => {
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', '30000');
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    await expect(service.gerarResposta('P', 'C')).resolves.toBe(
      'Resposta documental.',
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('http://ia.test:8000/api/v1/gerar');
    expect(init).toMatchObject({
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(JSON.parse(init!.body as string)).toEqual({
      pergunta: 'P',
      contexto: 'C',
    });
    expect(timeout).toHaveBeenCalledWith(30000);
  });

  it('mantém o aviso de simulação literal e descarta campos extras', async () => {
    const resposta = '[SIMULAÇÃO DE INTEGRAÇÃO — NÃO É RESPOSTA ACADÊMICA]';
    fetchMock.mockResolvedValue(
      Response.json({
        resposta,
        fontes: [{ arquivo: 'inventado.pdf' }],
        prompt: interno,
      }),
    );
    await expect(service.gerarResposta('P', 'C')).resolves.toBe(resposta);
  });

  it.each([null, '', ' \n\t'])(
    'normaliza resposta %j para null',
    async (resposta) => {
      fetchMock.mockResolvedValue(Response.json({ resposta }));
      await expect(service.gerarResposta('P', 'C')).resolves.toBeNull();
    },
  );

  it.each([
    {},
    null,
    [],
    { resposta: 1 },
    { resposta: false },
    { resposta: {} },
  ])('rejeita contrato inválido %j', async (result) => {
    fetchMock.mockResolvedValue(Response.json(result));
    await expect(service.gerarResposta('P', 'C')).rejects.toMatchObject({
      message: 'Resposta inválida do serviço de geração.',
    });
  });

  it('rejeita JSON malformado sem expor o texto interno', async () => {
    fetchMock.mockResolvedValue(new Response(interno));
    await expect(service.gerarResposta('P', 'C')).rejects.toThrow(
      new BadGatewayException('Resposta inválida do serviço de geração.'),
    );
  });

  it.each([503, 504, 500, 422])(
    'converte HTTP upstream %s em erro seguro',
    async (status) => {
      fetchMock.mockResolvedValue(new Response(interno, { status }));
      const promise = service.gerarResposta('P', 'C');
      if (status === 503)
        await expect(promise).rejects.toThrow(
          new ServiceUnavailableException('Serviço de geração indisponível.'),
        );
      else if (status === 504)
        await expect(promise).rejects.toThrow(
          new GatewayTimeoutException(
            'Tempo limite do serviço de geração excedido.',
          ),
        );
      else
        await expect(promise).rejects.toThrow(
          new BadGatewayException('Falha na resposta do serviço de geração.'),
        );
    },
  );

  it('converte erro de transporte em 503', async () => {
    fetchMock.mockRejectedValue(new Error(interno));
    await expect(service.gerarResposta('P', 'C')).rejects.toThrow(
      new ServiceUnavailableException('Serviço de geração indisponível.'),
    );
  });

  it.each(['fetch', 'json'])(
    'converte timeout de %s em 504 com o sinal do request',
    async (fase) => {
      const controller = new AbortController();
      const timeout = vi
        .spyOn(AbortSignal, 'timeout')
        .mockReturnValue(controller.signal);
      const falhar = async () => {
        controller.abort();
        throw new Error(interno);
      };
      if (fase === 'fetch') fetchMock.mockImplementation(falhar);
      else
        fetchMock.mockResolvedValue({
          ok: true,
          json: falhar,
        } as unknown as Response);
      await expect(service.gerarResposta('P', 'C')).rejects.toThrow(
        new GatewayTimeoutException(
          'Tempo limite do serviço de geração excedido.',
        ),
      );
      expect(timeout).toHaveBeenCalledWith(5000);
    },
  );

  it.each([
    ['', 'C'],
    [' ', 'C'],
    [null, 'C'],
    ['P', null],
  ])(
    'rejeita entradas inválidas antes da rede: %j %j',
    async (pergunta, contexto) => {
      await expect(
        service.gerarResposta(pergunta as string, contexto as string),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(['', 'https://usuario:senha@ia.test', 'http://ia.test/caminho'])(
    'rejeita origem inválida %j sem chamar fetch',
    async (origem) => {
      vi.stubEnv('AI_SERVICE_URL', origem);
      await expect(service.gerarResposta('P', 'C')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(['0', 'NaN', '2147483648'])(
    'rejeita timeout inválido %j sem chamar fetch',
    async (timeout) => {
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', timeout);
      await expect(service.gerarResposta('P', 'C')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
