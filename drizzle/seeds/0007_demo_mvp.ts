import { drizzleAdapter } from '../../src/adapters';
import { apiKeys, projects, walkthroughs, walkthroughVersions } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const db = (drizzleAdapter as any).db;

/**
 * Personalidad de Luma para el demo-host.
 * La personalidad se define aquí (seed) y en producción en Project Settings del CMS:
 * - assistantName, assistantWelcomeMessage, assistantSystemPrompt.
 * El backend los usa en: lumaway-api/src/services/ai-chat/hooks/handleAiChat.ts
 * (buildSystemPrompt + project.settings.assistantSystemPrompt).
 */
const DEMO_PROJECT_SETTINGS = {
    assistantEnabled: true,
    defaultLocale: 'es-CO',
    supportedLocales: ['es-CO', 'en-US'],
    assistantName: 'Luma',
    assistantWelcomeMessage: '¡Hola! Soy Luma, tu asistente de logística. Puedo guiarte por el Dashboard, crear un nuevo envío, gestionar Ajustes o revisar tu Perfil. ¿En qué puedo ayudarte hoy?',
    assistantSystemPrompt: `CONTEXTO DE PRODUCTO (LumaLogistics):
LumaLogistics es una plataforma operativa para gestionar envíos, monitorear métricas de desempeño y configurar integraciones del equipo logístico.

OBJETIVO DEL SOPORTE:
- Resolver dudas de negocio/proceso con precisión y continuidad conversacional.
- Guiar paso a paso cuando el usuario quiere ejecutar una tarea.
- Mantener respuestas claras, concretas y accionables.

SIGNIFICADO DE MÉTRICAS CLAVE:
- "Envíos este mes": volumen total de guías generadas en el período.
- "Gasto acumulado": costo total agregado de envíos en el período.
- "Tasa de entrega (24h)": porcentaje de envíos entregados dentro de 24 horas.

FLOJOS PRINCIPALES:
- Dashboard y Estadísticas: lectura operativa y salud del desempeño.
- Nuevo Envío Paso a Paso: creación de guías de envío.
- Configuración y Perfil: ajustes de cuenta, preferencias e integraciones.

CRITERIOS DE RESPUESTA:
- Si el usuario pregunta "qué es", "para qué sirve", "cómo funciona": prioriza explicar contexto funcional.
- Si el usuario pide ejecutar una tarea: sugiere guía relevante con IDs correctos.
- Si el usuario confirma ("ok", "super", "dale"): no reinicies conversación; continúa el hilo.

IMPORTANTE:
- Usa únicamente información del contexto publicado.
- No inventes funcionalidades, métricas o pantallas inexistentes.
- Mantén el idioma del usuario.`,
    chatbotEnabled: true,
    chatbotUi: {
        template: 'default',
        position: 'bottom-right',
        primaryColor: '#4f46e5',
        secondaryColor: '#9333ea',
        surfaceColor: '#ffffff',
        chatWidth: 380,
        chatHeight: 520,
        triggerSize: 64,
    },
    mode: 'guided' as const,
};

/**
 * Seed data specifically for the Phase 6 Demo Host.
 */
