import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  DadosEmailFallback,
  EmailFallback,
  OrchestrationRequest,
  SetorSugerido,
} from './orchestration.types.js';

@Injectable()
export class FallbackService {
  validarDadosEmail(dados?: DadosEmailFallback): void {
    if (dados === undefined) return;
    if (
      dados === null ||
      typeof dados !== 'object' ||
      Array.isArray(dados) ||
      [dados.nome, dados.matricula, dados.assunto, dados.resumo].some(
        (value) => value !== undefined && typeof value !== 'string',
      )
    ) {
      throw new BadRequestException(
        'Dados para o e-mail de fallback inválidos.',
      );
    }
  }

  identificarSetor(assunto: string): SetorSugerido {
    const texto = assunto.toLowerCase();
    // Sugestões herdadas da prova de conceito, na mesma ordem de prioridade.
    if (texto.includes('estágio') || texto.includes('estagio'))
      return 'SecGrad';
    if (
      texto.includes('requerimento') ||
      texto.includes('dispensa') ||
      texto.includes('segunda chamada')
    )
      return 'SecGrad';
    if (texto.includes('pedagógic') || texto.includes('pedagogic'))
      return 'NEAP';
    if (
      texto.includes('pós-graduação') ||
      texto.includes('pos-graduacao') ||
      texto.includes('pós graduação')
    )
      return 'Secretaria de Pós-Graduação';
    return 'SecGrad';
  }

  gerarEmail({ consulta, dados_email }: OrchestrationRequest): EmailFallback {
    this.validarDadosEmail(dados_email);
    const nome = dados_email?.nome?.trim() || '[Nome]';
    const matricula = dados_email?.matricula?.trim() || '[Matrícula]';
    const curso = consulta.curso?.trim() || '[Curso]';
    const perfil = consulta.perfil?.trim() || '[Perfil curricular]';
    const assunto = dados_email?.assunto?.trim() || consulta.pergunta;
    const resumo = dados_email?.resumo?.trim() || '[Resumo da situação]';
    const setor = this.identificarSetor(assunto);
    return {
      setor_sugerido: setor,
      template_email: `Assunto: ${assunto}

Olá,

Meu nome é ${nome}, matrícula ${matricula}, aluno(a) do curso de ${curso}, perfil curricular ${perfil}.

Estou entrando em contato sobre: ${assunto}.

Resumo da situação:
${resumo}

Minha dúvida é:
${consulta.pergunta}

Setor sugerido:
${setor}

Atenciosamente,
${nome}`,
    };
  }
}
