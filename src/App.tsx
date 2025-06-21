
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Pagamentos from "./pages/Pagamentos";
import ClienteHistorico from "./pages/ClienteHistorico";
import ClientePagamento from "./pages/ClientePagamento";
import ServicesManagement from "./pages/ServicesManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/agenda" element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute>
              <Clientes />
            </ProtectedRoute>
          } />
          <Route path="/pagamentos" element={
            <ProtectedRoute>
              <Pagamentos />
            </ProtectedRoute>
          } />
          <Route path="/cliente/:clientId/historico" element={
            <ProtectedRoute>
              <ClienteHistorico />
            </ProtectedRoute>
          } />
          <Route path="/cliente/:clientId/pagamento" element={
            <ProtectedRoute>
              <ClientePagamento />
            </ProtectedRoute>
          } />
          <Route path="/services-management" element={
            <ProtectedRoute>
              <ServicesManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
