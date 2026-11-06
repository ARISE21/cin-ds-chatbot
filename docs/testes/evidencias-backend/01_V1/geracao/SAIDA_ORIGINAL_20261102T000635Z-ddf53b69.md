# Primeira saída original — V1 dos testes da Sprint 3

Geração independente baseada exclusivamente nos onze arquivos da entrada de produção autorizada. Os testes abaixo usam Vitest, instâncias diretas dos serviços e uma simulação de AiService.buscarContexto. Os caminhos dos arquivos são relativos a um backend que contenha src/; nesta etapa os arquivos são apenas preservados na pasta de evidências.

## backend/test/sprint3-v1/orchestration.spec.ts
```typescript
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiService } from '../../src/ai-service/ai-service.service.js';
import type { BuscarContextoResponse } from '../../src/ai-service/ai-service.types.js';
import { FallbackService } from '../../src/orchestration/fallback.service.js';
import { OrchestrationService } from '../../src/orchestration/orchestration.service.js';
import type { OrchestrationRequest } from '../../src/orchestration/orchestration.types.js';

function preparar(threshold = 0.8) {
  const ai = new AiService();
  const buscar = vi.spyOn(ai, 'buscarContexto');
  const fallback = new FallbackService();
  const gerarEmail = vi.spyOn(fallback, 'gerarEmail');
  const service = new OrchestrationService(ai, fallback, threshold);
  const request: OrchestrationRequest = {
    consulta: { pergunta: 'Como solicitar dispensa?', curso: 'Computação', perfil: '2023', top_k: 3 },
    dados_email: { nome: 'Ana', matricula: '12345', resumo: 'Preciso de orientação.' },
  };
  const resultado: BuscarContextoResponse = {
    contexto: 'Apresente um requerimento à secretaria.',
    distancia_minima: 0.2,
    fontes: [{ arquivo: 'regulamento.pdf', pagina: 2, curso: 'Computação' }],
  };
  return { service, buscar, gerarEmail, request, resultado };
}

describe('US-02 — decisão de fallback', () => {
  it('mantém a resposta com evidência suficiente e não gera e-mail', async () => {
    const { service, buscar, gerarEmail, request, resultado } = preparar();
    buscar.mockResolvedValue(resultado);
    const resposta = await service.processar(request);
    expect(resposta).toEqual({ ...resultado, fallback_acionado: false });
    expect(resposta).not.toHaveProperty('template_email');
    expect(resposta).not.toHaveProperty('setor_sugerido');
    expect(gerarEmail).not.toHaveBeenCalled();
  });

  it.each([0.8, 0.800001, 1.2])('aciona fallback para distância %s no limite ou acima', async (distancia) => {
    const { service, buscar, gerarEmail, request, resultado } = preparar();
    buscar.mockResolvedValue({ ...resultado, distancia_minima: distancia });
    const resposta = await service.processar(request);
    expect(resposta).toMatchObject({
      ...resultado,
      distancia_minima: distancia,
      fallback_acionado: true,
      setor_sugerido: 'SecGrad',
    });
    expect(resposta).toHaveProperty('template_email', expect.stringContaining(request.consulta.pergunta));
    expect(gerarEmail).toHaveBeenCalledExactlyOnceWith(request);
  });

  it('aceita uma distância imediatamente abaixo do limite', async () => {
    const { service, buscar, request, resultado } = preparar();
    buscar.mockResolvedValue({ ...resultado, distancia_minima: 0.799999 });
    expect(await service.processar(request)).toMatchObject({ fallback_acionado: false });
  });

  it.each(['', '   ', '\n\t '])('aciona fallback para contexto vazio ou branco (%j)', async (contexto) => {
    const { service, buscar, request, resultado } = preparar();
    buscar.mockResolvedValue({ ...resultado, contexto, distancia_minima: 0 });
    expect(await service.processar(request)).toMatchObject({ contexto, fallback_acionado: true });
  });

  it('respeita o limite injetado e preserva os dados retornados pela busca', async () => {
    const { service, buscar, request, resultado } = preparar(1.5);
    buscar.mockResolvedValue({ ...resultado, distancia_minima: 1.4 });
    expect(await service.processar(request)).toEqual({ ...resultado, distancia_minima: 1.4, fallback_acionado: false });
  });

  it('envia somente a consulta à busca, sem os dados pessoais do e-mail', async () => {
    const { service, buscar, request, resultado } = preparar();
    buscar.mockResolvedValue(resultado);
    await service.processar(request);
    expect(buscar).toHaveBeenCalledExactlyOnceWith(request.consulta);
    expect(buscar.mock.calls[0]).toHaveLength(1);
    expect(buscar.mock.calls[0][0]).not.toHaveProperty('dados_email');
  });

  it.each([undefined, null, {}])('rejeita requisição sem consulta antes da busca (%j)', async (request) => {
    const { service, buscar } = preparar();
    await expect(service.processar(request as unknown as OrchestrationRequest)).rejects.toBeInstanceOf(BadRequestException);
    expect(buscar).not.toHaveBeenCalled();
  });

  it('valida dados pessoais mesmo quando a busca poderia responder', async () => {
    const { service, buscar, request } = preparar();
    const invalido = { ...request, dados_email: { nome: 123 } } as unknown as OrchestrationRequest;
    await expect(service.processar(invalido)).rejects.toBeInstanceOf(BadRequestException);
    expect(buscar).not.toHaveBeenCalled();
  });

  it('propaga indisponibilidade da busca sem produzir rascunho', async () => {
    const { service, buscar, gerarEmail, request } = preparar();
    const erro = new ServiceUnavailableException('Serviço de busca indisponível.');
    buscar.mockRejectedValue(erro);
    await expect(service.processar(request)).rejects.toBe(erro);
    expect(gerarEmail).not.toHaveBeenCalled();
  });

  it('integra fallback e rascunho com os dados informados pelo estudante', async () => {
    const { service, buscar, request, resultado } = preparar();
    buscar.mockResolvedValue({ ...resultado, distancia_minima: 0.9 });
    const resposta = await service.processar(request);
    expect(resposta.fallback_acionado).toBe(true);
    if (!resposta.fallback_acionado) throw new Error('Fallback esperado');
    expect(resposta.template_email).toContain('Meu nome é Ana, matrícula 12345');
    expect(resposta.template_email).toContain('Preciso de orientação.');
    expect(resposta.setor_sugerido).toBe('SecGrad');
  });
});
```

