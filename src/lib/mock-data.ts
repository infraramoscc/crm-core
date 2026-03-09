export type CompanyType = "CLIENT" | "AGENT" | "CUSTOMS" | "TRANSPORTER" | "LINE" | "WAREHOUSE" | "OTHER";
export type ProspectingStatus = "COLD" | "PROSPECTING" | "QUALIFIED" | "CUSTOMER" | "DISQUALIFIED";
export type ImportVolume = "NEW" | "LOW" | "MED" | "HIGH";
export type ValueDriver = "PRICE" | "EXPERIENCE" | "SPEED" | "UNKNOWN";

export interface Company {
    id: string;
    businessName: string;
    tradeName?: string;
    documentType: string;
    documentNumber: string;
    companyType: CompanyType;
    address?: string;
    countryCode?: string;
    city?: string;
    isActive: boolean;
    // CRM
    prospectingStatus: ProspectingStatus;
    disqualificationReason?: string;
    importVolume?: ImportVolume;
    valueDriver: ValueDriver;
    strategyTags?: string;
    leadScore: number;
}

export const mockCompanies: Company[] = [
    {
        id: "1",
        businessName: "Importaciones Globales S.A.C.",
        tradeName: "Global Imports",
        documentType: "RUC",
        documentNumber: "20123456781",
        companyType: "CLIENT",
        address: "Av. Las Flores 123",
        countryCode: "PE",
        city: "Lima",
        isActive: true,
        prospectingStatus: "CUSTOMER",
        importVolume: "HIGH",
        valueDriver: "EXPERIENCE",
        strategyTags: "Cuenta VIP, No presionar por volumen",
        leadScore: 85,
    },
    {
        id: "2",
        businessName: "Agencia Marítima Callao S.A.",
        tradeName: "AMC Logística",
        documentType: "RUC",
        documentNumber: "20987654321",
        companyType: "AGENT",
        address: "Calle Los Puertos 456",
        countryCode: "PE",
        city: "Callao",
        isActive: true,
        prospectingStatus: "QUALIFIED",
        importVolume: "MED",
        valueDriver: "SPEED",
        leadScore: 60,
    },
    {
        id: "3",
        businessName: "Transportes Rápidos EIRL",
        tradeName: "",
        documentType: "RUC",
        documentNumber: "10456789123",
        companyType: "TRANSPORTER",
        address: "Av. Panamericana Sur Km 15",
        countryCode: "PE",
        city: "Lima",
        isActive: true,
        prospectingStatus: "COLD",
        valueDriver: "PRICE",
        leadScore: 10,
    },
    {
        id: "4",
        businessName: "Maersk Line Peru",
        tradeName: "Maersk",
        documentType: "RUC",
        documentNumber: "20555555555",
        companyType: "LINE",
        address: "Av. Víctor Andrés Belaúnde 147",
        countryCode: "PE",
        city: "Lima",
        isActive: true,
        prospectingStatus: "COLD",
        importVolume: "HIGH",
        valueDriver: "UNKNOWN",
        leadScore: 0,
    },
];

export interface Contact {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    emails?: string[];
    phones?: string[];
    position?: string;
    birthday?: string; // Usaremos ISO Strings para simplificar por ahora
    anniversary?: string;
    interests?: string;
    notes?: string;
    engagementScore: number;
    isActive: boolean;
}

export const mockContacts: Contact[] = [
    {
        id: "1",
        companyId: "1", // Importaciones Globales S.A.C.
        firstName: "Carlos",
        lastName: "Ramírez",
        emails: ["carlos.r@globalimports.pe"],
        phones: ["+51 987 654 321"],
        position: "Gerente de Logística",
        birthday: "1985-04-12",
        interests: "Vino Tinto, Fútbol (Alianza Lima)",
        notes: "Cliente muy analítico, presentarle datos de ahorros.",
        engagementScore: 45,
        isActive: true,
    },
    {
        id: "c2",
        companyId: "1",
        firstName: "Juan",
        lastName: "Soto",
        emails: ["jsoto@globalimports.pe"],
        phones: ["+51 987 654 321"],
        position: "Jefe de Compras",
        isActive: true,
        engagementScore: 25,
        birthday: "1985-11-20"
    },
    {
        id: "2",
        companyId: "1", // Importaciones Globales S.A.C.
        firstName: "Ana",
        lastName: "Gómez",
        emails: ["ana.g@globalimports.pe"],
        phones: ["+51 912 345 678"],
        position: "Asistente de Importaciones",
        engagementScore: 10,
        isActive: true,
    },
    {
        id: "3",
        companyId: "2", // Agencia Marítima Callao
        firstName: "Luis",
        lastName: "Fernández",
        emails: ["lfernandez@amc.pe"],
        phones: ["+51 999 888 777"],
        position: "Sectorista de Aduanas",
        anniversary: "2018-08-15",
        interests: "Pádel, Cerveza artesanal",
        notes: "Suele responder más rápido por WhatsApp que por email.",
        engagementScore: 30,
        isActive: true,
    },
    {
        id: "c1",
        companyId: "1",
        firstName: "María",
        lastName: "Pérez",
        emails: ["maria.perez@globalimports.pe"],
        phones: ["+51 999 888 777"],
        position: "Gerente General",
        isActive: true,
        engagementScore: 40,
        notes: "Le gusta que la contacten por WhatsApp."
    },
    {
        id: "4",
        companyId: "4", // Maersk Line
        firstName: "Maria",
        lastName: "Perez",
        emails: ["maria.perez@maersk.com"],
        phones: ["01 555-4444"],
        position: "Customer Service",
        engagementScore: 0,
        isActive: true,
    },
];

