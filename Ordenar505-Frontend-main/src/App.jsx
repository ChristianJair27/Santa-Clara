import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Home, Auth, Orders, Tables, Menu, Dashboard } from "./pages";
import Header from "./components/shared/Header";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import OrderDetail from "./pages/OrderDetail";
import CashierDashboard from "./pages/CashierDashboard";
import KioskLogin from "./pages/KioskLogin";

// ✅ NUEVO: importa tu página de cocina
import Kitchen from "./pages/Kitchen";

import "@fontsource/inter";
import "@fontsource/fira-code";

// Layout
function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();

  // ✅ Oculta header también en /kitchen
  const hideHeaderRoutes = ["/auth", "/profiles", "/kitchen"];

  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}

      <Routes>
        {/* Landing protegida */}
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Home />
            </ProtectedRoutes>
          }
        />

        {/* /auth por compatibilidad */}
        <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />

        <Route
          path="/orders"
          element={
            <ProtectedRoutes>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoutes>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoutes>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />

        {/* ✅ PUBLICA: vista cocina (no auth) */}
        <Route path="/kitchen" element={<Kitchen />} />

        {/* Públicas */}
        <Route path="/orden/:id" element={<OrderDetail />} />
        <Route path="/cashier-dashboard" element={<CashierDashboard />} />
        <Route path="/profiles" element={<KioskLogin />} />

        {/* Fallback */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  const token = localStorage.getItem("access_token");
  const authed = isAuth || !!token;

  if (!authed) {
    return <Navigate to="/profiles" replace />;
  }
  return children;
}

// Wrapper para favicon
function AppWrapper() {
  const location = useLocation();

  useEffect(() => {
    const href = "/favicon.ico";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [location.pathname]);

  return <Layout />;
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
