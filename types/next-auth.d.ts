import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Estendemos o tipo 'session' para incluir o 'id'
   */
  interface Session {
    user: {
      id: string
      // Adicione aqui outros campos que você usa, como:
      // chapa?: string
      // regional?: string
    } & DefaultSession["user"]
  }

  /**
   * Estendemos o tipo 'user' que vem do adaptador/backend
   */
  interface User {
    id: string
    // chapa?: string
  }
}

declare module "next-auth/jwt" {
  /** Estendemos o JWT para garantir que o id passe do User para a Session */
  interface JWT {
    id: string
  }
}