export type PortType = "SEA" | "AIR" | "LAND";

export interface Port {
    id: string;
    code: string; // UN/LOCODE (Ej: PEPRU)
    name: string;
    countryCode: string;
    type: PortType;
    isActive: boolean;
}

export const mockPorts: Port[] = [
    {
        id: "1",
        code: "PEPRU",
        name: "Callao Muelle Sur / Norte",
        countryCode: "PE",
        type: "SEA",
        isActive: true,
    },
    {
        id: "2",
        code: "PELIM",
        name: "Aeropuerto Internacional Jorge Chávez",
        countryCode: "PE",
        type: "AIR",
        isActive: true,
    },
    {
        id: "3",
        code: "USMIA",
        name: "Miami International Airport",
        countryCode: "US",
        type: "AIR",
        isActive: true,
    },
    {
        id: "4",
        code: "CNSHA",
        name: "Shanghai Port",
        countryCode: "CN",
        type: "SEA",
        isActive: true,
    },
];

export type ServiceCategory = "LOGISTICS" | "CUSTOMS" | "TRANSPORT" | "WAREHOUSE" | "OTHER";

export interface Service {
    id: string;
    code: string;
    name: string;
    category: ServiceCategory;
    defaultPrice?: number;
    currencyCode?: string;
    isActive: boolean;
}

export const mockServices: Service[] = [
    {
        id: "1",
        code: "SRV-001",
        name: "Agenciamiento de Aduana (Impo)",
        category: "CUSTOMS",
        defaultPrice: 150.0,
        currencyCode: "USD",
        isActive: true,
    },
    {
        id: "2",
        code: "SRV-002",
        name: "Flete Marítimo FCL 20'",
        category: "LOGISTICS",
        defaultPrice: 1200.0,
        currencyCode: "USD",
        isActive: true,
    },
    {
        id: "3",
        code: "SRV-003",
        name: "Transporte Local - Zona 1",
        category: "TRANSPORT",
        defaultPrice: 350.0,
        currencyCode: "PEN",
        isActive: true,
    },
    {
        id: "4",
        code: "SRV-004",
        name: "Visto Bueno Línea Naviera",
        category: "LOGISTICS",
        defaultPrice: 85.0,
        currencyCode: "USD",
        isActive: true,
    },
];

export type InteractionType = "EMAIL_SENT" | "EMAIL_OPENED" | "CALL_MADE" | "MEETING";

export interface Interaction {
    id: string;
    companyId: string;
    contactId?: string;
    opportunityId?: string;
    type: InteractionType;
    notes?: string;
    scoreImpact: number;
    interactedAt: string;
    nextFollowUpDate?: string;
    isFollowUpCompleted?: boolean;
}

export const mockInteractions: Interaction[] = [
    {
        id: "1",
        companyId: "1",
        contactId: "1",
        type: "MEETING",
        notes: "Reunión inicial en sus oficinas. Presentamos credenciales y comentaron sobre problemas con su actual agente en tiempos libres.",
        scoreImpact: 20,
        interactedAt: "2026-02-25T10:00:00Z",
    },
    {
        id: "2",
        companyId: "1",
        contactId: "1",
        type: "EMAIL_OPENED",
        notes: "Abrió el correo con el tarifario de Asia. Sugirió llamarlo el viernes.",
        scoreImpact: 5,
        interactedAt: "2026-02-26T14:30:00Z",
        nextFollowUpDate: new Date().toISOString().split('T')[0], // "Hoy"
        isFollowUpCompleted: false,
    },
];

export type OpportunityStage = "PROSPECTING" | "QUOTING" | "NEGOTIATING" | "WON" | "LOST";

export interface Opportunity {
    id: string;
    companyId: string;
    contactId?: string; // Para mock
    title: string;
    stage: OpportunityStage;
    lossReason?: string;
    expectedValue?: number;
    expectedCurrency: string;
    closeDate?: string;
}

export const mockOpportunities: Opportunity[] = [
    {
        id: "1",
        companyId: "1",
        contactId: "1",
        title: "Impo FCL x 10 Contenedores (China-Callao)",
        stage: "QUOTING",
        expectedValue: 15000,
        expectedCurrency: "USD",
        closeDate: "2026-03-15",
    },
    {
        id: "2",
        companyId: "2",
        contactId: "3",
        title: "Servicio Mensual de Agenciamiento Terrestre",
        stage: "NEGOTIATING",
        expectedValue: 5000,
        expectedCurrency: "USD",
        closeDate: "2026-03-05",
    },
    {
        id: "3",
        companyId: "3",
        title: "Transporte Local Granel 40'",
        stage: "PROSPECTING",
        expectedValue: 1200,
        expectedCurrency: "PEN",
        closeDate: "2026-04-10",
    },
];
