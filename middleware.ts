import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/auth.edge.config";
import { NextResponse } from "next/server";

export default NextAuth(edgeAuthConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { id?: string; role?: string } | undefined;

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.role;
    if (role !== "admin" && role !== "moderator") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
