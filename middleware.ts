import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Se não houver token, o withAuth redirecionará para a página de login automaticamente
    if (!token) return null;

    const userRole = (token.role as string)?.toLowerCase();

    // ─── Proteção do módulo: Medida Administrativa ───
    if (path.startsWith("/medida-administrativa")) {
      const rolesPermitidas = ["agente_cobli", "admin"];
      if (!rolesPermitidas.includes(userRole)) {
        // Usuário autenticado, mas sem permissão: redireciona para a seleção de módulos
        return NextResponse.redirect(new URL("/modulos", req.url));
      }
    }

    // ─── Proteção do módulo: Inspeção / Dashboard ───
    if (
      path.startsWith("/dashboard") || 
      path.startsWith("/inspecao") || 
      path.startsWith("/equipamentos") ||
      path.startsWith("/locais") ||
      path.startsWith("/qr-codes")
    ) {
      const rolesPermitidas = ["inspetor", "admin"];
      if (!rolesPermitidas.includes(userRole)) {
        // Usuário autenticado, mas sem permissão: redireciona para a seleção de módulos
        return NextResponse.redirect(new URL("/modulos", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Retorna true se o usuário estiver autenticado (tiver token)
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/modulos/:path*",
    "/dashboard/:path*",
    "/medida-administrativa/:path*",
    "/inspecao/:path*",
    "/equipamentos/:path*",
    "/locais/:path*",
    "/qr-codes/:path*",
  ],
};