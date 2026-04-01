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
      // Se o usuário acabou de logar, 'user' contém o retorno do seu backend (access_token + user object)
      if (user) {
        return {
          ...token,
          accessToken: (user as any).access_token,
          userData: (user as any).user, // Aqui guardamos nome, email, role, uf...
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Repassamos os dados do token para a sessão do cliente
      (session as any).access_token = token.accessToken;
      session.user = token.userData as any; 
      return session;
    },
  },
});

export { handler as GET, handler as POST };