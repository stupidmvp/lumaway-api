"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityAgent = void 0;
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
class IdentityAgent {
    async run(input) {
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
        return await (0, json_utils_1.runJsonAgent)(() => input.llm.text(prompt, { system: input.systemPrompt }), types_1.identityDecisionSchema, { hasProvidedName: false });
    }
}
exports.IdentityAgent = IdentityAgent;
