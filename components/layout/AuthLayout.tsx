export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#063357] via-[#094780] to-[#0d5fa3] p-5">
      {children}
    </div>
  )
}
