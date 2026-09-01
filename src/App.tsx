import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ClientDetail from "./pages/ClientDetail";
import Clients from "./pages/Clients";
import Commandes from "./pages/Commandes";
import CommandeDetail from "./pages/CommandeDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MarqueDetail from "./pages/MarqueDetail";
import Marques from "./pages/Marques";
import Produits from "./pages/Produits";
import ProduitForm from "./pages/ProduitForm";
import Utilisateurs from "./pages/Utilisateurs";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/marques" element={<ProtectedRoute><Marques /></ProtectedRoute>} />
      <Route path="/marques/:id" element={<ProtectedRoute><MarqueDetail /></ProtectedRoute>} />
      <Route path="/produits" element={<ProtectedRoute><Produits /></ProtectedRoute>} />
      <Route path="/produits/nouveau" element={<ProtectedRoute><ProduitForm /></ProtectedRoute>} />
      <Route path="/produits/:id/modifier" element={<ProtectedRoute><ProduitForm /></ProtectedRoute>} />
      <Route path="/commandes" element={<ProtectedRoute><Commandes /></ProtectedRoute>} />
      <Route path="/commandes/:id" element={<ProtectedRoute><CommandeDetail /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute><Utilisateurs /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
