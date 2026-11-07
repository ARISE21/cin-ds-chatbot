import { defineConfig } from 'vitest/config';
const evidenceDirectory = process.env.BACK_REF_EVIDENCE_DIR;
if (!evidenceDirectory) throw new Error('BACK_REF_EVIDENCE_DIR obrigatório');
const config = {"root": "/home/victor/worktrees/cin-ds-chatbot-back-ref-01-20261102T003619Z/backend", "test": {"include": ["test/sprint3-v2/conversa-http.spec.ts", "test/sprint3-v2/fallback-config.spec.ts", "test/sprint3-v2/fallback-email.spec.ts", "test/sprint3-v2/orchestration.spec.ts"], "coverage": {"provider": "v8", "include": ["src/orchestration/fallback.config.ts", "src/orchestration/fallback.service.ts", "src/orchestration/orchestration.service.ts", "src/ai-service/ai-service.service.ts", "src/app.controller.ts"], "reporter": ["text", "json", "json-summary", "html"], "reportsDirectory": "PLACEHOLDER", "reportOnFailure": true}, "reporters": ["default", "json"], "outputFile": {"json": "PLACEHOLDER"}}};
config.test.coverage.reportsDirectory = `${evidenceDirectory}/coverage`;
config.test.outputFile.json = `${evidenceDirectory}/vitest-results.json`;
export default defineConfig(config);
