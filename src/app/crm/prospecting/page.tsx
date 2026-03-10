import { getCompaniesByStatus } from "@/app/actions/crm/company-actions";
import ProspectingClient from "./ProspectingClient";

export const dynamic = "force-dynamic";

export default async function ProspectingInboxPage() {
    // Festeamos el payload inicial EN EL SERVIDOR -> renderizado instantaneo
    const res = await getCompaniesByStatus(["COLD", "PROSPECTING"]);
    const initialCompanies = res.success && res.data ? res.data : [];

    return <ProspectingClient initialCompanies={initialCompanies} />;
}
