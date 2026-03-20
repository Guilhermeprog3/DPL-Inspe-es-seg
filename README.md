# SIGS — Sistema de Gestão de Segurança

Sistema de inspeção de equipamentos de segurança com rastreabilidade por QR Code, geolocalização e controle de acesso RBAC.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** (JWT)
- **React Hook Form + Zod** (validação)
- **qrcode.react** (geração de QR Codes)
- **lucide-react** (ícones)

## Estrutura de Pastas

```
sigs/
├── app/
│   ├── login/              # Tela de login
│   ├── cadastro/           # Tela de cadastro
│   ├── recuperar-senha/    # Recuperação de senha (SMTP)
│   ├── modulos/            # Seleção de módulo pós-login
│   ├── dashboard/          # Dashboard principal
│   ├── inspecao/           # Nova inspeção via QR Code
│   ├── equipamentos/       # Inventário de equipamentos
│   ├── qr-codes/           # Gerador de etiquetas
│   ├── relatorios/         # Relatórios e conformidade
│   ├── usuarios/           # Gestão de usuários RBAC
│   └── api/auth/           # NextAuth handler
├── components/
│   ├── ui/                 # Button, Input, Select, Card, Badge, Alert, Modal
│   ├── layout/             # Sidebar, Topbar, DashboardLayout, AuthLayout
│   ├── modules/            # MetricCard, ConformidadeBar
│   └── inspecao/           # ChecklistForm, QrScanner
├── lib/
│   ├── auth.ts             # Configuração NextAuth
│   ├── mock-data.ts        # Dados de demonstração
│   ├── utils.ts            # cn(), formatDate(), etc.
│   └── validations.ts      # Schemas Zod
├── hooks/
│   └── useGeolocation.ts   # Hook de captura GPS
├── types/
│   └── index.ts            # Tipos TypeScript compartilhados
├── middleware.ts            # Proteção de rotas
└── .env.example            # Variáveis de ambiente
```

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 3. Rodar em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Fluxo de Navegação

```
/login  →  /modulos  →  /dashboard
                     →  /inspecao      (Nova inspeção via QR Code)
                     →  /equipamentos  (Inventário)
                     →  /qr-codes      (Gerador de etiquetas)
                     →  /relatorios    (Conformidade por regional)
                     →  /usuarios      (RBAC)
```

## Variáveis de Ambiente Necessárias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL/Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada Supabase (nunca expor no client) |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base da aplicação |
| `SMTP_HOST` | Servidor SMTP para recuperação de senha |
| `SMTP_USER` / `SMTP_PASS` | Credenciais SMTP |

## Cores do Sistema

| Token | Hex | Uso |
|-------|-----|-----|
| `azul` | `#094780` | Primary, sidebar, links |
| `azul-escuro` | `#063357` | Sidebar background |
| `laranja` | `#E67A0E` | CTAs, itens ativos, alertas |
| `cinza` | `#939393` | Textos secundários, desabilitados |
