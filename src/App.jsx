import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }      from './context/AuthContext';
import Layout           from './components/Layout/Layout';
import Login            from './pages/Auth/Login';
import Register         from './pages/Auth/Register';
import Dashboard        from './pages/Dashboard/Dashboard';
import Exploitations    from './pages/Exploitations/Exploitations';
import Parcelles        from './pages/Parcelles/Parcelles';
import Traitements      from './pages/Traitements/Traitements';
import Produits         from './pages/Produits/Produits';
import Journal          from './pages/Journal/Journal';
import Alertes          from './pages/Alertes/Alertes';

const Private = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index                  element={<Dashboard />}     />
        <Route path="exploitations"   element={<Exploitations />} />
        <Route path="parcelles"       element={<Parcelles />}     />
        <Route path="traitements"     element={<Traitements />}   />
        <Route path="produits"        element={<Produits />}      />
        <Route path="journal"         element={<Journal />}       />
        <Route path="alertes"         element={<Alertes />}       />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}