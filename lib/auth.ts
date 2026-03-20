import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { mockUser } from './mock-data'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        uf: { label: 'UF', type: 'text' },
        regional: { label: 'Regional', type: 'text' },
      },
      async authorize(credentials) {
        // Validação básica para garantir que todos os campos do formulário chegaram
        if (!credentials?.email || !credentials?.password || !credentials?.uf || !credentials?.regional) {
          return null
        }

        // Simulação de utilizador (Demo)
        return {
          id: mockUser.id,
          name: `${mockUser.nome} ${mockUser.sobrenome}`,
          email: mockUser.email,
          uf: credentials.uf,
          regional: credentials.regional,
          role: mockUser.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.uf = (user as any).uf
        token.regional = (user as any).regional
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).uf = token.uf
        ;(session.user as any).regional = token.regional
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}