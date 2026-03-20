'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ChecklistItem, RespostaChecklist } from '@/types'

interface ChecklistFormProps {
  itens: ChecklistItem[]
  onChange: (respostas: RespostaChecklist[]) => void
}

export function ChecklistForm({ itens, onChange }: ChecklistFormProps) {
  const [respostas, setRespostas] = useState<RespostaChecklist[]>(
    itens.map((i) => ({ itemId: i.id, resposta: null }))
  )

  function setResposta(itemId: string, resposta: 'ok' | 'nao_conforme') {
    const updated = respostas.map((r) =>
      r.itemId === itemId ? { ...r, resposta } : r
    )
    setRespostas(updated)
    onChange(updated)
  }

  return (
    <div className="divide-y divide-[#dde3ec]">
      {itens.map((item) => {
        const resp = respostas.find((r) => r.itemId === item.id)
        return (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1a2535]">{item.pergunta}</p>
              {item.descricao && (
                <p className="text-xs text-[#6b7a90] mt-0.5">{item.descricao}</p>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setResposta(item.id, 'ok')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold border-[1.5px] transition-all',
                  resp?.resposta === 'ok'
                    ? 'bg-green-500/12 border-green-500 text-green-600'
                    : 'border-[#dde3ec] text-[#6b7a90] hover:border-green-400 hover:text-green-500'
                )}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setResposta(item.id, 'nao_conforme')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-bold border-[1.5px] transition-all',
                  resp?.resposta === 'nao_conforme'
                    ? 'bg-red-500/10 border-red-500 text-red-500'
                    : 'border-[#dde3ec] text-[#6b7a90] hover:border-red-400 hover:text-red-500'
                )}
              >
                NC
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
