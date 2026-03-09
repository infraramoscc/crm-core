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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">
                    {title || "Formulario"}
                </DialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    );
}
