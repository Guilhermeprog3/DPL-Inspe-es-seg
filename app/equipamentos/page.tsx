// app/equipamentos/page.tsx
import { prisma } from '@/lib/prisma'
import EquipamentosClient from '@/components/modules/EquipamentosClient'

// Este componente roda APENAS no servidor
export default async function EquipamentosPage() {
  // Chamada direta ao banco de dados com Prisma
  const equipamentos = await prisma.equipamento.findMany({
    orderBy: {
      codigo: 'asc'
    }
  })

  // Retorna o componente de cliente enviando os dados como props
  return <EquipamentosClient initialData={equipamentos as any} />
}