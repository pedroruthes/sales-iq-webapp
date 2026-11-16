import { Users, UserPlus, Unlink, Moon, Cake } from 'lucide-react'
import { KPICard, SectionTitle } from '@/components/ui'
import { fmt } from '@/lib/utils'

interface Resumo {
  totalCarteira: number; novosMes: number
  semVinculoQtd: number; semVinculoPct: number
  dormentes60: number; dormentes90: number
}

export function ClientesKPIStrip({ resumo }: { resumo: Resumo }) {
  return (
    <div>
      <SectionTitle label="Indicadores de clientes" icon={Users} />
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Carteira (12 meses)"  valor={resumo.totalCarteira} formato="numero" destaque="primary" />
        <KPICard label="Novos / mês"     valor={resumo.novosMes}      formato="numero" destaque="success" />
        <KPICard
          label="Sem vínculo"
          valor={resumo.semVinculoPct}
          formato="percentual"
          destaque={resumo.semVinculoPct > 20 ? 'danger' : resumo.semVinculoPct > 10 ? 'warn' : 'success'}
        />
        <KPICard
          label="Dormentes 60d"
          valor={resumo.dormentes60}
          formato="numero"
          destaque={resumo.dormentes60 > 50 ? 'danger' : resumo.dormentes60 > 20 ? 'warn' : 'neutral'}
        />
        <KPICard
          label="Dormentes 90d+"
          valor={resumo.dormentes90}
          formato="numero"
          destaque={resumo.dormentes90 > 30 ? 'danger' : 'warn'}
        />
      </div>
    </div>
  )
}
