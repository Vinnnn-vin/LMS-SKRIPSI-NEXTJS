// lmsistts\src\lib\auth\authOptions.ts

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password harus diisi");
        }

        try {
          // Cari user berdasarkan email
          const user = await User.findOne({
            where: { email: credentials.email, deleted_at: null },
          });

          if (!user || !user.password_hash) {
            throw new Error("Email atau password salah");
          }

          // Verifikasi password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            throw new Error("Email atau password salah");
          }

          // Return user data
          return {
            id: user.user_id.toString(),
            email: user.email!,
            name: user.getFullName(),
            role: user.role || "student",
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Cek apakah user sudah ada di database
          let existingUser = await User.findOne({
            where: { email: user.email, deleted_at: null },
          });

          if (!existingUser) {
            // Buat user baru jika belum ada
            const [firstName, ...lastNameParts] = (user.name || "").split(" ");
            existingUser = await User.create({
              first_name: firstName || null,
              last_name: lastNameParts.join(" ") || null,
              email: user.email,
              role: "student", // Default role
              password_hash: null, // OAuth users tidak perlu password
            });
          }

          // Update user id untuk session
          user.id = existingUser.user_id;
          user.role = existingUser.role || "student";
          
          return true;
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      }
      
      return true;
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.provider = account?.provider;
      }
      
      // Refresh user data from database on subsequent calls
      if (token.email) {
        try {
          const dbUser = await User.findOne({
            where: { email: token.email, deleted_at: null },
          });
          
          if (dbUser) {
            token.id = dbUser.user_id.toString();
            token.role = dbUser.role || "student";
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as "admin" | "lecturer" | "student";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};