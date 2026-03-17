import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import {prisma} from "@/lib/prisma"
import type { NextAuthOptions } from "next-auth"
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email"},
                password: { label: "Password", type: "password"}
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const utente = await prisma.utenti.findFirst({
                    where: { mail: credentials.email }
                })

                if (!utente || !utente.password) return null

                const passwordCorretta = await bcrypt.compare(
                    credentials.password,
                    utente.password
                )

                if (!passwordCorretta) return null

                return {
                    id: String(utente.id_utente),
                    email: utente.mail,
                    name: `${utente.nome_utente} ${utente.cognome_utente ?? ""}`.trim(),
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    jwt: {
        maxAge: 60 * 60 * 24 * 7, // 7 giorni
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
    pages: {
        signIn: "/login", // la tua pagina di login custom
    },
    secret: process.env.NEXTAUTH_SECRET,
}
