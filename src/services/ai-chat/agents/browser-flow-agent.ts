import { z } from 'zod';
import type { TeamInput } from './types';
import { runJsonAgent } from './json-utils';

const browserToolEnum = z.enum(['navigate', 'click', 'fill', 'select', 'waitFor', 'extractText', 'screenshot']);

const browserFlowPlanSchema = z.object({
    mode: z.enum(['none', 'runFlow']),
    summary: z.string().optional(),
    needsConfirmation: z.boolean().optional(),
    steps: z.array(z.object({
        tool: browserToolEnum,
        args: z.record(z.unknown()).optional(),
    })).max(20),
});

export type BrowserFlowPlan = z.infer<typeof browserFlowPlanSchema>;

export class BrowserFlowAgent {
    async run(
        input: TeamInput,
        walkthrough: { id: string; title: string; description?: string | null; steps: any[] },
    ): Promise<BrowserFlowPlan> {
        const steps = Array.isArray(walkthrough.steps) ? walkthrough.steps : [];
        const actionableSteps = steps
            .filter((s: any) => typeof s?.id === 'string')
            .map((s: any) => ({
                id: s.id,
                title: s.title || s.id,
                target: typeof s.target === 'string' ? s.target : '',
                route: typeof s?.metadata?.route === 'string' ? s.metadata.route : '',
                description: s.description || s.purpose || '',
            }));

        if (actionableSteps.length === 0) {
            return { mode: 'none', steps: [] };
        }

        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"
Último mensaje del asistente: "${input.lastAssistantMessage || 'N/A'}"
Último mensaje del usuario previo: "${input.lastUserMessage || 'N/A'}"

Walkthrough objetivo:
- ID: ${walkthrough.id}
- Título: ${walkthrough.title}
- Descripción: ${walkthrough.description || 'N/A'}

Pasos del flujo:
${actionableSteps.map((s) => `- stepId: ${s.id} | title: ${s.title} | route: ${s.route || 'N/A'} | target: ${s.target || 'N/A'} | description: ${s.description || 'N/A'}`).join('\n')}

${input.languageHint}

Devuelve SOLO JSON válido:
{
  "mode": "runFlow|none",
  "summary": "breve resumen de ejecución",
  "needsConfirmation": true,
  "steps": [
    { "tool": "fill|select|click|waitFor|extractText|screenshot|navigate", "args": { "selector": "#id", "value": "..." } }
  ]
}

Reglas:
- Genera mode=runFlow SOLO si el usuario pide ejecutar/automatizar/llenar datos concretos.
- Usa únicamente selectores target presentes en los pasos del flujo.
- No inventes selectores.
- Si faltan datos clave o el usuario solo pregunta, devuelve mode=none.
- Evita click de submit/finalizar por defecto. Solo inclúyelo si el usuario pide explícitamente finalizar/enviar ahora.
- Incluye waitFor cuando sea necesario para estabilizar secuencia.
- Si el flujo tiene route y es necesario, incluye navigate como primer paso antes de fill/select/click.
- needsConfirmation=true cuando mode=runFlow.
`;

        const fallback: BrowserFlowPlan = { mode: 'none', steps: [] };
        const plan = await runJsonAgent(
            () => input.llm.text(prompt, { system: input.systemPrompt }),
            browserFlowPlanSchema,
            fallback
        );

        if (plan.mode !== 'runFlow' || !Array.isArray(plan.steps) || plan.steps.length === 0) {
            return { mode: 'none', steps: [] };
        }

        const allowedSelectors = new Set(
            actionableSteps
                .map((s) => s.target)
                .filter((v) => typeof v === 'string' && v.trim().length > 0)
        );

        const filteredSteps = plan.steps
            .filter((step) => {
                const args = step.args || {};
                const selector = typeof args.selector === 'string' ? args.selector : '';
                if (!selector) return step.tool === 'waitFor' || step.tool === 'navigate';
                return allowedSelectors.has(selector);
            })
            .slice(0, 16);

        if (filteredSteps.length === 0) {
            return { mode: 'none', steps: [] };
        }

        return {
            mode: 'runFlow',
            summary: plan.summary || 'Preparé una automatización guiada para este flujo.',
            needsConfirmation: true,
            steps: filteredSteps,
        };
    }
}
