import { getAllCompanies } from "@/app/actions/crm/company-actions";
import CompaniesClient from "./CompaniesClient";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
    const result = await getAllCompanies();
    const companies = result.data || [];

    return <CompaniesClient initialCompanies={companies} />;
}
