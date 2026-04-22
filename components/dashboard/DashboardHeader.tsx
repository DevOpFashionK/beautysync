"use client";

// components/dashboard/DashboardHeader.tsx
//
// Saludo y fecha calculados en el CLIENTE, no en el servidor.
//
// PROBLEMA: page.tsx calculaba hour y dateStr con new Date() en el servidor
// (UTC). A las 9:53pm en El Salvador (UTC-6), el servidor ya dice que son
// las 3:53am del día siguiente → saludo incorrecto y fecha incorrecta.
//
// SOLUCIÓN: Mover estos cálculos a un componente "use client" que corre
// en el browser, donde new Date() usa la timezone local del usuario.
// Se monta con suppressHydrationWarning para evitar mismatch en el primer
// render (el servidor no puede saber la hora local del cliente).

import { useEffect, useState } from "react";

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getGreeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getDateFormatted(): string {
  const now = new Date();
  const day = DAYS_ES[now.getDay()];
  const date = now.getDate();
  const month = MONTHS_ES[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${date} de ${month} de ${year}`;
}

interface DashboardHeaderProps {
  salonName: string;
  firstName: string;
  primaryColor: string;
}

export default function DashboardHeader({
  salonName,
  firstName,
  primaryColor,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("");
  const [dateFormatted, setDateFormatted] = useState("");

  // Calcular en el cliente una vez montado — aquí new Date() usa timezone local
  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateFormatted(getDateFormatted());
  }, []);

  return (
    <div>
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: primaryColor, letterSpacing: "0.14em" }}
      >
        {salonName}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        {/* suppressHydrationWarning porque el servidor renderiza "" y el cliente
            renderiza el saludo real — es intencional y seguro aquí */}
        <h1
          suppressHydrationWarning
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 500,
            color: "#2D2420",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {greeting}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p
          suppressHydrationWarning
          className="text-sm pb-1"
          style={{ color: "#B5A99F", fontWeight: 400 }}
        >
          {dateFormatted}
        </p>
      </div>

      <div
        className="mt-5 h-px w-full"
        style={{
          background: "linear-gradient(90deg, #E8E0D8 0%, transparent 80%)",
        }}
      />
    </div>
  );
}
