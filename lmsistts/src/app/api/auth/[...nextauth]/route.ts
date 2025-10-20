// lmsistts\src\app\api\auth\[...nextauth]\route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models";
import { loginSchema } from "@/lib/schemas/user.schema";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await User.findOne({ where: { email } });

          if (!user) {
            return null;
          }

          if (!user.dataValues.password_hash) {
            return null;
          }
          const passwordsMatch = await bcrypt.compare(
            password,
            user.dataValues.password_hash
          );

          if (passwordsMatch) {
            return {
              id: String(user.user_id),
              email: user.email,
              name: user.getFullName(),
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false;
        try {
          const existingUser = await User.findOne({
            where: { email: user.email },
          });
          if (!existingUser) {
            const nameParts = user.name?.split(" ") ?? [];
            await User.create({
              email: user.email,
              first_name: nameParts[0] ?? null,
              last_name: nameParts.slice(1).join(" ") || null,
              password_hash: null,
              role: "student",
            });
          }
          return true;
        } catch (error) {
          console.error("OAUTH_SIGNIN_ERROR:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "lecturer" | "student";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
