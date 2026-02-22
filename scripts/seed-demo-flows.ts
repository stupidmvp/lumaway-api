import { eq } from 'drizzle-orm';
import { drizzleAdapter } from '../src/adapters';
import { projects, organizations, walkthroughs, apiKeys } from '../src/db/schema';
import crypto from 'crypto';

const db = (drizzleAdapter as any).db;

async function main() {
    console.log("🌱 Iniciando inserción de Demo Host Walkthroughs (SaaS Logistics)...");

    // 1. Asegurar un entorno Mínimo Viable (Org y Proyecto)
    let orgId = "";
    const allOrgs = await db.select().from(organizations).limit(1);

    if (allOrgs.length === 0) {
        console.log("No Orgs found, creating 'Luma Logistics Org'");
        const newOrg = await db.insert(organizations).values({
            name: "Luma Logistics Org",
            slug: "luma-logistics-org-" + crypto.randomBytes(4).toString('hex')
        }).returning();
        orgId = newOrg[0].id;
    } else {
        orgId = allOrgs[0].id;
    }

    let projectId = "";
    const allProjects = await db.select().from(projects).limit(1);

    if (allProjects.length === 0) {
        console.log("No Projects found, creating 'Demo App Project'");
        const newProj = await db.insert(projects).values({
            name: "Demo App Project (Logistics)",
            organizationId: orgId
        }).returning();
        projectId = newProj[0].id;
    } else {
        projectId = allProjects[0].id;
        console.log("Using existing project:", projectId);
    }

    // Inyectar el API Key para el Demo Host
    const existingKeys = await db.select().from(apiKeys).where(eq(apiKeys.key, 'sk_test_demo'));
    if (existingKeys.length === 0) {
        await db.insert(apiKeys).values({
            key: 'sk_test_demo',
            projectId: projectId,
            name: 'Demo Host Key'
        });
        console.log("🔑 Inyectada API Key: 'sk_test_demo'");
    }

    // 2. Limpiar walkthroughs anteriores del Demo
    console.log("Limpiando walkthroughs viejos del proyecto...");
    await db.delete(walkthroughs).where(eq(walkthroughs.projectId, projectId));

    // 3. Inyectar los 3 flujos del SDD

    // Flujo A: Crear Envío (Orquestador principal)
    const flowA = await db.insert(walkthroughs).values({
        projectId,
        title: "Primer Envío Fácil",
        intent: "quiero mandar un paquete",
        executionMode: "automatic",
        isPublished: true,
        trigger: { type: 'route', value: '/' }, // Salta automático en el Home
        steps: [
            {
                id: crypto.randomUUID(),
                title: "Inicia tu primer envío",
                description: "Haz click en 'Crear Nuevo Envío' para empezar el proceso guiado.",
                purpose: "Guiar al usuario a iniciar la creación de un shipment",
                type: "tooltip",
                target: "#btn-create-shipment",
                placement: "bottom"
            },
            {
                id: crypto.randomUUID(),
                title: "Punto de Origen",
                description: "Indica el código postal de origen.",
                purpose: "Capturar origen del envío",
                type: "tooltip",
                target: "#input-origin",
                placement: "bottom",
                metadata: {
                    route: "/shipments/new"
                }
            },
            {
                id: crypto.randomUUID(),
                title: "Punto de Destino",
                description: "Indica la dirección de destino del paquete.",
                purpose: "Capturar destino del envío",
                type: "tooltip",
                target: "#input-destination",
                placement: "bottom",
                metadata: {
                    route: "/shipments/new"
                }
            },
            {
                id: crypto.randomUUID(),
                title: "Paquetería Preferida",
                description: "Selecciona la paquetería para este envío.",
                purpose: "Elegir transportadora",
                type: "tooltip",
                target: "#select-carrier",
                placement: "right",
                metadata: {
                    route: "/shipments/new"
                }
            },
            {
                id: crypto.randomUUID(),
                title: "Confirma el Envío",
                description: "Revisa los datos y confirma para generar la guía.",
                purpose: "Finalizar creación del envío",
                type: "tooltip",
                target: "#btn-confirm-shipment",
                placement: "top",
                metadata: {
                    route: "/shipments/new"
                }
            }
        ]
    }).returning();

    // Flujo B: Configuración API (Desvío)
    const flowB = await db.insert(walkthroughs).values({
        projectId,
        title: "Seguridad y API",
        intent: "necesito conectar mi tienda",
        executionMode: "automatic",
        isPublished: true,
        trigger: { type: 'intent', value: 'tienda' },
        steps: [
            {
                id: crypto.randomUUID(),
                title: "Ve a Configuración",
                description: "Para conectar tu tienda vía API necesitamos generar una llave. Haz clic en 'Configuración'.",
                type: "tooltip",
                target: "#btn-nav-settings",
                placement: "bottom"
            },
            {
                id: crypto.randomUUID(),
                title: "Integraciones",
                description: "Haz clic en 'Integraciones API' para abrir el panel.",
                type: "tooltip",
                target: "#tab-integrations",
                placement: "right",
                metadata: {
                    route: "/settings"
                }
            },
            {
                id: crypto.randomUUID(),
                title: "Generar Llave",
                description: "¡Listo! Presiona aquí para crear tu llave maestra.",
                type: "tooltip",
                target: "#btn-generate-apikey",
                placement: "top",
                metadata: {
                    route: "/settings"
                }
            }
        ]
    }).returning();

    // Flujo C: Fricción en pagos (Friction)
    const flowC = await db.insert(walkthroughs).values({
        projectId,
        title: "Soporte de Facturación",
        intent: "no entiendo cómo pagar",
        executionMode: "automatic",
        isPublished: true,
        trigger: { type: 'intent', value: 'pagar' },
        steps: [
            {
                id: crypto.randomUUID(),
                title: "¿Necesitas ayuda con los pagos?",
                description: "Veo que tienes dudas sobre facturación. Ve a 'Configuración' -> 'Facturación' para ver tus cobros retenidos.",
                type: "ai-chat"
            }
        ]
    }).returning();

    console.log(`✅ ¡Éxito! Base de datos poblada para Demo Host usando Proyecto [${projectId}]\n`);
    console.log("Flujos inyectados:");
    console.log(`1. ${flowA[0].title} (${flowA[0].id})`);
    console.log(`2. ${flowB[0].title} (${flowB[0].id})`);
    console.log(`3. ${flowC[0].title} (${flowC[0].id})`);

    process.exit(0);
}

main().catch(e => { console.error("❌ Fallo al inyectar DB Seed:"); console.error(e); process.exit(1); });
