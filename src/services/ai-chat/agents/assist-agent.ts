import { z } from 'zod';
import type { TeamInput } from './types';
import { runJsonAgent } from './json-utils';

const assistPlanSchema = z.object({
    mode: z.enum(['none', 'assist']),
    summary: z.string().optional(),
    fields: z.array(z.object({
        stepId: z.string(),
        target: z.string(),
        value: z.string(),
        reason: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
    })).max(12),
    needsConfirmation: z.boolean().optional(),
});

export type AssistPlan = z.infer<typeof assistPlanSchema>;

export class AssistAgent {
    async run(
        input: TeamInput,
        walkthrough: { id: string; title: string; description?: string | null; steps: any[] },
    ): Promise<AssistPlan> {
        const steps = Array.isArray(walkthrough.steps) ? walkthrough.steps : [];
        const actionableSteps = steps
            .filter((s: any) => typeof s?.id === 'string' && typeof s?.target === 'string')
            .map((s: any) => ({
                id: s.id,
                title: s.title || s.id,
                target: s.target,
                description: s.description || s.purpose || '',
            }));

        if (actionableSteps.length === 0) {
            return { mode: 'none', fields: [] };
        }

        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"
Último mensaje del asistente: "${input.lastAssistantMessage || 'N/A'}"
Último mensaje del usuario previo: "${input.lastUserMessage || 'N/A'}"

Walkthrough objetivo:
- ID: ${walkthrough.id}
- Título: ${walkthrough.title}
- Descripción: ${walkthrough.description || 'N/A'}

Pasos accionables (rellenables):
${actionableSteps.map((s) => `- stepId: ${s.id} | title: ${s.title} | target: ${s.target} | description: ${s.description || 'N/A'}`).join('\n')}

${input.languageHint}

Genera SOLO JSON válido:
{
  "mode": "assist|none",
  "summary": "resumen breve",
  "fields": [
    {"stepId":"...", "target":"#selector", "value":"...", "reason":"...", "confidence":0.0}
  ],
  "needsConfirmation": true
}

Reglas:
- Usa solo stepId/target listados arriba.
- mode=assist solo si el usuario proporcionó datos concretos para completar campos.
- No inventes datos faltantes; omite campos sin valor explícito.
- No incluyas el paso de submit/finalizar como field.
- needsConfirmation debe ser true cuando haya al menos un field.
`;

        const fallback: AssistPlan = {
            mode: 'none',
            fields: [],
        };

        const plan = await runJsonAgent(
            () => input.llm.text(prompt, { system: input.systemPrompt }),
            assistPlanSchema,
            fallback
        );

        const validTargets = new Set(actionableSteps.map((s) => `${s.id}::${s.target}`));
        const filteredFields = (plan.fields || [])
            .filter((f) => validTargets.has(`${f.stepId}::${f.target}`))
            .filter((f) => typeof f.value === 'string' && f.value.trim().length > 0)
            .slice(0, 10);

        if (filteredFields.length === 0) {
            return { mode: 'none', fields: [] };
        }

        return {
            mode: 'assist',
            summary: plan.summary || 'Detecté datos para prellenar tu formulario de envío.',
            fields: filteredFields,
            needsConfirmation: true,
        };
    }
}
