"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { ADMIN_LOGIN_URL } from "@/constant/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// LogoutProvider — the "Log out?" confirmation. The sidebar, the mobile menu
// and the profile menu all just call requestLogout(); the dialog lives here
// once, so it survives the menu that opened it closing.
// ─────────────────────────────────────────────────────────────────────────────

const LogoutContext = createContext<{ requestLogout: () => void } | null>(null);

export function LogoutProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const logOut = () => {
        try {
            // No backend is wired up yet — clear the session there once it is
            setIsOpen(false);
            toast.success("You've been logged out");
            router.push(ADMIN_LOGIN_URL);
        } catch {
            toast.error("Couldn't log you out. Please try again.");
        }
    };

    return (
        <LogoutContext.Provider value={{ requestLogout: () => setIsOpen(true) }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Log out?</DialogTitle>
                        <DialogDescription>Are you sure you want to log out?</DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer transition-colors duration-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={logOut}
                            className="h-11 px-5 bg-error-600 hover:bg-error-700 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300"
                        >
                            Yes, Logout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </LogoutContext.Provider>
    );
}

export function useLogout() {
    const context = useContext(LogoutContext);
    if (!context) {
        throw new Error("useLogout must be used within a LogoutProvider");
    }
    return context;
}
