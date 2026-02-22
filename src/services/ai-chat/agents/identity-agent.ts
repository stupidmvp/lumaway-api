import type { IdentityDecision, TeamInput } from './types';
import { identityDecisionSchema } from './types';
import { runJsonAgent } from './json-utils';

export class IdentityAgent {
    async run(input: TeamInput): Promise<IdentityDecision> {
        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"

Determina si el usuario está compartiendo su nombre o cómo quiere que lo llamen.

Devuelve JSON válido:
{
  "hasProvidedName": true,
  "providedName": "Fabian"
}

Reglas:
- hasProvidedName=true solo si el mensaje expresa nombre explícito (ej. "me llamo X", "soy X", "puedes decirme X").
- Si no hay nombre explícito, hasProvidedName=false y no incluyas providedName.
- providedName debe ser solo el nombre/apodo sin texto extra.
`;

        return await runJsonAgent(
            () => input.llm.text(prompt, { system: input.systemPrompt }),
            identityDecisionSchema,
            { hasProvidedName: false }
        );
    }
}

