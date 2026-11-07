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

  it.each([0.8, 0.8001, 1.2])('aciona fallback para distância %s no limite ou acima', async (distancia) => {
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
    buscar.mockResolvedValue({ ...resultado, distancia_minima: 0.7999 });
    expect(await service.processar(request)).toEqual({ ...resultado, distancia_minima: 0.7999, fallback_acionado: false });
  });

  it.each(['', '   ', '\n\t '])('aciona fallback para contexto vazio ou branco (%j)', async (contexto) => {
    const { service, buscar, gerarEmail, request, resultado } = preparar();
    buscar.mockResolvedValue({ ...resultado, contexto, distancia_minima: 0.1 });
    const resposta = await service.processar(request);
    expect(resposta).toMatchObject({ ...resultado, contexto, distancia_minima: 0.1, fallback_acionado: true, setor_sugerido: 'SecGrad' });
    expect(resposta.template_email).toContain('Meu nome é Ana, matrícula 12345');
    expect(resposta.template_email).toContain(request.consulta.pergunta);
    expect(resposta.template_email).toContain('Preciso de orientação.');
    expect(gerarEmail).toHaveBeenCalledExactlyOnceWith(request);
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
