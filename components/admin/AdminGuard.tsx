"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function AdminGuard({
  children,
  requiredPermission,
}: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as
    | { role?: string; permissions?: string[] }
    | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login?callbackUrl=/admin");
      return;
    }
    if (user?.role !== "admin" && user?.role !== "moderator") {
      router.replace("/");
      return;
    }
    if (
      requiredPermission &&
      user?.role !== "admin" &&
      !user?.permissions?.includes(requiredPermission)
    ) {
      router.replace("/admin");
    }
  }, [session, status, user, requiredPermission, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Spinner size="lg" className="text-accent-teal" />
      </div>
    );
  }

  if (!session || (user?.role !== "admin" && user?.role !== "moderator")) {
    return null;
  }

  if (
    requiredPermission &&
    user?.role !== "admin" &&
    !user?.permissions?.includes(requiredPermission)
  ) {
    return null;
  }

  return <>{children}</>;
}
