import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Carregando } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Historico from './pages/Historico';
import Familia from './pages/Familia';

// Fluxo (seção 7.1): Login/Cadastro -> Dashboard -> Nova despesa | Histórico | Família
export default function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <Carregando />;

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!usuario.familia_id) {
    return (
      <Routes>
        <Route path="/bem-vindo" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/bem-vindo" replace />} />
      </Routes>
    );
  }

  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="historico" element={<Historico />} />
          <Route path="familia" element={<Familia />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
