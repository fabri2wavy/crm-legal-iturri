"use client";

import TestBaseDatos from "../../components/TestBaseDatos";

const METRIC_CARDS = [
  {
    label: "Casos Activos",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v2M6.5 7h11l-1 12H7.5L6.5 7zM4 7h16M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
    ),
    accentColor: "var(--color-gold)",
    accentBg: "var(--color-gold-dim)",
  },
  {
    label: "Clientes Registrados",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accentColor: "var(--color-info)",
    accentBg: "var(--color-info-bg)",
  },
  {
    label: "Audiencias Próximas",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    accentColor: "var(--color-warning)",
    accentBg: "var(--color-warning-bg)",
  },
];

export default function DashboardInicio() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sección de Bienvenida */}
      <div className="mb-8 animate-fade-up">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Panel de Control
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Bienvenido al sistema integrado de gestión legal.
        </p>
        <p
          className="text-sm mt-1 capitalize"
          style={{ color: "var(--color-text-muted)" }}
        >
          {today}
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {METRIC_CARDS.map((card, index) => (
          <div
            key={card.label}
            className="group relative p-6 rounded-xl transition-all duration-300 animate-fade-up cursor-default"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
              boxShadow: "var(--shadow-sm)",
              animationDelay: `${index * 100}ms`,
              borderLeft: `4px solid ${card.accentColor}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {card.label}
                </h3>
                <p
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {card.value}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-11 h-11 rounded-lg text-xl"
                style={{ background: card.accentBg }}
              >
                <span style={{ color: card.accentColor }}>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inyectamos el botón de prueba aquí */}
      <TestBaseDatos />
    </div>
  );
}