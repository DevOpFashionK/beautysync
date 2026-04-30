"use client";

// components/dashboard/DashboardHeader.tsx
//
// Saludo y fecha calculados en el cliente, no en el servidor.
// Este componente se importa desde DashboardHeaderWrapper (también cliente)
// que usa dynamic() + ssr:false — Next.js App Router solo permite ssr:false
// dentro de componentes cliente ("use client"), no en Server Components.

import { useState } from "react";

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
  const [greeting] = useState<string>(() => getGreeting(new Date().getHours()));
  const [dateFormatted] = useState<string>(getDateFormatted);

  return (
    <div>
      {/* Eyebrow — nombre del salón con línea acento */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "14px",
            height: "1px",
            background: "rgba(255,45,85,0.4)",
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontSize: "10px",
            fontWeight: 400,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,45,85,0.5)",
            margin: 0,
          }}
        >
          {salonName}
        </p>
      </div>

      {/* Saludo + fecha */}
      <div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
        style={{ gap: "6px" }}
      >
        <h1
          style={{
            fontFamily:
              "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 300,
            color: "rgba(245,242,238,0.9)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {greeting}
          {firstName ? (
            <>
              ,{" "}
              <em
                style={{ fontStyle: "normal", color: "rgba(255,45,85,0.75)" }}
              >
                {firstName}
              </em>
            </>
          ) : (
            ""
          )}
          .
        </h1>

        <p
          style={{
            fontSize: "11px",
            color: "rgba(245,242,238,0.18)",
            fontWeight: 400,
            letterSpacing: "0.06em",
            paddingBottom: "4px",
            margin: 0,
          }}
        >
          {dateFormatted}
        </p>
      </div>

      {/* Divisor */}
      <div
        style={{
          marginTop: "20px",
          height: "1px",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 80%)",
        }}
      />
    </div>
  );
}
