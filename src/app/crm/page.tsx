import { getPipelineOpportunities } from "@/app/actions/crm/crm-actions";
import PipelineClient from "./PipelineClient";

export const dynamic = "force-dynamic";

export default async function CrmPipelinePage() {
    const res = await getPipelineOpportunities();
    const opportunities = res.success && res.data ? res.data : [];

    return <PipelineClient initialOpportunities={opportunities} />
}
