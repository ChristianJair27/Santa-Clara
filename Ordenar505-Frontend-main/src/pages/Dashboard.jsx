import React, { useEffect } from "react";
import Metrics from "../components/dashboard/Metrics";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Santa Clara - Panel Admin";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header consistente con el resto de la app */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg" style={{background: 'linear-gradient(to right, #111111, #1A1A1A)'}}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="bg-white/10 text-white p-2 rounded-xl hover:bg-white/20 transition"
            title="Volver al inicio"
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              <MdDashboard size={18} />
              Panel de Administración
            </h1>
            <p className="text-amber-300 text-[11px]">Santa Clara</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs capitalize hidden sm:block">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Metrics />
      </main>
    </div>
  );
};

export default Dashboard;
