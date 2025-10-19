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
        console.log("---[Authorize Function Start]---"); // <-- LOG 1: Fungsi dimulai
        console.log("Credentials received:", credentials); // <-- LOG 2: Kredensial yang diterima

        const validatedFields = loginSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          console.log(`Attempting login for email: ${email}`); // <-- LOG 3: Email yang dicari

          const user = await User.findOne({ where: { email } });

            console.log(user);
            

          if (!user) {
            console.log(`User not found for email: ${email}`); // <-- LOG 4a: User tidak ditemukan
            console.log("---[Authorize Function End - User Not Found]---");
            return null;
          }

          if (!user.dataValues.password_hash) {
            console.log(
              `User ${email} found, but has no password_hash (likely OAuth user)`
            ); // <-- LOG 4b: User ada tapi tak punya password
            console.log("---[Authorize Function End - No Password Hash]---");
            return null;
          }

          console.log(`User found: ${user.email}, comparing password...`); // <-- LOG 5: User ditemukan, siap bandingkan password
          console.log(`  > Input Password: ${password}`);
          console.log(`  > Hashed Password from DB: ${user.dataValues.password_hash}`);

          const passwordsMatch = await bcrypt.compare(
            password,
            user.dataValues.password_hash
          );
          console.log(`Password comparison result: ${passwordsMatch}`); // <-- LOG 6: Hasil perbandingan

          if (passwordsMatch) {
            console.log(`Password match for ${email}. Returning user object.`); // <-- LOG 7a: Sukses
            console.log("---[Authorize Function End - Success]---");
            return {
              // Objek yang dikembalikan HARUS sesuai struktur NextAuth
              id: String(user.user_id),
              email: user.email,
              name: user.getFullName(),
              role: user.role,
            };
          } else {
            console.log(`Password mismatch for ${email}.`); // <-- LOG 7b: Gagal (Password Salah)
          }
        } else {
          console.log("Credential validation failed:", validatedFields.error); // <-- LOG 8: Validasi Zod gagal
        }

        console.log("---[Authorize Function End - Failed]---");
        return null; // Gagal login jika sampai sini
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
              password_hash: null, // No password for OAuth users
              role: "student",
            });
          }
          return true;
        } catch (error) {
          console.error("OAUTH_SIGNIN_ERROR:", error);
          return false;
        }
      }
      return true; // Allow credentials sign in
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
