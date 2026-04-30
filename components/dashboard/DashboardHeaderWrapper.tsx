"use client";

// components/dashboard/DashboardHeaderWrapper.tsx
//
// Wrapper cliente que carga DashboardHeader con dynamic() + ssr:false.
//
// RAZÓN DE EXISTENCIA:
// Next.js App Router no permite usar dynamic() con ssr:false en Server Components.
// La regla es: ssr:false solo puede usarse dentro de componentes "use client".
//
// PATRÓN:
//   Server Component (page.tsx)
//     → importa DashboardHeaderWrapper ("use client")
//       → dynamic(() => import DashboardHeader, { ssr: false })
//
// Esto garantiza que DashboardHeader NUNCA se renderiza en el servidor,
// eliminando el Hydration Error #418 de raíz. El servidor renderiza el
// skeleton del loading mientras el cliente monta el componente real.

import dynamic from "next/dynamic";

// Skeleton Dark Atelier — misma estructura que DashboardHeader
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div
        className="h-2.5 w-20 rounded-full mb-3"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div
        className="h-9 w-64 rounded-lg mb-2"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div
        className="h-2.5 w-36 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
      <div
        className="mt-5 h-px w-full"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
    </div>
  );
}

const DashboardHeader = dynamic(
  () => import("@/components/dashboard/DashboardHeader"),
  {
    ssr: false,
    loading: () => <HeaderSkeleton />,
  },
);

interface DashboardHeaderWrapperProps {
  salonName: string;
  firstName: string;
  primaryColor: string;
}

export default function DashboardHeaderWrapper({
  salonName,
  firstName,
  primaryColor,
}: DashboardHeaderWrapperProps) {
  return (
    <DashboardHeader
      salonName={salonName}
      firstName={firstName}
      primaryColor={primaryColor}
    />
  );
}
