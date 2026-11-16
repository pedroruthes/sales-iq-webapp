import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Info, BookOpen } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'

interface Item {
  GRUPO_PRODUTO: string; faturamento: number
  qtdVendida: number; giroMensal: number; diasCobertura: number
}

// Explicações educativas por indicador
const EXPLICACOES = {
  giro: {
    titulo: 'O que é Giro de Estoque?',
    definicao: 'O giro mede quantas vezes o estoque de um grupo de produtos foi vendido em determinado período. Quanto maior o giro, mais rápido os produtos saem da loja.',
    formula: 'Giro / mês = Quantidade vendida ÷ Dias do período × 30',
    exemplo: 'Se você vendeu 90 camisetas em 30 dias, o giro é 90 ÷ 30 × 30 = 90 un/mês.',
    interpretacao: [
      { faixa: 'Acima de 10/mês', cor: 'success', texto: 'Giro excelente — produto de alta saída, reposição frequente necessária.' },
      { faixa: 'Entre 3 e 10/mês', cor: 'info',    texto: 'Giro saudável — produto com boa rotatividade.' },
      { faixa: 'Abaixo de 3/mês', cor: 'warn',     texto: 'Giro lento — avaliar mix, exposição e precificação.' },
    ],
    acoes: [
      'Produtos com giro alto: garantir reposição antes de zerar o estoque.',
      'Produtos com giro baixo: rever exposição na loja, preço e mix com fornecedores.',
      'Compare o giro entre lojas para identificar boas práticas replicáveis.',
    ],
  },
  cobertura: {
    titulo: 'O que é Cobertura de Estoque?',
    definicao: 'A cobertura indica por quantos dias o estoque atual é suficiente para atender a demanda, com base no ritmo de vendas atual.',
    formula: 'Cobertura (dias) = Estoque atual ÷ (Quantidade vendida ÷ Dias do período)',
    exemplo: 'Com 200 camisetas em estoque e vendendo 10/dia, a cobertura é 200 ÷ 10 = 20 dias.',
    interpretacao: [
      { faixa: 'Abaixo de 15 dias', cor: 'danger', texto: 'Risco de ruptura — solicitar reposição urgente.' },
      { faixa: 'Entre 15 e 45 dias', cor: 'success', texto: 'Cobertura ideal para a maioria dos produtos de moda.' },
      { faixa: 'Acima de 60 dias',   cor: 'warn',    texto: 'Estoque excessivo — capital imobilizado, risco de encalhe.' },
    ],
    acoes: [
      'Monitore diariamente os grupos com cobertura abaixo de 15 dias.',
      'Planeje as compras considerando o prazo de entrega do fornecedor + cobertura desejada.',
      'Estoque com cobertura >90 dias: avaliar liquidação ou redistribuição entre lojas.',
    ],
  },
}

function PainelExplicativo({ tipo }: { tipo: 'giro' | 'cobertura' }) {
  const [aberto, setAberto] = useState(false)
  const exp = EXPLICACOES[tipo]

  const COR: Record<string, string> = {
    success: 'text-[var(--success)] bg-[var(--success-bg)] border-green-200',
    warn:    'text-[var(--warn)] bg-[var(--warn-bg)] border-amber-200',
    danger:  'text-[var(--danger)] bg-[var(--danger-bg)] border-red-200',
    info:    'text-[var(--info)] bg-[var(--info-bg)] border-blue-200',
  }

  return (
    <div className="mt-3 border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-subtle)] hover:bg-[var(--acc-pale)] transition-colors text-left"
      >
        <BookOpen className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
        <span className="text-[13px] font-medium text-[var(--acc)] flex-1">{exp.titulo}</span>
        {aberto
          ? <ChevronUp className="w-3.5 h-3.5 text-[var(--acc)]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
        }
      </button>

      {aberto && (
        <div className="px-4 py-4 bg-white flex flex-col gap-4 border-t border-[var(--border)]">

          {/* Definição */}
          <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">{exp.definicao}</p>

          {/* Fórmula */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-3">
            <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider mb-1.5 font-medium">Fórmula</div>
            <code className="text-[12px] text-[var(--acc)] font-mono">{exp.formula}</code>
            <p className="text-[13px] text-[var(--ink-ghost)] mt-1.5">Exemplo: {exp.exemplo}</p>
          </div>

          {/* Interpretação */}
          <div>
            <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wider mb-2 font-medium">Como interpretar</div>
            <div className="flex flex-col gap-1.5">
              {exp.interpretacao.map((item, i) => (
                <div key={i} className={cn('flex items-start gap-2.5 px-3 py-2 rounded-lg border text-[13px]', COR[item.cor])}>
                  <span className="font-medium shrink-0 min-w-[110px]">{item.faixa}</span>
                  <span className="opacity-90">{item.texto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ações recomendadas */}
          <div>
            <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wider mb-2 font-medium">Ações recomendadas</div>
            <ul className="flex flex-col gap-1.5">
              {exp.acoes.map((acao, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--ink-muted)]">
                  <span className="text-[var(--acc)] shrink-0 mt-0.5">›</span>
                  {acao}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export function GiroChart({ dados }: { dados: Item[] }) {
  const maxGiro = Math.max(...(dados?.map(d => d.giroMensal) ?? [1]))

  return (
    <Card>
      <SectionTitle label="Giro por grupo de produto" icon={RefreshCw} />

      <div className="flex flex-col gap-3">
        {dados?.slice(0, 10).map(item => (
          <div key={item.GRUPO_PRODUTO} className="flex items-center gap-3">
            <div className="w-28 text-[13px] text-[var(--ink-muted)] truncate shrink-0">{item.GRUPO_PRODUTO}</div>
            <div className="flex-1 h-6 bg-[var(--bg-subtle)] rounded-md overflow-hidden relative">
              <div
                className={cn('h-full rounded-md flex items-center px-2 transition-all',
                  item.giroMensal >= 10 ? 'bg-[var(--success)]'
                  : item.giroMensal >= 3 ? 'bg-[var(--acc)]'
                  : 'bg-[var(--warn)]'
                )}
                style={{ width: `${Math.max((item.giroMensal / maxGiro) * 100, 4)}%`, opacity: 0.75 }}
              />
            </div>
            <div className="text-right min-w-[64px]">
              <div className={cn('text-[13px] font-medium',
                item.giroMensal >= 10 ? 'text-[var(--success)]'
                : item.giroMensal >= 3 ? 'text-[var(--acc)]'
                : 'text-[var(--warn)]')}>
                {fmt.number(item.giroMensal, 1)}/mês
              </div>
              <div className="text-[13px] text-[var(--ink-ghost)]">{fmt.number(item.qtdVendida, 0)} un</div>
            </div>
          </div>
        ))}
      </div>

      {/* Painel explicativo — Giro */}
      <PainelExplicativo tipo="giro" />
    </Card>
  )
}
