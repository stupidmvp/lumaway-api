"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseAgent = void 0;
class ResponseAgent {
    async run(input, intent, retrieval) {
        const selected = retrieval.suggestedWalkthroughIds
            .map((id) => input.walkthroughs.find((w) => w.id === id))
            .filter((w) => Boolean(w))
            .map((w) => `- ID: "${w.id}" | ${w.title}: ${w.description || 'Sin descripción'}`)
            .join('\n');
        const prompt = `${input.conversationContext}
Mensaje del usuario: "${input.userMessage}"
Último mensaje del asistente: "${input.lastAssistantMessage || 'N/A'}"
Último mensaje del usuario previo: "${input.lastUserMessage || 'N/A'}"
Intent detectado: "${intent.intent}"
Tipo sugerido: "${intent.responseType}"
Perfil de personalización:
- isAnonymous: ${input.anonymousProfile.isAnonymous}
- userTurns: ${input.anonymousProfile.userTurns}
- userName: ${input.anonymousProfile.userName || 'N/A'}
- shouldAskName: ${input.anonymousProfile.shouldAskName}

Walkthroughs seleccionados:
${selected || '(ninguno)'}

${input.languageHint}

Contexto completo:
${input.contextSummary}

Reglas:
- Sostén el hilo conversacional usando el historial.
- Si el usuario confirma/agradece, continúa el tema sin reiniciar.
- No inventes: responde solo con el contexto publicado.
- Si responseType = guide, el mensaje invita a elegir una guía.
- Si responseType = answer, prioriza claridad y precisión contextual.
- No cierres todas las respuestas con signo de interrogación.
- Usa pregunta solo cuando realmente necesitas una decisión del usuario; de lo contrario, cierra enunciando con claridad.
- En saludos o charla social ("hola", "cómo estás"), responde natural y breve sin reformular raro (evita textos como "¿cómo estoy?").
- No uses HTML (ej: <a>, <button>, <div>) ni Markdown de enlaces.
- Entrega texto plano únicamente.
- Si isAnonymous=true y shouldAskName=true y no hay userName, incluye al final una sola pregunta breve para saber cómo llamarle.
- Si userName existe, úsalo de forma natural (máximo una vez por respuesta, sin forzarlo).
- Si el mensaje del usuario es confirmación breve ("sí", "ok", "dale"), responde continuando explícitamente el último mensaje del asistente.
- Evita frases de rechazo genérico como "no podemos ayudarte en este momento" salvo bloqueo de seguridad.
- Devuelve SOLO el texto final (sin JSON, sin etiquetas, sin bloques de código).
`;
        const fallbackMessage = (() => {
            const topFlows = input.walkthroughs.slice(0, 3).map((w) => w.title).join(', ');
            if (intent.responseType === 'guide') {
                return topFlows
                    ? `Puedo guiarte en estos flujos: ${topFlows}. Elige uno y lo iniciamos.`
                    : 'Puedo ayudarte a guiarte, pero no encuentro flujos publicados en este proyecto.';
            }
            return topFlows
                ? `Entiendo. Este software cubre principalmente: ${topFlows}. Te explico la parte que necesites con detalle.`
                : 'Entiendo tu duda. En este momento no veo suficiente contexto publicado para responder con precisión.';
        })();
        try {
            const message = input.streamCallbacks?.onResponsePartial
                ? await input.llm.textStream(prompt, { system: input.systemPrompt }, input.streamCallbacks.onResponsePartial)
                : await input.llm.text(prompt, { system: input.systemPrompt });
            const normalized = (message || '').trim() || fallbackMessage;
            return {
                responseType: intent.responseType === 'guide' ? 'guide' : intent.responseType,
                message: normalized,
            };
        }
        catch {
            return {
                responseType: intent.responseType === 'guide' ? 'guide' : 'answer',
                message: fallbackMessage,
            };
        }
    }
}
exports.ResponseAgent = ResponseAgent;
