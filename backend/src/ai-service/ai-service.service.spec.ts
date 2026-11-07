import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService } from './ai-service.service.js';

const resultado = {
  contexto: 'Trecho recuperado',
  fontes: [{ arquivo: 'norma.pdf', pagina: 1, curso: 'Geral' }],
  distancia_minima: 0.25,
};

describe('AiService', () => {
  const service = new AiService();
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('AI_SERVICE_URL', 'http://busca.test:8000');
    vi.stubEnv('AI_SERVICE_TIMEOUT_MS', undefined);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('envia POST ao host configurado com os padrões do FastAPI', async () => {
    fetchMock.mockResolvedValue(Response.json(resultado));
    expect(
      await service.buscarContexto({ pergunta: 'Como solicitar dispensa?' }),
    ).toEqual(resultado);
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('http://busca.test:8000/api/v1/buscar');
    expect(options).toMatchObject({
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(options!.body as string)).toEqual({
      pergunta: 'Como solicitar dispensa?',
      curso: 'Geral',
      perfil: 'Todos',
      top_k: 3,
    });
    expect(options!.signal).toBeInstanceOf(AbortSignal);
  });

  it('preserva os filtros e aceita busca sem resultados', async () => {
    const vazio = { contexto: '', fontes: [], distancia_minima: 1.0 };
    fetchMock.mockResolvedValue(Response.json(vazio));
    const consulta = {
      pergunta: 'Estágio?',
      curso: 'CC',
      perfil: '2023',
      top_k: 5,
    };
    expect(await service.buscarContexto(consulta)).toEqual(vazio);
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual(
      consulta,
    );
  });

  it.each([
    '',
    'invalid',
    'ftp://busca.test',
    'http://user:secret@busca.test',
    'http://busca.test/path',
    'http://busca.test?q=1',
    'http://busca.test?',
    'http://busca.test#',
    'http://busca.test#fragmento',
    'http://busca.test/path/..',
    'http://busca.test\\path',
  ])('rejeita configuração inválida: %s', async (url) => {
    vi.stubEnv('AI_SERVICE_URL', url);
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejeita configuração ausente', async () => {
    vi.stubEnv('AI_SERVICE_URL', undefined);
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      'Serviço de busca não configurado.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['http://busca.test:8000', 'https://busca.test/'])(
    'aceita origem válida %s',
    async (origin) => {
      vi.stubEnv('AI_SERVICE_URL', origin);
      fetchMock.mockResolvedValue(Response.json(resultado));
      await expect(
        service.buscarContexto({ pergunta: 'Teste' }),
      ).resolves.toEqual(resultado);
      expect((fetchMock.mock.calls[0]![0] as URL).href).toBe(
        new URL('/api/v1/buscar', origin).href,
      );
    },
  );

  it.each(['1', '30000', '2147483647', ' 5000 '])(
    'usa timeout configurado válido %j',
    async (raw) => {
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', raw);
      const timeout = vi.spyOn(AbortSignal, 'timeout');
      fetchMock.mockResolvedValue(Response.json(resultado));
      await service.buscarContexto({ pergunta: 'Teste' });
      expect(timeout).toHaveBeenCalledExactlyOnceWith(Number(raw));
    },
  );

  it.each([
    '', ' ', '0', '-1', '1.5', 'NaN', 'Infinity',
    '1e3', '0x10', 'abc', '2147483648', '9007199254740992',
  ])(
    'rejeita timeout inválido %j antes da busca',
    async (raw) => {
      vi.stubEnv('AI_SERVICE_TIMEOUT_MS', raw);
      await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
        'Tempo limite do serviço de busca não configurado corretamente.',
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { pergunta: '' },
    { pergunta: '  ' },
    { pergunta: 'Teste', top_k: 0 },
    { pergunta: 'Teste', top_k: 1.5 },
  ])('rejeita consulta inválida %j', async (consulta) => {
    await expect(service.buscarContexto(consulta)).rejects.toThrow(
      BadRequestException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não expõe detalhes de falha de rede', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED host-interno segredo'));
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      'Serviço de busca indisponível.',
    );
  });

  it.each([422, 500, 503])(
    'trata HTTP %i sem repassar o corpo interno',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response('traceback privado', { status }),
      );
      await expect(
        service.buscarContexto({ pergunta: 'Teste' }),
      ).rejects.toThrow('Falha na resposta do serviço de busca.');
    },
  );

  it.each([
    null,
    {},
    { ...resultado, distancia_minima: null },
    { ...resultado, fontes: [{}] },
    { ...resultado, fontes: [{ arquivo: 'x', pagina: '1', curso: 'Geral' }] },
  ])('rejeita contrato inválido %j', async (body) => {
    fetchMock.mockResolvedValue(Response.json(body));
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('trata JSON inválido', async () => {
    fetchMock.mockResolvedValue(new Response('<html>erro</html>'));
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      BadGatewayException,
    );
  });

  it.each(['conexão', 'corpo'])('trata timeout durante %s', async (etapa) => {
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);
    const abort = () => {
      controller.abort();
      throw new DOMException('timeout interno', 'TimeoutError');
    };
    if (etapa === 'conexão') {
      fetchMock.mockImplementation(abort);
    } else {
      const response = Response.json(resultado);
      vi.spyOn(response, 'json').mockImplementation(async () => abort());
      fetchMock.mockResolvedValue(response);
    }
    await expect(service.buscarContexto({ pergunta: 'Teste' })).rejects.toThrow(
      GatewayTimeoutException,
    );
    expect(timeout).toHaveBeenCalledWith(5000);
  });
});
