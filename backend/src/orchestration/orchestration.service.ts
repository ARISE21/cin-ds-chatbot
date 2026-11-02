import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service.js';
import { FALLBACK_DISTANCE_THRESHOLD } from './fallback.config.js';
import { FallbackService } from './fallback.service.js';
import type {
  OrchestrationRequest,
  OrchestrationResult,
} from './orchestration.types.js';

@Injectable()
export class OrchestrationService {
  constructor(
    @Inject(AiService) private readonly aiService: AiService,
    @Inject(FallbackService) private readonly fallbackService: FallbackService,
    @Inject(FALLBACK_DISTANCE_THRESHOLD) private readonly threshold: number,
  ) {}

  async processar(request: OrchestrationRequest): Promise<OrchestrationResult> {
    if (!request?.consulta) {
      throw new BadRequestException('Consulta de busca obrigatória.');
    }
    this.fallbackService.validarDadosEmail(request.dados_email);
    // Apenas a consulta segue ao ai-service; dados pessoais ficam no backend.
    // AiService já converte falhas de transporte em exceções seguras do NestJS.
    const resultado = await this.aiService.buscarContexto(request.consulta);
    if (
      resultado.distancia_minima < this.threshold &&
      resultado.contexto.trim().length > 0 &&
      resultado.fontes.length > 0
    ) {
      const resposta = await this.aiService.gerarResposta(
        request.consulta.pergunta,
        resultado.contexto,
      );
      if (resposta?.trim()) {
        return { ...resultado, fallback_acionado: false, resposta };
      }
    }
    return {
      ...resultado,
      fallback_acionado: true,
      ...this.fallbackService.gerarEmail(request),
    };
  }
}
