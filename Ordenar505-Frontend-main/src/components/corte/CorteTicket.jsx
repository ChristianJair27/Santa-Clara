import { useRef } from "react";
import PropTypes from "prop-types";

const CorteTicket = ({ corte, onClose }) => {
  const corteRef = useRef(null);
  if (!corte) return null;

  // Función para formatear fechas de manera segura
  const formatDate = (dateString) => {
    if (!dateString || dateString === "En curso") return dateString;
    
    try {
      // Convertir formato MySQL a ISO si es necesario
      const isoDate = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
      const date = new Date(isoDate);
      
      return isNaN(date.getTime()) 
        ? "Fecha inválida" 
        : date.toLocaleString("es-MX", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
    } catch {
      return "Fecha inválida";
    }
  };

  // Datos básicos
  const turnoId = corte.turnoId ?? corte.shift_id ?? corte.id ?? "N/A";
  const cajero         = corte.cajero ?? corte.user_name ?? "N/A";
  const inicio         = corte.inicio ?? corte.start_time ?? corte.start ?? null;
  const cierre         = corte.cierre ?? corte.end_time ?? corte.end ?? null;

  // Datos financieros
  const ingresos = Number(corte.ingresos ?? corte.caja?.ingresos ?? 0);
  const egresos = Number(corte.egresos ?? corte.caja?.retiros ?? 0);
  const totalCaja = Number(corte.total ?? corte.caja?.balance ?? (ingresos - egresos) ?? 0);
  const movimientos = corte.movimientos ?? corte.movs ?? corte.total_movements ?? "N/A";

  // Totales de órdenes
  const totalOrdenes = Number(corte.totalOrdenes ?? corte.total_sales ?? corte.total_ventas ?? 0);
  const ordenesPagadas = Number(corte.ordenes ?? corte.total_orders ?? corte.ordenes_pagadas ?? 0);

  // Ventas por método de pago
  const totalEfectivo = Number(
    corte.totalEfectivo ??
    corte.total_cash_sales ??
    corte.ventas_efectivo ??
    corte.caja?.total_efectivo ??
    0
  );

  const totalTarjeta = Number(
    corte.totalTarjeta ??
    corte.total_card_sales ??
    corte.ventas_tarjeta ??
    corte.caja?.total_tarjeta ??
    0
  );

  const countEfectivo = Number(corte.countEfectivo ?? corte.cash_count ?? corte.numero_efectivo ?? 0);
  const countTarjeta = Number(corte.countTarjeta ?? corte.card_count ?? corte.numero_tarjeta ?? 0);

  const tituloTurno = `Turno #${turnoId}`;

  const handlePrint = () => {
    const printContent = corteRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint.document.write(`
      <html>
        <head>
          <title>Corte de Caja - ${tituloTurno}</title>
          <style>
            body { 
              font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; 
              font-size: 12px; 
              margin: 0; 
              padding: 8px;
            }
            .receipt-container { width: 260px; }
            h2 { font-size: 14px; margin: 0 0 6px 0; text-align:center; }
            hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
            .row { display:flex; justify-content:space-between; margin: 2px 0; }
            .muted { color:#555; }
            .bold { font-weight:600; }
            .center { text-align:center; }
            .payment-count { 
              font-size: 0.85em;
              color: #666;
              margin-left: 4px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">${printContent}</div>
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 400);
  };

  return (
    <div className="text-black">
      <div ref={corteRef} className="receipt-container">
        <h2 className="text-lg font-bold mb-2 text-center">🧾 Corte de Caja</h2>

        <div className="row">
          <span className="muted">Turno:</span>
          <span className="bold">#{turnoId}</span>
        </div>
         <div className="row"><span className="muted">Cajero:</span><span>{cajero}</span></div>
        <div className="row"><span className="muted">Inicio:</span><span>{inicio ? new Date(inicio).toLocaleString("es-MX") : "N/A"}</span></div>
        <div className="row"><span className="muted">Cierre:</span><span>{cierre ? new Date(cierre).toLocaleString("es-MX") : "En curso"}</span></div>

        <hr />

        <div className="row">
          <span>Total ventas</span>
          <span className="bold">${totalOrdenes.toFixed(2)}</span>
        </div>

        <div className="row">
          <span>
            Ventas efectivo
            <span className="payment-count">({countEfectivo})</span>
          </span>
          <span className="bold">${totalEfectivo.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>
            Ventas tarjeta
            <span className="payment-count">({countTarjeta})</span>
          </span>
          <span className="bold">${totalTarjeta.toFixed(2)}</span>
        </div>

        {ordenesPagadas > 0 && (
          <div className="row">
            <span>Órdenes pagadas</span>
            <span className="bold">{ordenesPagadas}</span>
          </div>
        )}

        <hr />

        <div className="row">
          <span>Ingresos caja</span>
          <span className="bold">${ingresos.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Retiros caja</span>
          <span className="bold">${egresos.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Balance caja</span>
          <span className="bold">${totalCaja.toFixed(2)}</span>
        </div>

        <hr />

        <div className="row">
          <span>Movimientos</span>
          <span>{movimientos}</span>
        </div>

        <p className="center text-xs mt-2">¡Gracias por tu trabajo!</p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cerrar
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
};

CorteTicket.propTypes = {
  corte: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default CorteTicket;