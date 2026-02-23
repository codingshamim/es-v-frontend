"use client";

import { useRequireAuth } from "@/lib/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { ReactNode } from "react";

interface ProfileGuardProps {
  children: ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { isReady, isAuthenticated } = useRequireAuth("/login");

  if (!isReady || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-black dark:text-white" />
      </div>
    );
  }

  return <>{children}</>;
}
