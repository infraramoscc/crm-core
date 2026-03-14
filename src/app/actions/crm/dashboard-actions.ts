"use server";

import prisma from "@/lib/prisma";

const DASHBOARD_TIMEZONE = "America/Lima";
const LIMA_OFFSET = "-05:00";

function getDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: DASHBOARD_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const get = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
    };
}

function getDateRanges(now = new Date()) {
    const { year, month, day } = getDateParts(now);
    const startOfDay = new Date(`${year}-${month}-${day}T00:00:00${LIMA_OFFSET}`);
    const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999${LIMA_OFFSET}`);
    const startOfMonth = new Date(`${year}-${month}-01T00:00:00${LIMA_OFFSET}`);

    const numericYear = Number(year);
    const numericMonth = Number(month);
    const nextMonth = numericMonth === 12
        ? new Date(`${numericYear + 1}-01-01T00:00:00${LIMA_OFFSET}`)
        : new Date(`${numericYear}-${String(numericMonth + 1).padStart(2, "0")}-01T00:00:00${LIMA_OFFSET}`);
    const endOfMonth = new Date(nextMonth.getTime() - 1);

    return { startOfDay, endOfDay, startOfMonth, endOfMonth };
}

function formatDashboardDate(now = new Date()) {
    return new Intl.DateTimeFormat("es-PE", {
        timeZone: DASHBOARD_TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(now);
}

function formatLossReasons(items: { lossReason: string | null }[]) {
    const reasonCounts = new Map<string, number>();

    for (const item of items) {
        const reason = item.lossReason?.trim() || "Sin motivo registrado";
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }

    return [...reasonCounts.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5);
}

function buildFocusReadout(data: {
    quoteRequestsToday: number;
    opportunitiesToday: number;
    interactionsToday: number;
    overdueFollowUps: number;
    prospectingWithoutNextStep: number;
    investigationWithContactsNoOpinion: number;
    winRateMonth: number | null;
    lostMonth: number;
    negotiatingWithoutQuoteRef: number;
}) {
    const insights: { title: string; detail: string }[] = [];

    if (data.overdueFollowUps > 0) {
        insights.push({
            title: "Fuga principal: seguimiento vencido",
            detail: `Tienes ${data.overdueFollowUps} seguimiento(s) vencido(s). Eso erosiona conversion y hace que el tiempo invertido en caceria se enfrie.`,
        });
    }

    if (data.investigationWithContactsNoOpinion > 0) {
        insights.push({
            title: "Investigacion no esta cerrando criterio",
            detail: `${data.investigationWithContactsNoOpinion} cuenta(s) ya tienen contacto pero no opinion comercial. Ese trabajo aun no produce prioridad real para caceria.`,
        });
    }

    if (data.prospectingWithoutNextStep > 0) {
        insights.push({
            title: "Caceria sin siguiente paso",
            detail: `${data.prospectingWithoutNextStep} cuenta(s) en caceria no tienen seguimiento abierto. Ahi se suele perder tiempo porque la relacion queda sin disciplina.`,
        });
    }

    if (data.negotiatingWithoutQuoteRef > 0) {
        insights.push({
            title: "Negociacion sin trazabilidad",
            detail: `${data.negotiatingWithoutQuoteRef} oportunidad(es) siguen avanzadas sin referencia clara de cotizacion. Eso debilita control comercial.`,
        });
    }

    if (data.interactionsToday > 0 && data.opportunitiesToday === 0 && data.quoteRequestsToday === 0) {
        insights.push({
            title: "Mucho movimiento, poco avance",
            detail: `Hoy registraste ${data.interactionsToday} interaccion(es), pero ninguna termino en oportunidad ni pedido de cotizacion. Revisa segmentacion y calidad del contacto.`,
        });
    }

    if (data.winRateMonth !== null && data.lostMonth > 0) {
        insights.push({
            title: "Lectura de cierre del mes",
            detail: `Tu tasa de cierre del mes va en ${data.winRateMonth}%. Usa los motivos de perdida para identificar si el problema es disciplina, propuesta o segmentacion.`,
        });
    }

    if (insights.length === 0) {
        insights.push({
            title: "Sin fugas criticas visibles",
            detail: "El flujo se ve razonablemente ordenado. El siguiente salto deberia venir de mejorar conversion, no solo volumen de actividad.",
        });
    }

    return insights.slice(0, 4);
}

export async function getDashboardSnapshot() {
    try {
        const now = new Date();
        const { startOfDay, endOfDay, startOfMonth, endOfMonth } = getDateRanges(now);

        const [
            contactsToday,
            interactionsToday,
            opportunitiesToday,
            quoteRequestsToday,
            wonMonth,
            lostMonth,
            openPipeline,
            overdueFollowUps,
            prospectingWithoutNextStep,
            investigationWithContactsNoOpinion,
            investigationBlocked,
            negotiatingWithoutQuoteRef,
            lostReasonsRaw,
        ] = await Promise.all([
            prisma.contact.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            prisma.interaction.count({
                where: {
                    interactedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            prisma.opportunity.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            prisma.interaction.count({
                where: {
                    outcome: "REQUESTED_QUOTE",
                    interactedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
            prisma.opportunity.count({
                where: {
                    stage: "WON",
                    updatedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
            prisma.opportunity.count({
                where: {
                    stage: "LOST",
                    updatedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
            prisma.opportunity.count({
                where: {
                    stage: {
                        in: ["PROSPECTING", "QUOTING", "NEGOTIATING"],
                    },
                },
            }),
            prisma.interaction.count({
                where: {
                    isFollowUpCompleted: false,
                    nextFollowUpDate: {
                        lt: now,
                    },
                },
            }),
            prisma.company.count({
                where: {
                    prospectingStatus: "PROSPECTING",
                    opportunities: { none: {} },
                    contacts: {
                        some: {
                            isActive: true,
                        },
                    },
                    NOT: {
                        interactions: {
                            some: {
                                isFollowUpCompleted: false,
                                nextFollowUpDate: {
                                    not: null,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.company.count({
                where: {
                    opportunities: { none: {} },
                    contacts: {
                        some: {
                            isActive: true,
                        },
                    },
                    OR: [
                        { researchSummary: null },
                        { researchSummary: "" },
                        { researchLastReviewedAt: null },
                    ],
                },
            }),
            prisma.company.count({
                where: {
                    opportunities: { none: {} },
                    researchStatus: {
                        in: ["BLOCKED", "VISIT_REQUIRED"],
                    },
                },
            }),
            prisma.opportunity.count({
                where: {
                    stage: "NEGOTIATING",
                    externalQuoteRef: null,
                },
            }),
            prisma.opportunity.findMany({
                where: {
                    stage: "LOST",
                    updatedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: {
                    lossReason: true,
                },
            }),
        ]);

        const winRateMonth = wonMonth + lostMonth > 0 ? Math.round((wonMonth / (wonMonth + lostMonth)) * 100) : null;
        const interactionToQuoteRateToday = interactionsToday > 0 ? Math.round((quoteRequestsToday / interactionsToday) * 100) : null;
        const interactionToOpportunityRateToday = interactionsToday > 0 ? Math.round((opportunitiesToday / interactionsToday) * 100) : null;

        const snapshot = {
            generatedAtLabel: formatDashboardDate(now),
            pulse: {
                contactsToday,
                interactionsToday,
                opportunitiesToday,
                quoteRequestsToday,
            },
            conversion: {
                wonMonth,
                lostMonth,
                winRateMonth,
                openPipeline,
                interactionToQuoteRateToday,
                interactionToOpportunityRateToday,
            },
            leaks: {
                overdueFollowUps,
                prospectingWithoutNextStep,
                investigationWithContactsNoOpinion,
                investigationBlocked,
                negotiatingWithoutQuoteRef,
            },
            lossReasons: formatLossReasons(lostReasonsRaw),
        };

        return {
            success: true,
            data: {
                ...snapshot,
                focusReadout: buildFocusReadout({
                    quoteRequestsToday,
                    opportunitiesToday,
                    interactionsToday,
                    overdueFollowUps,
                    prospectingWithoutNextStep,
                    investigationWithContactsNoOpinion,
                    winRateMonth,
                    lostMonth,
                    negotiatingWithoutQuoteRef,
                }),
            },
        };
    } catch (error) {
        console.error("Error building dashboard snapshot:", error);
        return { success: false, error: "Failed to build dashboard snapshot" };
    }
}
