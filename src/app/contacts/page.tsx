import { getAllContacts } from "@/app/actions/crm/contact-actions";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
    const result = await getAllContacts();
    const contacts = result.data || [];

    return <ContactsClient initialContacts={contacts} />;
}
