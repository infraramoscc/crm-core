import { Suspense } from "react";
import TasksClient from "./TasksClient";
import { getPendingTasks } from "@/app/actions/crm/task-actions";

export const metadata = {
    title: "Mis Tareas | CRM Aduanas",
};

export default async function TasksPage() {
    // Fetch initial tasks Server-Side to render instantly
    const result = await getPendingTasks();
    const initialTasks = result.success ? result.data : [];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            <Suspense fallback={<div className="flex items-center justify-center h-[50vh]">Cargando tu agenda...</div>}>
                <TasksClient initialTasks={initialTasks} />
            </Suspense>
        </div>
    );
}
