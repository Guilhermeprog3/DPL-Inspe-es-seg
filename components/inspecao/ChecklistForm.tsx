'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ChecklistItem, RespostaChecklist, Equipamento } from '@/types'

interface ChecklistFormProps {
  equipamento: Equipamento
  itens: ChecklistItem[]
  onChange: (respostas: RespostaChecklist[]) => void
}

export function ChecklistForm({ equipamento, itens, onChange }: ChecklistFormProps) {
  const [respostas, setRespostas] = useState<RespostaChecklist[]>(
    itens.map((i) => ({ 
      idItem: i.id, 
      resposta: null,
      valor: 'NC'
    }))
  )

  const isExtintor = equipamento.tipo.toLowerCase().includes('extintor')

  function setResposta(idItem: string, status: 'ok' | 'nao_conforme') {
    const updated = respostas.map((r) =>
      r.idItem === idItem 
        ? { 
            ...r, 
            resposta: status, 
            valor: status === 'ok' ? 'OK' : 'NC' as 'OK' | 'NC' 
          } 
        : r
    )
    setRespostas(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      {isExtintor && (
        <div className="bg-[#f8fafc] border border-[#dde3ec] rounded-lg p-4 mb-6">
          <h4 className="text-xs font-bold text-[#6b7a90] uppercase tracking-wider mb-3">
            Dados do Cilindro (Automático)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-[#6b7a90] uppercase">Carga</p>
              <p className="text-sm font-semibold text-[#1a2535]">{equipamento.carga || '---'}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6b7a90] uppercase">Agente</p>
              <p className="text-sm font-semibold text-[#1a2535]">{equipamento.agente || '---'}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6b7a90] uppercase">Nº de Série</p>
              <p className="text-sm font-semibold text-[#1a2535]">{equipamento.numeroSerieCilindro || '---'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#dde3ec]">
        {itens.map((item) => {
          const resp = respostas.find((r) => r.idItem === item.id)
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
    </div>
  )
}