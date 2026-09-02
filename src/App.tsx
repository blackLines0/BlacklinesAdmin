import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Avis from "./pages/Avis";
import ClientDetail from "./pages/ClientDetail";
import Clients from "./pages/Clients";
import CodesPromo from "./pages/CodesPromo";
import Commandes from "./pages/Commandes";
import CommandeDetail from "./pages/CommandeDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MarqueDetail from "./pages/MarqueDetail";
import Marques from "./pages/Marques";
import Produits from "./pages/Produits";
import ProduitForm from "./pages/ProduitForm";
import Utilisateurs from "./pages/Utilisateurs";
import Vitrine from "./pages/Vitrine";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><Dashboard /></ProtectedRoute>} />
      <Route path="/marques" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><Marques /></ProtectedRoute>} />
      <Route path="/marques/:id" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><MarqueDetail /></ProtectedRoute>} />
      <Route path="/produits" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><Produits /></ProtectedRoute>} />
      <Route path="/produits/nouveau" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><ProduitForm /></ProtectedRoute>} />
      <Route path="/produits/:id/modifier" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><ProduitForm /></ProtectedRoute>} />
      <Route path="/commandes" element={<ProtectedRoute><Commandes /></ProtectedRoute>} />
      <Route path="/commandes/:id" element={<ProtectedRoute><CommandeDetail /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><Clients /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute roles={["admin", "gestionnaire"]}><ClientDetail /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute roles={["admin"]}><Utilisateurs /></ProtectedRoute>} />
      <Route path="/avis" element={<ProtectedRoute roles={["admin", "support"]}><Avis /></ProtectedRoute>} />
      <Route path="/codes-promo" element={<ProtectedRoute roles={["admin"]}><CodesPromo /></ProtectedRoute>} />
      <Route path="/vitrine" element={<ProtectedRoute roles={["admin"]}><Vitrine /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
