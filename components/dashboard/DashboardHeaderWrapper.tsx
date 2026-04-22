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

// Skeleton con la misma estructura visual que DashboardHeader
// para evitar layout shift mientras carga
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-24 rounded-full bg-[#EDE8E3] mb-3" />
      <div className="h-10 w-72 rounded-xl bg-[#EDE8E3] mb-2" />
      <div className="h-3 w-40 rounded-full bg-[#EDE8E3]" />
      <div className="mt-5 h-px w-full bg-[#E8E0D8]" />
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
