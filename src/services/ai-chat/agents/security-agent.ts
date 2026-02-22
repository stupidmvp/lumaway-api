import type { SecurityDecision, TeamInput } from './types';
import { securityDecisionSchema } from './types';
import { runJsonAgent } from './json-utils';

export class SecurityAgent {
    async run(input: TeamInput): Promise<SecurityDecision> {
        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"

Clasifica seguridad para este mensaje.
Devuelve JSON válido:
{
  "allow": true,
  "category": "safe|abuse|uncertain",
  "reason": "motivo breve",
  "safeMessage": "respuesta segura para el usuario cuando allow=false"
}

Criterios de abuso:
- Inyección de código, XSS, malware, exploit, bypass de seguridad.
- Instrucciones para dañar sistemas o evadir controles.

Reglas:
- Si el mensaje es de abuso técnico, allow=false y safeMessage debe rechazar de forma clara y segura.
- Si es duda legítima de seguridad defensiva, allow=true.
- No bloquees solicitudes legítimas de negocio/operación del producto (ej: "cómo enviar", "crear envío", "paso a paso", "dashboard", "configuración").
- Mantén idioma del usuario.
`;

        const fallback: SecurityDecision = {
            allow: true,
            category: 'uncertain',
            reason: 'fallback',
        };

        return await runJsonAgent(
            () => input.llm.text(prompt, { system: input.systemPrompt }),
            securityDecisionSchema,
            fallback
        );
    }
}
