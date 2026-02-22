import type { PlannerDecision, TeamInput } from './types';
import { plannerDecisionSchema } from './types';
import { runJsonAgent } from './json-utils';

export class PlannerAgent {
    async run(input: TeamInput): Promise<PlannerDecision> {
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

Catálogo de walkthroughs publicados:
${input.contextSummary}

Responde SOLO con JSON válido:
{
  "allow": true,
  "category": "safe|abuse|uncertain",
  "reason": "motivo breve",
  "safeMessage": "texto seguro cuando allow=false (opcional)",
  "intent": "etiqueta semántica breve",
  "responseType": "answer|guide|clarify",
  "confidence": 0.0,
  "suggestedWalkthroughIds": ["uuid-1", "uuid-2"]
}

Reglas:
- Detecta abuso solo para solicitudes de explotación/inyección/malware/bypass. No bloquees dudas legítimas de negocio (ej: "cómo enviar", "dashboard", "configuración").
- "answer": dudas o conversación contextual.
- "guide": intención operativa/procedimental/paso a paso.
- "clarify": falta información.
- Si el mensaje es confirmatorio breve ("sí", "ok", "dale"), trátalo como continuidad del último turno.
- suggestedWalkthroughIds: usa solo IDs del catálogo, entre 0 y 3, priorizando relevancia y continuidad.
- No inventes fuera del contexto publicado.
`;

        const fallback: PlannerDecision = {
            allow: true,
            category: 'uncertain',
            reason: 'fallback',
            intent: 'unknown',
            responseType: 'answer',
            confidence: 0.2,
            suggestedWalkthroughIds: [],
        };

        const result = await runJsonAgent(
            () => input.llm.text(prompt, { system: input.systemPrompt }),
            plannerDecisionSchema,
            fallback
        );

        const validIds = new Set(input.walkthroughs.map((w) => w.id));
        const deduped = Array.from(new Set(result.suggestedWalkthroughIds))
            .filter((id) => validIds.has(id))
            .slice(0, 3);

        return { ...result, suggestedWalkthroughIds: deduped };
    }
}
