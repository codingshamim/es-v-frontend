"use client";

import { useSession } from "next-auth/react";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { NavButtons } from "./NavButtons";
import { UserMenu } from "./UserMenu";

export function AuthNav() {
  const { status } = useSession();

  // Avoid showing the wrong UI briefly while the session is loading
  if (status === "loading") {
    return (
      <nav className="flex items-center gap-3" aria-label="User navigation">
        <DarkModeToggle />
      </nav>
    );
  }

  if (status === "authenticated") {
    return (
      <nav className="flex items-center gap-3" aria-label="User navigation">
        <DarkModeToggle />
        <UserMenu />
      </nav>
    );
  }

  return <NavButtons />;
}
