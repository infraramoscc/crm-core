"use server";

import prisma from "@/lib/prisma";

const DASHBOARD_TIMEZONE = "America/Lima";
const LIMA_OFFSET = "-05:00";
const EXTERNAL_INTERACTION_TYPES = [
    "EMAIL_SENT",
    "EMAIL_OPENED",
    "CALL_MADE",
    "MEETING",
    "LINKEDIN_CONNECT",
    "LINKEDIN_MESSAGE",
    "WHATSAPP_SENT",
] as const;

function getInteractionChannelLabel(type: string) {
    switch (type) {
        case "EMAIL_SENT":
        case "EMAIL_OPENED":
            return "Email";
        case "CALL_MADE":
            return "Llamada";
        case "MEETING":
            return "Reunion";
        case "LINKEDIN_CONNECT":
        case "LINKEDIN_MESSAGE":
            return "LinkedIn";
        case "WHATSAPP_SENT":
            return "WhatsApp";
        default:
            return null;
    }
}

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

function buildChannelPerformance(
    items: { type: string; outcome: string | null }[]
) {
    const channels = new Map<string, { channel: string; interactions: number; quoteRequests: number }>();

    for (const item of items) {
        const channel = getInteractionChannelLabel(item.type);
        if (!channel) {
            continue;
        }

        const current = channels.get(channel) || {
            channel,
            interactions: 0,
            quoteRequests: 0,
        };

        current.interactions += 1;
        if (item.outcome === "REQUESTED_QUOTE") {
            current.quoteRequests += 1;
        }

        channels.set(channel, current);
    }

    return [...channels.values()]
        .map((item) => ({
            ...item,
            quoteRate: item.interactions > 0 ? Math.round((item.quoteRequests / item.interactions) * 100) : 0,
        }))
        .sort((left, right) => {
            if (right.quoteRequests !== left.quoteRequests) {
                return right.quoteRequests - left.quoteRequests;
            }
            if (right.quoteRate !== left.quoteRate) {
                return right.quoteRate - left.quoteRate;
            }
            return right.interactions - left.interactions;
        })
        .slice(0, 5);
}

function buildQuoteEffortSummary(
    quoteRequestEvents: { companyId: string; interactedAt: Date }[],
    companyInteractions: { companyId: string; interactedAt: Date; direction: string; type: string }[]
) {
    const firstQuoteByCompany = new Map<string, Date>();

    for (const event of quoteRequestEvents) {
        const existing = firstQuoteByCompany.get(event.companyId);
        if (!existing || event.interactedAt < existing) {
            firstQuoteByCompany.set(event.companyId, event.interactedAt);
        }
    }

    const attempts: number[] = [];

    for (const [companyId, firstQuoteAt] of firstQuoteByCompany.entries()) {
        const count = companyInteractions.filter((interaction) =>
            interaction.companyId === companyId &&
            interaction.direction !== "INTERNAL" &&
            EXTERNAL_INTERACTION_TYPES.includes(interaction.type as (typeof EXTERNAL_INTERACTION_TYPES)[number]) &&
            interaction.interactedAt <= firstQuoteAt
        ).length;

        if (count > 0) {
            attempts.push(count);
        }
    }

    if (attempts.length === 0) {
        return {
            quotedCompanies: 0,
            averageAttempts: null,
            medianAttempts: null,
        };
    }

    const sortedAttempts = [...attempts].sort((left, right) => left - right);
    const midpoint = Math.floor(sortedAttempts.length / 2);
    const medianAttempts = sortedAttempts.length % 2 === 0
        ? Number(((sortedAttempts[midpoint - 1] + sortedAttempts[midpoint]) / 2).toFixed(1))
        : sortedAttempts[midpoint];

    return {
        quotedCompanies: attempts.length,
        averageAttempts: Number((attempts.reduce((sum, item) => sum + item, 0) / attempts.length).toFixed(1)),
        medianAttempts,
    };
}

