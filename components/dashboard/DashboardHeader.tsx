"use client";

// components/dashboard/DashboardHeader.tsx
//
// Saludo y fecha calculados en el cliente, no en el servidor.
//
// Este componente se carga con dynamic() + ssr:false desde page.tsx,
// lo que significa que NUNCA se renderiza en el servidor — elimina
// el Hydration Error #418 de raíz sin necesidad de suppressHydrationWarning.
//
// ssr:false es la solución correcta cuando el contenido depende de datos
// que solo el browser conoce (timezone local, hora actual del usuario).

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
  const [greeting, setGreeting] = useState<string>("");
  const [dateFormatted, setDateFormatted] = useState<string>("");

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
        <h1
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
