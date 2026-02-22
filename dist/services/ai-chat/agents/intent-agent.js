"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentAgent = void 0;
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
class IntentAgent {
    async run(input) {
        const prompt = `${input.conversationContext}
Contexto del usuario:
- userId: ${input.requesterContext.userId}
- actorSlug: ${input.requesterContext.actorSlug || 'N/A'}
- locale: ${input.requesterContext.locale || 'N/A'}
- sessionId: ${input.requesterContext.sessionId || 'N/A'}

Mensaje del usuario: "${input.userMessage}"
Último mensaje del asistente: "${input.lastAssistantMessage || 'N/A'}"
Último mensaje del usuario previo: "${input.lastUserMessage || 'N/A'}"

${input.languageHint}

Resumen de walkthroughs:
${input.contextSummary}

Responde con JSON válido:
{
  "intent": "etiqueta semántica breve",
  "responseType": "answer|guide|clarify",
  "confidence": 0.0
}

Reglas:
- "answer": dudas o conversación contextual.
- "guide": intención de ejecutar flujo paso a paso.
- "clarify": falta información.
- Si el usuario expresa intención operativa (aprender/proceso/ejecutar), prioriza "guide" sobre "answer".
- Si el mensaje actual es breve/confirmatorio (ej: "sí", "ok", "dale"), interprétalo como continuidad del último mensaje del asistente, no como una intención nueva aislada.
- No inventes fuera del contexto publicado.
`;
        return await (0, json_utils_1.runJsonAgent)(() => input.llm.text(prompt, { system: input.systemPrompt }), types_1.intentDecisionSchema, {
            intent: 'unknown',
            responseType: 'answer',
            confidence: 0.2,
        });
    }
}
exports.IntentAgent = IntentAgent;
