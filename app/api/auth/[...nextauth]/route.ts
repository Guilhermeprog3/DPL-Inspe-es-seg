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

        // Chamada para o seu backend NestJS
        const res = await fetch("http://localhost:3001/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            uf: credentials.uf,
            regional: credentials.regional,
          }),
          headers: { "Content-Type": "application/json" },
        });

        const user = await res.json();

        // Se o login for bem-sucedido e retornar o usuário/token
        if (res.ok && user) {
          return user;
        }

        // Se falhar, retorna null (o NextAuth lidará com o erro)
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Sua página customizada
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      session.user = token as any;
      return session;
    },
  },
});

export { handler as GET, handler as POST };