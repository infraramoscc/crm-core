import { getCompaniesForInvestigation } from "@/app/actions/crm/company-actions";
import InvestigationClient from "./InvestigationClient";

export const dynamic = "force-dynamic";

export default async function InvestigationInboxPage() {
    const res = await getCompaniesForInvestigation();
    const companies = res.success && res.data ? res.data : [];

    return <InvestigationClient initialCompanies={companies} />;
}