export async function seed(context: any) {
    console.log('🌱 Seeding Phase 6 Logistics Demo Data...');

    const project = context.projects?.scooticketApp;
    if (!project) {
        console.error('   ❌ Project "scooticketApp" not found in context.');
        return;
    }

    // 0. Project settings for demo-host
    await db.update(projects)
        .set({
            settings: { ...(project.settings || {}), ...DEMO_PROJECT_SETTINGS },
            updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));
    console.log('   ✅ Demo logistics settings set.');

    // 1. Ensure sk_test_demo exists for this project
    await db.insert(apiKeys)
        .values({
            key: 'sk_test_demo',
            projectId: project.id,
            name: 'Demo Host Key',
        })
        .onConflictDoUpdate({
            target: apiKeys.key,
            set: { projectId: project.id }
        });

    console.log('   ✅ API Key "sk_test_demo" registered.');

    // 2. Delete old walkthroughs
    await db.delete(walkthroughs).where(eq(walkthroughs.projectId, project.id));
    console.log('   🗑️ Cleaned up old walkthroughs');

    // 3. Create Orchestrator
    const [orchestrator] = await db.insert(walkthroughs)
        .values({
            projectId: project.id,
            title: 'Tour Logístico Principal',
            description: 'Guía completa para dominar la gestión de envíos y estadísticas.',
            steps: [],
            isPublished: true,
            tags: ['onboarding', 'logística'],
        })
        .returning();

    // 4. Flow 1: Dashboard
    const flowDashboardData = {
        projectId: project.id,
        title: 'Dashboard y Estadísticas',
        description: 'Explora tu centro de mando y entiende tus métricas de envío.',
        steps: [
            {
                id: 'step-dash-1',
                title: 'Bienvenido',
                description: '👋 ¡Hola! Soy Luma. Este es tu Dashboard, donde verás el flujo de tus envíos en tiempo real.',
                purpose: 'Bienvenida',
                target: '#stats-section',
                metadata: { route: '/' }
            },
            {
                id: 'step-dash-2',
                title: 'Envíos Activos',
                description: '📦 Aquí verás cuántos paquetes están en tránsito actualmente.',
                purpose: 'Métrica envíos',
                target: '#stat-shipments',
                metadata: { route: '/' }
            },
            {
                id: 'step-dash-3',
                title: 'Gasto Acumulado',
                description: '💰 Este indicador muestra el costo total acumulado de tus envíos en el período actual.',
                purpose: 'Métrica de costos',
                target: '#stat-spend',
                metadata: { route: '/' }
            },
            {
                id: 'step-dash-4',
                title: 'Tasa de Entrega (24h)',
                description: '✅ Aquí ves el porcentaje de envíos entregados dentro de las primeras 24 horas.',
                purpose: 'Métrica de servicio',
                target: '#stat-delivery-rate',
                metadata: { route: '/' }
            },
            {
                id: 'step-dash-5',
                title: 'Rendimiento Mensual',
                description: '📈 Este gráfico muestra la tendencia de desempeño de tus envíos.',
                purpose: 'Visualización de datos',
                target: '#chart-performance',
                metadata: { route: '/' }
            }
        ],
        parentId: orchestrator.id,
        isPublished: true,
    };

    const [flowDashboard] = await db.insert(walkthroughs).values(flowDashboardData).returning();

    // 5. Flow 2: Configuración (Multi-route)
    const flowConfigData = {
        projectId: project.id,
        title: 'Configuración y Perfil',
        description: 'Personaliza tu panel logístico y gestiona tu cuenta.',
        steps: [
            {
                id: 'step-cfg-1',
                title: 'Ir a Ajustes',
                description: '⚙️ Primero, vamos a configurar tus preferencias de transporte.',
                purpose: 'Navegación',
                target: '#btn-nav-settings',
                metadata: { route: '/' }
            },
            {
                id: 'step-cfg-2',
                title: 'Interfaz Visual',
                description: '🎨 Cambia el tema para una mejor visibilidad en turnos nocturnos.',
                purpose: 'Personalización',
                target: 'button[aria-label="Toggle theme"]',
                metadata: { route: '/settings' }
            },
            {
                id: 'step-cfg-3',
                title: 'Alertas de Seguimiento',
                description: '🔔 Configura cómo quieres recibir las alertas de entrega.',
                purpose: 'Alertas',
                target: '#tab-integrations',
                metadata: { route: '/settings' }
            },
            {
                id: 'step-cfg-4',
                title: 'Mi Perfil Operativo',
                description: '👤 Ahora revisemos tus credenciales.',
                purpose: 'Navegación perfil',
                target: '#btn-generate-apikey',
                metadata: { route: '/settings' }
            },
            {
                id: 'step-cfg-5',
                title: 'Datos de Usuario',
                description: '📝 Actualiza tu información de contacto corporativo aquí.',
                purpose: 'Datos usuario',
                target: '#btn-generate-apikey',
                metadata: { route: '/settings' }
            }
        ],
        parentId: orchestrator.id,
        previousWalkthroughId: flowDashboard.id,
        isPublished: true,
    };

    const [flowConfig] = await db.insert(walkthroughs).values(flowConfigData).returning();
    await db.update(walkthroughs).set({ nextWalkthroughId: flowConfig.id }).where(eq(walkthroughs.id, flowDashboard.id));

    // 6. Flow 3: Nuevo Envío
    const flowShipmentData = {
        projectId: project.id,
        title: 'Nuevo Envío Paso a Paso',
        description: 'Aprende a generar una guía de envío en segundos.',
        steps: [
            {
                id: 'step-ship-1',
                title: 'Iniciar Envío',
                description: '📦 Haz clic aquí para comenzar el registro de un paquete.',
                purpose: 'Inicio envío',
                target: '#btn-create-shipment',
                metadata: { route: '/' }
            },
            {
                id: 'step-ship-2',
                title: 'Punto de Origen',
                description: '📍 Indica la ubicación de recolección.',
                purpose: 'Origen',
                target: '#input-origin',
                metadata: { route: '/shipments/new' }
            },
            {
                id: 'step-ship-3',
                title: 'Punto de Destino',
                description: '🏁 Indica a dónde vamos a entregar.',
                purpose: 'Destino',
                target: '#input-destination',
                metadata: { route: '/shipments/new' }
            },
            {
                id: 'step-ship-4',
                title: 'Paquetería Preferida',
                description: '🚚 Elige la paquetería con la que enviarás este paquete.',
                purpose: 'Selección de paquetería',
                target: '#select-carrier',
                metadata: { route: '/shipments/new' }
            },
            {
                id: 'step-ship-5',
                title: 'Finalizar Guía',
                description: '✅ ¡Listo! Confirma los datos para imprimir tu guía.',
                purpose: 'Confirmación',
                target: '#btn-confirm-shipment',
                metadata: { route: '/shipments/new' }
            }
        ],
        parentId: orchestrator.id,
        previousWalkthroughId: flowConfig.id,
        isPublished: true,
    };

    const [flowShipment] = await db.insert(walkthroughs).values(flowShipmentData).returning();
    await db.update(walkthroughs).set({ nextWalkthroughId: flowShipment.id }).where(eq(walkthroughs.id, flowConfig.id));

    // 8. Versions
    const allWalkthroughs = [orchestrator, flowDashboard, flowConfig, flowShipment];
    for (const wt of allWalkthroughs) {
        await db.insert(walkthroughVersions)
            .values({
                walkthroughId: wt.id,
                versionNumber: 1,
                title: 'Logistics Demo v1',
                isPublished: true,
                steps: wt.steps || [],
            });
    }

    return { orchestrator, flows: [flowDashboard, flowConfig, flowShipment] };
}
