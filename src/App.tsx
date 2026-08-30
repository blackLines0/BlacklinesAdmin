import { Navigate, Route, Routes } from "react-router-dom";
import Commandes from "./pages/Commandes";
import CommandeDetail from "./pages/CommandeDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Produits from "./pages/Produits";
import ProduitForm from "./pages/ProduitForm";
import Utilisateurs from "./pages/Utilisateurs";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/produits" element={<Produits />} />
      <Route path="/produits/nouveau" element={<ProduitForm />} />
      <Route path="/produits/:sku/modifier" element={<ProduitForm />} />
      <Route path="/commandes" element={<Commandes />} />
      <Route path="/commandes/:id" element={<CommandeDetail />} />
      <Route path="/utilisateurs" element={<Utilisateurs />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
