import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        uf: { label: "UF", type: "text" },
        regional: { label: "Regional", type: "text" },
      },
      async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      uf: credentials.uf,
      regional: credentials.regional,
    }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  // Se o login falhar (401), lançamos o erro com a mensagem do backend
  if (!res.ok) {
    throw new Error(data.message || "Falha na autenticação");
  }

  if (data) {
    return {
      id: data.user.id,
      name: data.user.nome,
      email: data.user.email,
      role: data.user.role,
      uf: data.user.uf,
      regional: data.user.regional,
      accessToken: data.access_token,
    };
  }
  return null;
},
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // No momento do login (quando 'user' existe)
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role; // Agora o middleware consegue ler token.role
        token.uf = (user as any).uf;
        token.regional = (user as any).regional;
      }
      return token;
    },
    async session({ session, token }) {
      // Repassamos tudo para a sessão para usar nos componentes (useSession)
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).uf = token.uf;
        (session.user as any).regional = token.regional;
        (session as any).access_token = token.accessToken;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Garante que estamos usando JWT
  },
});

export { handler as GET, handler as POST };