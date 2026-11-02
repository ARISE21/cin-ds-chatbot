import type {
  BuscarContextoRequest,
  BuscarContextoResponse,
} from '../ai-service/ai-service.types.js';

export type SetorSugerido = 'SecGrad' | 'NEAP' | 'Secretaria de Pós-Graduação';

export interface DadosEmailFallback {
  nome?: string;
  matricula?: string;
  assunto?: string;
  resumo?: string;
}

export interface OrchestrationRequest {
  consulta: BuscarContextoRequest;
  dados_email?: DadosEmailFallback;
}

export interface EmailFallback {
  setor_sugerido: SetorSugerido;
  template_email: string;
}

export type OrchestrationResult = BuscarContextoResponse &
  (
    | { fallback_acionado: false; resposta: string }
    | ({ fallback_acionado: true } & EmailFallback)
  );
