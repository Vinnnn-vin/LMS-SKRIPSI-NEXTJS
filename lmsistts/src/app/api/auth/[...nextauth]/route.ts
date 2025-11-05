// lmsistts\src\app\api\auth\[...nextauth]\route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password diperlukan");
        }

        const user = await User.findOne({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Email tidak ditemukan");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.user_id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
      }

      // PENTING: Saat updateSession() dipanggil dari client
      // trigger akan bernilai "update", maka kita fetch data terbaru dari database
      if (trigger === "update") {
        try {
          const dbUser = await User.findByPk(parseInt(token.id as string));
          if (dbUser) {
            // Update token dengan data terbaru dari database
            token.name = `${dbUser.first_name} ${dbUser.last_name}`.trim();
            token.image = dbUser.image;
            token.email = dbUser.email;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error fetching user data in jwt callback:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
