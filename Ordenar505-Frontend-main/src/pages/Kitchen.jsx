import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { axiosWrapper } from "../https/axiosWrapper";
import io from "socket.io-client";
import KitchenOrderCard from "../components/kitchen/KitchenOrderCard";
import useSound from 'use-sound';  // ← agrega esto: npm install use-sound

const NEW_FLASH_MS = 4000;
const HIGHLIGHT_DURATION_MS = 8000;
const MAX_VISIBLE_ORDERS = 10;
const MAX_AGE_VISIBLE_MS = 25 * 60 * 1000;

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function safeParseItems(order) {
  let items = order?.items || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  return Array.isArray(items) ? items : [];
}

function getOrderDate(order) {
  const raw = order?.order_date || order?.created_at || order?.createdAt;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState("");
  const [newFlash, setNewFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // use-sound para notificaciones más confiables (especialmente en Android TV / Chrome restrictivo)
  const [playNewItem] = useSound('/sounds/item-added.mp3', {
    volume: 0.75,
    html5: true,          // ayuda en algunos entornos Android
    preload: true,
    interrupt: true,      // permite solapar si llegan varios rápidos
  });

  const [playNewOrder] = useSound('/sounds/new-order-chime.mp3', {
    volume: 0.9,
  });

  const socketRef = useRef(null);
  const flashTimerRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const highlightTimersRef = useRef({});

  const enableSound = () => {
    console.log("[SOUND] Activando sonido – prueba inicial");

    // Prueba inicial con new Audio (mantiene tu flujo actual)
    const audio = new Audio("/sounds/new-order-chime.mp3");
    audio.volume = 0.8;
    audio.play()
      .then(() => console.log("[SOUND] Inicial OK"))
      .catch(e => console.error("[SOUND] Inicial falló:", e.message));

    // Pre-carga con use-sound para desbloquear contexto
    playNewItem();   // puede fallar la primera vez, pero ayuda a "despertar" el contexto
    playNewOrder();  // idem

    setSoundEnabled(true);
  };

  const triggerNewFlash = useCallback(() => {
    console.log("[FLASH] Activando flash");
    setNewFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setNewFlash(false), NEW_FLASH_MS);

    if (soundEnabled) {
      console.log("[SOUND] Reproduciendo new-order-chime por flash");
      // Mantenemos new Audio aquí porque ya funciona con el botón
      const audio = new Audio("/sounds/new-order-chime.mp3");
      audio.volume = 0.9;
      audio.play().catch(e => console.error("[SOUND] Flash falló:", e.message));

      // Opcional: también con use-sound si prefieres consistencia
      // playNewOrder();
    }
  }, [soundEnabled]);

  const loadKitchenOrders = useCallback(async () => {
    try {
      setErrorMsg("");
      console.log("[POLLING] Cargando órdenes...");
      const res = await axiosWrapper.get("/api/order/kitchen-public");

      const payload = res?.data;
      const arr = payload?.data || payload?.orders || (Array.isArray(payload) ? payload : []);
      const list = Array.isArray(arr) ? arr : [];

      const next = list.map((o) => ({
        ...o,
        __isNew: !seenIdsRef.current.has(o.id || o._id),
      }));

      const newOnes = next.filter((o) => o.__isNew);
      for (const o of next) seenIdsRef.current.add(o.id || o._id);

      if (newOnes.length > 0) triggerNewFlash();

      setOrders(next);
    } catch (err) {
      console.error("[POLLING ERROR]", err);
      setErrorMsg("Error de conexión");
      setOrders([]);
    }
  }, [triggerNewFlash]);

  // Socket.IO – con debug máximo
  useEffect(() => {
    console.log("[SOCKET] Iniciando conexión a:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
      forceNew: true,
    });

    socketRef.current.on("connect", () => {
      console.log("[SOCKET] CONECTADO – ID:", socketRef.current.id);
      socketRef.current.emit("joinKitchen");
      console.log("[SOCKET] joinKitchen enviado");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("[SOCKET ERROR]", err.message, err.description || "");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("[SOCKET] DESCONECTADO – Razón:", reason);
    });

    socketRef.current.on("itemsAdded", (payload) => {
      console.log("[SOCKET] itemsAdded LLEGÓ – Payload:", JSON.stringify(payload, null, 2));

      if (soundEnabled) {
        console.log("[SOUND] Reproduciendo item-added por socket (use-sound)");
        try {
          playNewItem();  // ← esta es la línea clave que debería sonar ahora
          console.log("[SOUND] use-sound: item-added intentado");
        } catch (err) {
          console.error("[SOUND] use-sound falló:", err);
          // Fallback si use-sound falla por alguna razón
          const fallbackAudio = new Audio("/sounds/item-added.mp3");
          fallbackAudio.volume = 0.75;
          fallbackAudio.play().catch(e => console.error("[SOUND] Fallback item-added falló:", e.message));
        }
      } else {
        console.log("[SOUND] soundEnabled = false – NO reproduce");
      }

      triggerNewFlash();

      setOrders(prev => {
        const updated = prev.map(o => {
          if ((o.id || o._id) === payload.orderId) {
            return {
              ...o,
              __hasNewItems: true,
              items: [
                ...(o.items || []),
                ...payload.addedItems.map(item => ({ ...item, __isNewItem: true }))
              ]
            };
          }
          return o;
        });

        return updated;
      });

      setTimeout(() => {
        setOrders(prev => prev.map(o => {
          if ((o.id || o._id) === payload.orderId) {
            return {
              ...o,
              __hasNewItems: false,
              items: (o.items || []).map(it => ({ ...it, __isNewItem: false }))
            };
          }
          return o;
        }));
      }, HIGHLIGHT_DURATION_MS);
    });

    return () => {
      console.log("[SOCKET] Desconectando");
      socketRef.current?.disconnect();
    };
  }, [soundEnabled, triggerNewFlash, playNewItem]);  // ← agregamos playNewItem a deps

  // Polling
  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, [loadKitchenOrders]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleOrders = useMemo(() => {
    return orders
      .map(o => {
        const created = getOrderDate(o);
        const ageMs = now - created.getTime();

        const status = String(o?.order_status || o?.status || "").toLowerCase();
        const isCompleted = status.includes("pagado") || status.includes("paid") || status.includes("complete");
        const isCanceled = status.includes("cancel");

        return {
          ...o,
          __created: created,
          __ageMs: ageMs,
          __items: safeParseItems(o),
          __isKitchenRelevant: !isCanceled && !isCompleted,
        };
      })
      .filter(o => o.__isKitchenRelevant && o.__ageMs <= MAX_AGE_VISIBLE_MS)
      .sort((a, b) => a.__ageMs - b.__ageMs)
      .slice(0, MAX_VISIBLE_ORDERS);
  }, [orders, now]);

  const totalPending = useMemo(() => {
    return orders.filter(o => {
      const status = String(o?.order_status || o?.status || "").toLowerCase();
      return !status.includes("pagado") && !status.includes("paid") && !status.includes("complete") && !status.includes("cancel");
    }).length;
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {!soundEnabled && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-md"
          style={{ background: "radial-gradient(ellipse at 50% 30%, #2A1F08 0%, #0D0D0D 60%)" }}
        >
          {/* ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(212,144,10,0.15) 0%, transparent 70%)" }}
          />
          <div className="text-center px-8 relative z-10">
            <div
              className="text-6xl md:text-7xl font-black mb-3 tracking-tight"
              style={{ color: "#D4900A" }}
            >
              COCINA
            </div>
            <p className="text-base md:text-lg mb-10" style={{ color: "#6B7280" }}>
              Toca el botón para activar las notificaciones sonoras
            </p>
            <button
              onClick={enableSound}
              className="px-14 py-7 text-2xl font-black tracking-widest rounded-2xl active:scale-95 transform transition-all duration-200 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #D4900A, #92400E)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(212,144,10,0.35), 0 8px 32px rgba(0,0,0,0.5)",
                border: "1px solid rgba(212,144,10,0.4)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              ACTIVAR SONIDO
            </button>
            <p className="text-xs mt-6" style={{ color: "#374151" }}>
              Solo es necesario una vez por turno
            </p>
          </div>
        </div>
      )}

      {newFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-sm animate-pulse" />
          <div className="relative rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-emerald-500/60 px-16 py-14 shadow-4xl animate-in fade-in zoom-in-90 duration-700">
            <div className="text-7xl md:text-8xl font-black tracking-tight text-emerald-400 text-center drop-shadow-2xl">
              {orders.some(o => o.__hasNewItems) ? "NUEVOS ARTÍCULOS" : "NUEVA ORDEN"}
            </div>
            <div className="mt-6 text-2xl text-emerald-200/90 text-center font-medium">
              Revisa la pantalla
            </div>
          </div>
        </div>
      )}

      {soundEnabled && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <button
            onClick={() => { playNewItem(); }}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,144,10,0.25)",
              color: "#D4900A",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,144,10,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            Probar: ítem agregado
          </button>
          <button
            onClick={() => { playNewOrder(); }}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "#34D399",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52,211,153,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            Probar: nueva orden
          </button>
        </div>
      )}

      <header
        className="sticky top-0 z-40 backdrop-blur-lg"
        style={{
          background: "rgba(13,13,13,0.92)",
          borderBottom: "1px solid rgba(212,144,10,0.15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-black tracking-widest uppercase"
              style={{ color: "#D4900A" }}
            >
              Cocina
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#4B5563" }}>
              Mostrando {visibleOrders?.length || 0} órdenes activas
              {totalPending > MAX_VISIBLE_ORDERS && ` • Total pendientes: ${totalPending}`}
            </p>
          </div>
          <div
            className="text-center px-5 py-2 rounded-xl"
            style={{
              background: "rgba(212,144,10,0.08)",
              border: "1px solid rgba(212,144,10,0.2)",
            }}
          >
            <div className="text-2xl font-black" style={{ color: "#D4900A" }}>
              {visibleOrders?.length || 0}
            </div>
            <div className="text-xs" style={{ color: "#6B7280" }}>pendientes</div>
          </div>
        </div>
        {errorMsg && (
          <div className="px-6 py-2 text-center text-sm text-red-300"
            style={{ background: "rgba(220,38,38,0.15)", borderTop: "1px solid rgba(220,38,38,0.3)" }}>
            {errorMsg}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {visibleOrders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center gap-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2"
              style={{ background: "rgba(212,144,10,0.08)", border: "1px solid rgba(212,144,10,0.2)" }}
            >
              ✓
            </div>
            <div className="text-2xl font-bold" style={{ color: "#D4900A" }}>Todo al día</div>
            <div className="text-sm" style={{ color: "#4B5563" }}>No hay órdenes pendientes</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleOrders.map((order) => (
              <KitchenOrderCard key={order.id || order._id} order={order} now={now} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}