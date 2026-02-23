"use client";

import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { data: session, status, update } = useSession();

  const logout = useCallback(async () => {
    await signOut({ redirect: true, redirectTo: "/login" });
  }, []);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;

  return {
    session,
    user,
    status,
    isAuthenticated,
    isLoading,
    logout,
    update,
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  if (isLoading) {
    return { isReady: false, isAuthenticated };
  }

  return { isReady: true, isAuthenticated };
}

export function useRole() {
  const { user } = useAuth();
  const role = (user as { role?: string })?.role;

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isUser = role === "user";

  return {
    role,
    isAdmin,
    isModerator,
    isUser,
  };
}
