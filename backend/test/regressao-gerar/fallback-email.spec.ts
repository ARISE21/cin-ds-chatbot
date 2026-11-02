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
    for (const marcador of ['[Nome]', '[Matrícula]', '[Curso]', '[Perfil curricular]', '[Resumo da situação]']) {
      expect(comBrancos.template_email).toContain(marcador);
    }
    expect(comBrancos.template_email).not.toMatch(/undefined|null/);
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
