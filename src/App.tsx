import { Navigate, Route, Routes } from "react-router-dom";
import Commandes from "./pages/Commandes";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Produits from "./pages/Produits";
import Utilisateurs from "./pages/Utilisateurs";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/produits" element={<Produits />} />
      <Route path="/commandes" element={<Commandes />} />
      <Route path="/utilisateurs" element={<Utilisateurs />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
