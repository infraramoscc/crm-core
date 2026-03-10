"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function InterceptedModal({
    children,
    title,
}: {
    children: React.ReactNode;
    title?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(true);

    const onDismiss = useCallback(() => {
        setOpen(false);
        setTimeout(() => {
            router.back();
        }, 150);
    }, [router]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) onDismiss();
        }}>
            <DialogContent className="w-[95vw] !max-w-5xl md:w-[80vw] lg:w-[70vw] max-h-[90vh] overflow-y-auto duration-200">
                <DialogTitle className="sr-only">
                    {title || "Formulario"}
                </DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    );
}
