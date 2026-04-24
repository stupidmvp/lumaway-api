import type { IntentDecision, RetrievalDecision, ResponseDecision, TeamInput } from './types';

function sanitizeUserFacingMessage(message: string): string {
    if (!message) return '';
    let clean = message;
    clean = clean.replace(/\[\s*(target|selector|dom|elemento)\s*:\s*#[^\]]+\]/gi, '');
    clean = clean.replace(/\b(target|selector|dom|elemento)\s*:\s*#[a-z0-9\-_:.]+/gi, '');
    clean = clean.replace(/\(\s*#[a-z0-9\-_:.]+\s*\)/gi, '');
    clean = clean.replace(/\bID\s*:\s*"?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"?/gi, '');
    clean = clean.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '');
    clean = clean.replace(/[ \t]{2,}/g, ' ');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    clean = clean.trim();
    // Guardrail for truncated tails like dangling opening marks.
    if (/[¿¡\(\[\{:"'\-–—]\s*$/.test(clean)) {
        clean = clean.replace(/[¿¡\(\[\{:"'\-–—]\s*$/, '').trim();
    }
    if (clean && !/[.!?…]$/.test(clean)) {
        clean = `${clean}.`;
    }
    return clean;
}

export class ResponseAgent {
    async run(input: TeamInput, intent: IntentDecision, retrieval: RetrievalDecision): Promise<ResponseDecision> {
        const selected = retrieval.suggestedWalkthroughIds
            .map((id) => input.walkthroughs.find((w) => w.id === id))
            .filter((w): w is NonNullable<typeof w> => Boolean(w))
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
- No muestres referencias técnicas del DOM al usuario (ej. target, selector, #id, CSS path).
- Nunca muestres IDs internos, UUIDs, ni etiquetas como "ID: ...".
- Si el usuario ya pidió una acción concreta (ej. "crea un envío con ..."), no lo frenes pidiendo elegir guía; confirma ejecución y continúa.
- Nunca digas que perdiste historial, contexto o memoria. Nunca menciones borrado de conversación.
- Si falta contexto, haz una pregunta breve de aclaración sin culpar al sistema.
- Si isAnonymous=true y shouldAskName=true y no hay userName, incluye al final una sola pregunta breve para saber cómo llamarle.
- Si userName existe, úsalo de forma natural (máximo una vez por respuesta, sin forzarlo).
- Si el mensaje del usuario es confirmación breve ("sí", "ok", "dale"), responde continuando explícitamente el último mensaje del asistente.
- Si el usuario responde con "gracias", "super", "perfecto" o similar, reconoce brevemente y continúa el tema vigente sin resetear contexto.
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
                ? await input.llm.textStream(
                    prompt,
                    { system: input.systemPrompt },
                    (partial, delta) => {
                        const safePartial = sanitizeUserFacingMessage(partial);
                        const safeDelta = sanitizeUserFacingMessage(delta);
                        input.streamCallbacks?.onResponsePartial?.(safePartial, safeDelta);
                    }
                )
                : await input.llm.text(prompt, { system: input.systemPrompt });

            const normalized = sanitizeUserFacingMessage((message || '').trim()) || fallbackMessage;
            return {
                responseType: intent.responseType === 'guide' ? 'guide' : intent.responseType,
                message: normalized,
            };
        } catch {
            return {
                responseType: intent.responseType === 'guide' ? 'guide' : 'answer',
                message: fallbackMessage,
            };
        }
    }
}
