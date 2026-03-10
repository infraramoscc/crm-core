import { mockPorts } from "@/lib/mock-data";
import PortsClient from "./PortsClient";

export default function PortsPage() {
    return <PortsClient initialPorts={mockPorts} />;
}
