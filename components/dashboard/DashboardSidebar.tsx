"use client";

// components/dashboard/DashboardSidebar.tsx
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarCheck,
  Settings,
  Scissors,
  Users,
  LogOut,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSalon } from "@/context/SalonContext";

const navItems = [
  { href: "/dashboard", icon: CalendarDays, label: "Inicio" },
  { href: "/dashboard/appointments", icon: CalendarCheck, label: "Citas" },
  { href: "/dashboard/services", icon: Scissors, label: "Servicios" },
  { href: "/dashboard/clients", icon: Users, label: "Clientas" },
  { href: "/dashboard/settings", icon: Settings, label: "Configuración" },
  { href: "/dashboard/billing", icon: Receipt, label: "Facturación" },
];

interface SidebarProps {
  ownerName?: string;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  primaryColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
  primaryColor: string;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                   transition-all duration-200 cursor-pointer relative"
        style={
          active
            ? {
                background: `${primaryColor}12`,
                color: primaryColor,
                fontWeight: 600,
              }
            : { color: "#9C8E85", fontWeight: 400 }
        }
      >
        {active && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
            style={{ background: primaryColor }}
          />
        )}
        <Icon
          size={16}
          style={{
            color: active ? primaryColor : "#B5A99F",
            strokeWidth: active ? 2 : 1.5,
          }}
        />
        {label}
      </motion.div>
    </Link>
  );
}

export default function DashboardSidebar({ ownerName = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lee directamente del Context — se actualiza en tiempo real
  const { salon } = useSalon();
  const { name: salonName, primaryColor, logoUrl } = salon;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = ownerName
    ? ownerName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "?";

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full py-8">
      {/* Salon identity */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-2.5 mb-1">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={salonName}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-[#EDE8E3]"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-white text-xs font-bold tracking-wide"
              style={{ background: primaryColor }}
            >
              {salonName.charAt(0).toUpperCase()}
            </div>
          )}
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: primaryColor, letterSpacing: "0.12em" }}
          >
            BeautySync
          </p>
        </div>
        <p
          className="text-lg leading-tight mt-2 pl-0.5"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            color: "#2D2420",
            letterSpacing: "-0.01em",
          }}
        >
          {salonName}
        </p>
      </div>

      {/* Separador */}
      <div className="px-6 mb-6">
        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, #E8E0D8 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href)
            }
            onClick={onNavClick}
            primaryColor={primaryColor}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 pt-6" style={{ borderTop: "1px solid #EDE8E3" }}>
        {ownerName && (
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-xs font-semibold text-white shrink-0"
              style={{ background: primaryColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-700 truncate leading-tight">
                {ownerName}
              </p>
              <p className="text-xs" style={{ color: "#B5A99F" }}>
                Propietaria
              </p>
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 py-2 text-sm transition-colors"
          style={{ color: "#C4B8B0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E53E3E")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#C4B8B0")}
        >
          <LogOut size={15} strokeWidth={1.5} />
          Cerrar sesión
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col w-56 min-h-screen sticky top-0 shrink-0"
        style={{ background: "#FDFBF8", borderRight: "1px solid #EDE8E3" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 px-5 py-4
                   flex items-center justify-between"
        style={{
          background: "rgba(253,251,248,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #EDE8E3",
        }}
      >
        <div className="flex items-center gap-2.5">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={salonName}
              className="w-7 h-7 rounded-lg object-contain"
            />
          )}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 500,
              fontSize: "1.1rem",
              color: "#2D2420",
            }}
          >
            {salonName}
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: "#9C8E85" }}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50"
              style={{
                background: "rgba(45,36,32,0.3)",
                backdropFilter: "blur(4px)",
              }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 shadow-2xl"
              style={{ background: "#FDFBF8" }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-4 p-1.5 rounded-lg"
                style={{ color: "#B5A99F" }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
