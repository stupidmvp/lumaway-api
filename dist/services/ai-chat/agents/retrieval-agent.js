"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalAgent = void 0;
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
class RetrievalAgent {
    async run(input) {
        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"
Último mensaje del asistente: "${input.lastAssistantMessage || 'N/A'}"
Último mensaje del usuario previo: "${input.lastUserMessage || 'N/A'}"

${input.languageHint}

Catálogo de walkthroughs publicados:
${input.contextSummary}

Devuelve JSON válido:
{
  "suggestedWalkthroughIds": ["uuid-1", "uuid-2"]
}

Reglas:
- Usa solo IDs del catálogo.
- Devuelve entre 1 y 3 IDs si aplica.
- Si no hay match claro, devuelve [].
- Prioriza relevancia con el pedido actual y continuidad del historial.
- Si el usuario pide "cómo hacer", "cómo enviar", "paso a paso" o ejecutar una tarea, devuelve los walkthroughs más directos aunque intent.responseType no sea "guide".
`;
        const result = await (0, json_utils_1.runJsonAgent)(() => input.llm.text(prompt, { system: input.systemPrompt }), types_1.retrievalDecisionSchema, { suggestedWalkthroughIds: [] });
        const validIds = new Set(input.walkthroughs.map((w) => w.id));
        const deduped = Array.from(new Set(result.suggestedWalkthroughIds))
            .filter((id) => validIds.has(id))
            .slice(0, 3);
        return { suggestedWalkthroughIds: deduped };
    }
}
exports.RetrievalAgent = RetrievalAgent;
