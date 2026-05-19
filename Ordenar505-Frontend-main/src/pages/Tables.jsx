import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";
import { FiRefreshCw } from "react-icons/fi";

const Tables = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: tablesData, isError, isLoading, refetch } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => await getTables(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    document.title = "Santa Clara | Mesas";
  }, []);

  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Error al cargar las mesas", { variant: "error" });
    }
  }, [isError]);

  const filteredTables = tablesData?.data.data.filter(table => {
    if (statusFilter === "all") return true;
    return table.status === statusFilter;
  }) || [];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {["all", "Ocupado", "Disponible"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === filter
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {filter === "all" ? "Todas" : 
                   filter === "Ocupado" ? "Ocupadas" : "Disponibles"}
                </button>
              ))}
            </div>
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-6 bg-gray-100">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTables.map((table) => (
              <TableCard
  key={table.id}
  id={table.id}
  name={table.table_no}
  status={table.status}
  customerName={table.customer_name}   // 👈 viene del JOIN
  seats={table.seats}
/>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gray-200 rounded-full p-6 mb-4">
              <span className="text-gray-500 text-4xl">🍽️</span>
            </div>
            <p className="text-xl text-gray-500 mb-2">
              {statusFilter === "all" 
                ? "No hay mesas registradas" 
                : statusFilter === "Ocupado" 
                  ? "No hay mesas ocupadas" 
                  : "No hay mesas disponibles"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}
      </main>

      {/* Barra de navegación inferior */}
      <BottomNav />
    </div>
  );
};

export default Tables;