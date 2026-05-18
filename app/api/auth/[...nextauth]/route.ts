import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const TOKEN_DURATION_MS = 4 * 60 * 60 * 1000; 

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Falha na autenticação");
        }

        return {
          id: data.user.id,
          name: data.user.nomeCompleto,
          nomeCompleto: data.user.nomeCompleto,
          email: data.user.email,
          role: data.user.role,
          uf: data.user.uf,
          regional: data.user.regional,
          chapa: data.user.chapa,
          accessToken: data.access_token,
          loggedInAt: Date.now(),
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.uf = (user as any).uf;
        token.regional = (user as any).regional;
        token.chapa = (user as any).chapa;
        token.nomeCompleto = (user as any).nomeCompleto;
        token.expiresAt = (user as any).loggedInAt + TOKEN_DURATION_MS;
      }

      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        return { ...token, error: "TokenExpired" };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).uf = token.uf;
        (session.user as any).regional = token.regional;
        (session.user as any).access_token = token.accessToken;
        (session.user as any).chapa = token.chapa;
        (session.user as any).nomeCompleto = token.nomeCompleto;
        session.user.name = token.nomeCompleto as string;
        (session as any).expiresAt = token.expiresAt;
        (session as any).error = token.error;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, 
  },
});

export { handler as GET, handler as POST };