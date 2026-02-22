"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = void 0;
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
class SecurityAgent {
    async run(input) {
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
        const fallback = {
            allow: true,
            category: 'uncertain',
            reason: 'fallback',
        };
        return await (0, json_utils_1.runJsonAgent)(() => input.llm.text(prompt, { system: input.systemPrompt }), types_1.securityDecisionSchema, fallback);
    }
}
exports.SecurityAgent = SecurityAgent;
