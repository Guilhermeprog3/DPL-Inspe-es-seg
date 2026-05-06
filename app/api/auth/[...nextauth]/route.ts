import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        // CORREÇÃO: uf e regional removidos — o backend os lê do banco,
        // não aceita mais esses valores vindos do cliente.
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
              // CORREÇÃO: uf e regional removidos do body.
            }),
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          // CORREÇÃO: lança a mensagem real do backend para que o login.tsx
          // consiga detectar "inativa" / "aprovação" e mostrar o banner correto.
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
    // Garante que a chapa vinda do authorize seja salva no token JWT
    token.chapa = (user as any).chapa;
    token.nomeCompleto = (user as any).nomeCompleto;
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
    // Garante que a chapa do token seja exposta na sessão do frontend e enviada no cabeçalho
    (session.user as any).chapa = token.chapa;
    (session.user as any).nomeCompleto = token.nomeCompleto;
    session.user.name = token.nomeCompleto as string;
  }
  return session;
},
  },

  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };