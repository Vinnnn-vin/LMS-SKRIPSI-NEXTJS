// lmsistts\src\app\api\auth\[...nextauth]\route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
          // name: `${user.first_name} ${user.last_name}`.trim(),
          name: user.getFullName(),
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
    async signIn({ user, account, profile }) {
      // 1. Hanya jalankan ini untuk provider OAuth (Google)
      if (account?.provider === 'google' && profile?.email) {
        try {
          // 2. Coba cari atau buat user di database Anda
          const [dbUser, created] = await User.findOrCreate({
            where: { email: profile.email },
            defaults: {
              email: profile.email,
              first_name: (profile as any).given_name || (profile.name?.split(' ')[0]),
              last_name: (profile as any).family_name || (profile.name?.split(' ').slice(1).join(' ')),
              role: 'student',
              image: user.image, // Ambil gambar dari profile Google
              password_hash: null, // Mereka login via Google
            },
          });

          if (created) {
            console.log(`[AUTH] User Google baru dibuat: ${dbUser.email}`);
          } else {
            console.log(`[AUTH] User Google ditemukan: ${dbUser.email}`);
          }
          
          // 3. Salin ID & Role dari DB ke token/user object
          // agar 'jwt' callback bisa menggunakannya
          user.id = dbUser.user_id.toString();
          user.role = dbUser.role; 
          
          return true; // Lanjutkan proses login

        } catch (error) {
          console.error("[AUTH_SIGNIN_ERROR] Gagal findOrCreate user Google:", error);
          return false; // Hentikan login jika ada error DB
        }
      }
      
      // 4. Untuk login 'credentials', biarkan lolos
      if (account?.provider === 'credentials') {
        return true;
      }

      // Blok login lain jika tidak terduga
      return false; 
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
      }

      if (trigger === "update") {
        try {
          const dbUser = await User.findByPk(parseInt(token.id as string));
          if (dbUser) {
            token.name = dbUser.getFullName();
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
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
