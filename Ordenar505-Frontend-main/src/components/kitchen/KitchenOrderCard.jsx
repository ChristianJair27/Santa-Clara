import PropTypes from "prop-types";

const MIN10 = 10 * 60 * 1000;
const MIN15 = 15 * 60 * 1000;

function formatAgo(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const totalMin = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;

  if (hours <= 0) return `${min}m ${sec}s`;
  return `${hours}h ${String(min).padStart(2, "0")}m`;
}

function formatShortId(id) {
  return id ? String(id).slice(-6) : "N/A";
}

function getUrgency(ageMs) {
  if (ageMs >= MIN15) {
    return {
      label: "URGENTE",
      badge: "bg-red-600/90 text-white text-base font-semibold",
      card: "bg-gradient-to-br from-red-950/60 to-red-900/30 border border-red-700/60",
    };
  }
  if (ageMs >= MIN10) {
    return {
      label: "ATENCIÓN",
      badge: "bg-amber-600/85 text-white text-base font-semibold",
      card: "bg-gradient-to-br from-amber-950/50 to-amber-900/25 border border-amber-700/50",
    };
  }
  return {
    label: "En curso",
    badge: "bg-emerald-600/80 text-white text-sm font-medium",
    card: "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/60",
  };
}

export default function KitchenOrderCard({ order, now }) {
  const created = order?.__created ? new Date(order.__created) : new Date();
  const ageMs = order?.__ageMs ?? (now - created.getTime());

  const tableNo = String(
    order?.table_no || order?.table?.table_no || order?.table_id || "N/A"
  );

  const urgency = getUrgency(ageMs);
  const hasNewItems = !!order?.__hasNewItems;   // ← desde socket (nueva llegada)
  const isNewOrder = !!order?.__isNew;          // ← orden completamente nueva

  const items = order?.__items || order?.items || [];

  return (
    <div
      className={[
        "rounded-2xl p-6 transition-all duration-300 relative overflow-hidden",
        urgency.card,
        "backdrop-blur-sm",
        hasNewItems ? "ring-4 ring-emerald-400/60 animate-pulse-slow" : "",
        isNewOrder ? "animate-pulse" : "",
      ].join(" ")}
    >
      {/* Efecto de overlay sutil cuando hay novedades */}
      {hasNewItems && (
        <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <div className="text-2xl font-bold tracking-tight text-white">
            Mesa <span className="text-white">{tableNo}</span>
            <span className="text-white/40 mx-2">•</span>
            <span className="text-white/80 font-medium">#{formatShortId(order?.id)}</span>
          </div>

          <div className="mt-1.5 text-base text-gray-300">
            Hace <span className="font-semibold text-white">{formatAgo(ageMs)}</span>
          </div>

          {/* Badge de novedad (prioridad: nuevos items > nueva orden) */}
          {hasNewItems ? (
            <div className="mt-2.5 inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full bg-emerald-600/90 text-white border border-emerald-400/50 shadow-lg animate-bounce-slow">
              <span className="inline-block w-3 h-3 rounded-full bg-white animate-ping" />
              NUEVOS ARTÍCULOS
            </div>
          ) : isNewOrder ? (
            <div className="mt-2.5 inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-emerald-700/40 text-emerald-200 border border-emerald-600/30">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Nueva orden
            </div>
          ) : null}
        </div>

        {/* Badge de urgencia */}
        <div className={`px-4 py-1.5 rounded-xl ${urgency.badge}`}>
          {urgency.label}
        </div>
      </div>

      {/* Lista de items */}
      <div className="mt-5 space-y-3">
        {items.map((it, idx) => {
          const name = it?.item_name || it?.name || "Platillo";
          const qty = Number(it?.quantity || 1);
          const notes = String(it?.notes || "").trim();
          const isNewItem = !!it?.__isNewItem;  // ← bandera por item (desde socket)

          return (
            <div
              key={it?.id ?? `${name}-${idx}`}
              className={[
                "rounded-xl p-4 relative",
                isNewItem
                  ? "bg-emerald-900/40 border-2 border-emerald-400/70 animate-pulse"
                  : "bg-black/25 border border-white/10",
              ].join(" ")}
            >
              {isNewItem && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                  NUEVO
                </span>
              )}

              <div className="text-lg font-medium text-white">
                <span className="text-gray-400 mr-2.5">x{qty}</span>
                {name}
              </div>

              {notes && (
                <div className="mt-2 text-sm text-gray-300">
                  <span className="font-medium text-emerald-300/90">Notas: </span>
                  {notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota general */}
      {(order?.notes || order?.observations) && (
        <div className="mt-5 pt-4 border-t border-white/10 text-base text-gray-200">
          <span className="font-medium text-amber-300/90">Nota: </span>
          {order?.notes || order?.observations}
        </div>
      )}
    </div>
  );
}

KitchenOrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  now: PropTypes.number.isRequired,
};