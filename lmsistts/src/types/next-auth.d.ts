// lmsistts\src\types\next-auth.d.ts

import NextAuth, { type DefaultSession } from "next-auth";

type UserRole = "admin" | "lecturer" | "student";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