## backend/test/sprint3-v1/fallback-email.spec.ts
```typescript
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { FallbackService } from '../../src/orchestration/fallback.service.js';
import type { DadosEmailFallback } from '../../src/orchestration/orchestration.types.js';

const service = new FallbackService();

describe('US-03 — rascunho de e-mail', () => {
  it('compõe o rascunho completo e remove espaços externos dos campos', () => {
    const resultado = service.gerarEmail({
      consulta: { pergunta: 'Como encaminhar meu pedido?', curso: ' Computação ', perfil: ' 2023 ' },
      dados_email: { nome: ' Ana ', matricula: ' 12345 ', assunto: ' Apoio pedagógico ', resumo: ' Preciso de apoio. ' },
    });
    expect(resultado).toEqual({
      setor_sugerido: 'NEAP',
      template_email: `Assunto: Apoio pedagógico

Olá,

Meu nome é Ana, matrícula 12345, aluno(a) do curso de Computação, perfil curricular 2023.

Estou entrando em contato sobre: Apoio pedagógico.

Resumo da situação:
Preciso de apoio.

Minha dúvida é:
Como encaminhar meu pedido?

Setor sugerido:
NEAP

Atenciosamente,
Ana`,
    });
  });

  it('usa marcadores de preenchimento e a pergunta como assunto quando os dados são omitidos', () => {
    expect(service.gerarEmail({ consulta: { pergunta: 'Como solicitar uma declaração?' } })).toEqual({
      setor_sugerido: 'SecGrad',
      template_email: `Assunto: Como solicitar uma declaração?

Olá,

Meu nome é [Nome], matrícula [Matrícula], aluno(a) do curso de [Curso], perfil curricular [Perfil curricular].

Estou entrando em contato sobre: Como solicitar uma declaração?.

Resumo da situação:
[Resumo da situação]

Minha dúvida é:
Como solicitar uma declaração?

Setor sugerido:
SecGrad

