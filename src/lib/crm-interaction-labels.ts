type InteractionLike = {
    type: string;
    purpose?: string | null;
    notes?: string | null;
};

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