function buildClosureSignals(items: {
    stage: string;
    externalQuoteRef: string | null;
    interactions: {
        type: string;
        purpose: string;
    }[];
}[]) {
    const summarize = (stage: "WON" | "LOST") => {
        const subset = items.filter((item) => item.stage === stage);
        if (subset.length === 0) {
            return {
                count: 0,
                averageInteractions: null,
                meetingRate: null,
                quoteDisciplineRate: null,
                negotiationSignalRate: null,
            };
        }

        const totalInteractions = subset.reduce((sum, item) => sum + item.interactions.length, 0);
        const withMeeting = subset.filter((item) =>
            item.interactions.some((interaction) => interaction.type === "MEETING")
        ).length;
        const withQuoteDiscipline = subset.filter((item) => Boolean(item.externalQuoteRef?.trim())).length;
        const withNegotiationSignal = subset.filter((item) =>
            item.interactions.some((interaction) => interaction.purpose === "QUOTE" || interaction.purpose === "NEGOTIATION")
        ).length;

        return {
            count: subset.length,
            averageInteractions: Number((totalInteractions / subset.length).toFixed(1)),
            meetingRate: Math.round((withMeeting / subset.length) * 100),
            quoteDisciplineRate: Math.round((withQuoteDiscipline / subset.length) * 100),
            negotiationSignalRate: Math.round((withNegotiationSignal / subset.length) * 100),
        };
    };

    return {
        won: summarize("WON"),
        lost: summarize("LOST"),
    };
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
            title: "Caceria sin criterio registrado",
            detail: `${data.investigationWithContactsNoOpinion} cuenta(s) ya estan en caceria con contacto activo pero todavia sin opinion comercial registrada en el timeline.`,
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
            monthlyExternalInteractions,
            monthlyQuoteRequestEvents,
            monthlyClosedOpportunities,
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
                    prospectingStatus: {
                        in: ["COLD", "PROSPECTING"],
                    },
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
            prisma.interaction.findMany({
                where: {
                    interactedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                    direction: {
                        not: "INTERNAL",
                    },
                    type: {
                        in: [...EXTERNAL_INTERACTION_TYPES],
                    },
                },
                select: {
                    companyId: true,
                    type: true,
                    outcome: true,
                    interactedAt: true,
                    direction: true,
                },
            }),
            prisma.interaction.findMany({
                where: {
                    outcome: "REQUESTED_QUOTE",
                    interactedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: {
                    companyId: true,
                    interactedAt: true,
                },
                orderBy: {
                    interactedAt: "asc",
                },
            }),
            prisma.opportunity.findMany({
                where: {
                    stage: {
                        in: ["WON", "LOST"],
                    },
                    updatedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: {
                    stage: true,
                    externalQuoteRef: true,
                    interactions: {
                        select: {
                            type: true,
                            purpose: true,
                        },
                    },
                },
            }),
        ]);

        const quoteRequestCompanyIds = [...new Set(monthlyQuoteRequestEvents.map((event) => event.companyId))];
        const interactionsBeforeQuote = quoteRequestCompanyIds.length > 0
            ? await prisma.interaction.findMany({
                where: {
                    companyId: {
                        in: quoteRequestCompanyIds,
                    },
                    interactedAt: {
                        lte: endOfMonth,
                    },
                },
                select: {
                    companyId: true,
                    interactedAt: true,
                    direction: true,
                    type: true,
                },
            })
            : [];

        const winRateMonth = wonMonth + lostMonth > 0 ? Math.round((wonMonth / (wonMonth + lostMonth)) * 100) : null;
        const interactionToQuoteRateToday = interactionsToday > 0 ? Math.round((quoteRequestsToday / interactionsToday) * 100) : null;
        const interactionToOpportunityRateToday = interactionsToday > 0 ? Math.round((opportunitiesToday / interactionsToday) * 100) : null;
        const channelPerformance = buildChannelPerformance(monthlyExternalInteractions);
        const quoteEffort = buildQuoteEffortSummary(monthlyQuoteRequestEvents, interactionsBeforeQuote);
        const closureSignals = buildClosureSignals(monthlyClosedOpportunities);

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
            ledgerLearning: {
                channelPerformance,
                quoteEffort,
                closureSignals,
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
