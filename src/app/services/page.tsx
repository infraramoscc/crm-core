import { mockServices } from "@/lib/mock-data";
import ServicesClient from "./ServicesClient";

export default function ServicesPage() {
    return <ServicesClient initialServices={mockServices} />;
}
