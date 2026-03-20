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
      },
      async authorize(credentials) {
        // Em produção: buscar do banco e comparar hash com bcrypt
        // const user = await db.user.findUnique({ where: { email: credentials?.email } })
        // const valid = await bcrypt.compare(credentials?.password ?? '', user.passwordHash)

        // Demo: aceita qualquer credencial
        if (credentials?.email && credentials?.password) {
          return {
            id: mockUser.id,
            name: `${mockUser.nome} ${mockUser.sobrenome}`,
            email: mockUser.email,
            // campos extras propagados pelo callback jwt
            uf: mockUser.uf,
            regional: mockUser.regional,
            role: mockUser.role,
          }
        }
        return null
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
