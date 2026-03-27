type InteractionLike = {
    type: string;
    purpose?: string | null;
    notes?: string | null;
};

type CommercialOpinionLike = {
    researchSummary?: string | null;
    researchLastFinding?: string | null;
    researchNextAction?: string | null;
};

export function buildCommercialOpinionNote(data: CommercialOpinionLike) {
    return [
        data.researchSummary?.trim() ? `Opinion comercial: ${data.researchSummary.trim()}` : null,
        data.researchLastFinding?.trim() ? `Hallazgo: ${data.researchLastFinding.trim()}` : null,
        data.researchNextAction?.trim() ? `Siguiente accion: ${data.researchNextAction.trim()}` : null,
    ]
        .filter(Boolean)
        .join("\n");
}

export function isCommercialOpinionInteraction(interaction: InteractionLike) {
    return interaction.type === "SYSTEM_NOTE"
        && (
            interaction.purpose === "RESEARCH"
            || interaction.notes?.startsWith("Opinion comercial:")
            || interaction.notes?.startsWith("Opinión comercial:")
        );
}

export function getInteractionDisplayLabel(interaction: InteractionLike) {
    if (isCommercialOpinionInteraction(interaction)) {
        return "Opinion comercial";
    }

    switch (interaction.type) {
        case "EMAIL_SENT":
            return "Correo enviado";
        case "EMAIL_OPENED":
            return "Correo abierto";
        case "CALL_MADE":
            return "Llamada";
        case "MEETING":
            return "Reunion / Visita";
        case "LINKEDIN_CONNECT":
            return "Conexion LinkedIn";
        case "LINKEDIN_MESSAGE":
            return "Mensaje LinkedIn";
        case "WHATSAPP_SENT":
            return "WhatsApp";
        case "SYSTEM_NOTE":
            return "Nota interna";
        default:
            return interaction.type;
    }
}
