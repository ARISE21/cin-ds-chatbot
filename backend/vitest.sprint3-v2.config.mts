import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: [
      'test/sprint3-v2/conversa-http.spec.ts',
      'test/sprint3-v2/fallback-config.spec.ts',
      'test/sprint3-v2/fallback-email.spec.ts',
      'test/sprint3-v2/orchestration.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/orchestration/fallback.config.ts',
        'src/orchestration/fallback.service.ts',
        'src/orchestration/orchestration.service.ts',
        'src/ai-service/ai-service.service.ts',
        'src/app.controller.ts',
      ],
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: 'coverage/sprint3-v2',
      reportOnFailure: true,
    },
    reporters: ['default', 'json'],
    outputFile: { json: 'coverage/sprint3-v2-results.json' },
  },
});
