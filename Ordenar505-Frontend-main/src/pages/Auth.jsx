import { useEffect, useState } from "react";
import logo from "../assets/images/santa-clara-logo.png";
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    document.title = "Santa Clara | Acceso";
    const t = localStorage.getItem("access_token");
    if (t) navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2A1F08 0%, #111111 40%, #0D0D0D 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(212,144,10,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(212,144,10,0.05) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm z-10 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full p-1"
            style={{ boxShadow: "0 0 40px rgba(212,144,10,0.25), 0 0 80px rgba(212,144,10,0.08)" }}
          >
            <img
              src={logo}
              alt="Santa Clara"
              className="h-28 w-28 rounded-full object-cover"
            />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#D4900A" }}>
            Acceso Administrativo
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,144,10,0.2)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5 text-center"
            style={{
              background: "rgba(212,144,10,0.07)",
              borderBottom: "1px solid rgba(212,144,10,0.15)",
            }}
          >
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isRegister ? "Crear cuenta" : "Bienvenido"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
              {isRegister ? "Registra un nuevo empleado" : "Inicia sesión para continuar"}
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {isRegister ? (
              <Register setIsRegister={setIsRegister} />
            ) : (
              <Login />
            )}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setIsRegister((v) => !v)}
          className="text-xs transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4900A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿Necesitas registrar un empleado?"}
        </button>

        <p className="text-xs" style={{ color: "#374151" }}>
          © {new Date().getFullYear()} Design by Revolution505
        </p>
      </div>
    </div>
  );
};

export default Auth;