Atenciosamente,
[Nome]`,
    });
  });

  it('trata campos em branco como ausentes', () => {
    const consulta = { pergunta: 'Qual o procedimento?', curso: ' ', perfil: '\t' };
    const comBrancos = service.gerarEmail({
      consulta,
      dados_email: { nome: ' ', matricula: '', assunto: '\n', resumo: '\t ' },
    });
    expect(comBrancos).toEqual(service.gerarEmail({ consulta: { pergunta: consulta.pergunta } }));
  });

  it('usa o assunto informado para sugerir setor e preserva a pergunta no corpo', () => {
    const resultado = service.gerarEmail({
      consulta: { pergunta: 'Tenho dúvida de estágio.' },
      dados_email: { assunto: 'Apoio pedagógico', resumo: 'Primeira linha\nSegunda linha' },
    });
    expect(resultado.setor_sugerido).toBe('NEAP');
    expect(resultado.template_email).toContain('Minha dúvida é:\nTenho dúvida de estágio.');
    expect(resultado.template_email).toContain('Primeira linha\nSegunda linha');
  });

  it.each([
    ['ESTÁGIO', 'SecGrad'],
    ['estagio', 'SecGrad'],
    ['requerimento', 'SecGrad'],
    ['dispensa', 'SecGrad'],
    ['segunda chamada', 'SecGrad'],
    ['apoio pedagógico', 'NEAP'],
    ['apoio pedagogico', 'NEAP'],
    ['pós-graduação', 'Secretaria de Pós-Graduação'],
    ['pos-graduacao', 'Secretaria de Pós-Graduação'],
    ['pós graduação', 'Secretaria de Pós-Graduação'],
    ['assunto sem palavra-chave', 'SecGrad'],
    ['estágio e apoio pedagógico', 'SecGrad'],
    ['requerimento de pós-graduação', 'SecGrad'],
    ['apoio pedagógico na pós-graduação', 'NEAP'],
  ])('sugere setor para %s respeitando a prioridade implementada', (assunto, setor) => {
    expect(service.identificarSetor(assunto)).toBe(setor);
  });

  it.each([undefined, {}, { nome: '', matricula: '123', assunto: 'Pedido', resumo: 'Resumo' }])(
    'aceita dados opcionais válidos (%j)',
    (dados) => {
      expect(() => service.validarDadosEmail(dados)).not.toThrow();
    },
  );

  it.each([null, [], 'Ana', 10, true])('rejeita estrutura inválida de dados (%j)', (dados) => {
    expect(() => service.validarDadosEmail(dados as unknown as DadosEmailFallback)).toThrow(BadRequestException);
    expect(() => service.gerarEmail({
      consulta: { pergunta: 'Ajuda?' },
      dados_email: dados as unknown as DadosEmailFallback,
    })).toThrow(BadRequestException);
  });

  it.each(['nome', 'matricula', 'assunto', 'resumo'] as const)('rejeita valor não textual no campo %s', (campo) => {
    for (const valor of [null, 42, false, [], {}]) {
      const dados = { [campo]: valor } as unknown as DadosEmailFallback;
      expect(() => service.validarDadosEmail(dados)).toThrow(BadRequestException);
    }
  });
});
```

## backend/test/sprint3-v1/fallback-config.spec.ts
```typescript
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
```

## Escopo e limitações da V1

Os testes caracterizam os comportamentos observáveis do código fornecido: fronteira inclusiva do limite, contexto vazio, preservação da resposta, isolamento dos dados pessoais na chamada de busca, propagação de erro, validação dos dados opcionais, texto do rascunho, marcadores e prioridade dos setores. Não há requisito independente fornecido para validar a adequação institucional das regras de setores ou calibrar a distância.

Nenhum teste foi instalado, executado, corrigido, formatado ou refatorado. Não há resultados de aprovação, cobertura ou compilação. A resolução de imports .js para fontes .ts e o processamento de decorators dependem da configuração futura do ambiente Vitest/TypeScript, ausente da entrada. As versões do package.json são faixas declaradas; não foram verificadas versões instaladas. AppService é importado por arquivos fornecidos, mas sua implementação não consta da entrada; os testes não inicializam AppModule nem o endpoint HTTP. O transporte de AiService foi simulado, sem chamadas de rede. Não foram consultados Git, testes existentes, relatórios ou histórico. O SHA da base não está disponível na entrada autorizada.
