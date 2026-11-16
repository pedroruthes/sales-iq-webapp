import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/auth/AuthContext'
import { RedirectIfAuth, RequireAuth } from '@/auth/RequireAuth'
import LoginPage from '@/pages/LoginPage'
import DashboardHome from '@/pages/dashboard/DashboardHome'
import VendasPage from '@/pages/dashboard/VendasPage'
import ClientesPage from '@/pages/dashboard/ClientesPage'
import EstoquePage from '@/pages/dashboard/EstoquePage'
import VendedoresPage from '@/pages/dashboard/VendedoresPage'
import IndicadoresPage from '@/pages/dashboard/IndicadoresPage'
import IaPage from '@/pages/dashboard/IaPage'
import ScorePage from '@/pages/dashboard/ScorePage'
import ListaVezPage from '@/pages/dashboard/ListaVezPage'
import GamificacaoPage from '@/pages/dashboard/GamificacaoPage'
import PdcaPage from '@/pages/dashboard/PdcaPage'
import CrmPage from '@/pages/dashboard/CrmPage'
import RankingPage from '@/pages/dashboard/RankingPage'
import ComparativoPage from '@/pages/dashboard/ComparativoPage'
import MetasPage from '@/pages/dashboard/MetasPage'
import DiarioPage from '@/pages/dashboard/DiarioPage'
import TransferenciasPage from '@/pages/dashboard/TransferenciasPage'
import LojasPage from '@/pages/dashboard/LojasPage'
import PerfilPage from '@/pages/dashboard/PerfilPage'
import AdminPage from '@/pages/dashboard/AdminPage'
import AdminPainelPage from '@/pages/dashboard/AdminPainelPage'
import AdminLicencasPage from '@/pages/dashboard/AdminLicencasPage'
import AdminPerfisPage from '@/pages/dashboard/AdminPerfisPage'
import AdminIndicadoresPage from '@/pages/dashboard/AdminIndicadoresPage'
import AdminSincronizacaoPage from '@/pages/dashboard/AdminSincronizacaoPage'

export default function App() {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            placeholderData: keepPreviousData,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardHome />
                </RequireAuth>
              }
            />
            <Route path="/dashboard/vendas" element={<RequireAuth><VendasPage /></RequireAuth>} />
            <Route path="/dashboard/clientes" element={<RequireAuth><ClientesPage /></RequireAuth>} />
            <Route path="/dashboard/estoque" element={<RequireAuth><EstoquePage /></RequireAuth>} />
            <Route path="/dashboard/vendedores" element={<RequireAuth><VendedoresPage /></RequireAuth>} />
            <Route path="/dashboard/indicadores" element={<RequireAuth><IndicadoresPage /></RequireAuth>} />
            <Route path="/dashboard/ia" element={<RequireAuth><IaPage /></RequireAuth>} />
            <Route path="/dashboard/score" element={<RequireAuth><ScorePage /></RequireAuth>} />
            <Route path="/dashboard/lista-vez" element={<RequireAuth><ListaVezPage /></RequireAuth>} />
            <Route path="/dashboard/gamificacao" element={<RequireAuth><GamificacaoPage /></RequireAuth>} />
            <Route path="/dashboard/pdca" element={<RequireAuth><PdcaPage /></RequireAuth>} />
            <Route path="/dashboard/crm" element={<RequireAuth><CrmPage /></RequireAuth>} />
            <Route path="/dashboard/ranking" element={<RequireAuth><RankingPage /></RequireAuth>} />
            <Route path="/dashboard/comparativo" element={<RequireAuth><ComparativoPage /></RequireAuth>} />
            <Route path="/dashboard/metas" element={<RequireAuth><MetasPage /></RequireAuth>} />
            <Route path="/dashboard/diario" element={<RequireAuth><DiarioPage /></RequireAuth>} />
            <Route path="/dashboard/transferencias" element={<RequireAuth><TransferenciasPage /></RequireAuth>} />
            <Route path="/dashboard/lojas" element={<RequireAuth><LojasPage /></RequireAuth>} />
            <Route path="/dashboard/perfil" element={<RequireAuth><PerfilPage /></RequireAuth>} />
            <Route path="/dashboard/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
            <Route path="/dashboard/admin/painel" element={<RequireAuth><AdminPainelPage /></RequireAuth>} />
            <Route path="/dashboard/admin/licencas" element={<RequireAuth><AdminLicencasPage /></RequireAuth>} />
            <Route path="/dashboard/admin/perfis" element={<RequireAuth><AdminPerfisPage /></RequireAuth>} />
            <Route path="/dashboard/admin/indicadores" element={<RequireAuth><AdminIndicadoresPage /></RequireAuth>} />
            <Route path="/dashboard/admin/sincronizacao" element={<RequireAuth><AdminSincronizacaoPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
