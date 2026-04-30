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

// ── NAV ITEM ──────────────────────────────────────────────────────────────────
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
    <Link href={href} onClick={onClick} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "9px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          letterSpacing: "0.04em",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.15s",
          background: active ? "rgba(255,45,85,0.08)" : "transparent",
          color: active ? "rgba(245,242,238,0.9)" : "rgba(245,242,238,0.28)",
          fontWeight: active ? 400 : 400,
          borderLeft: active
            ? "1px solid rgba(255,45,85,0.35)"
            : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = "rgba(245,242,238,0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(245,242,238,0.28)";
          }
        }}
      >
        <Icon
          size={15}
          strokeWidth={active ? 1.75 : 1.5}
          style={{
            color: active ? "rgba(255,45,85,0.75)" : "rgba(245,242,238,0.22)",
            flexShrink: 0,
          }}
        />
        {label}
      </motion.div>
    </Link>
  );
}

// ── SIDEBAR CONTENT ───────────────────────────────────────────────────────────
interface SidebarContentProps {
  onNavClick?: () => void;
  pathname: string;
  salonName: string;
  primaryColor: string;
  logoUrl: string | null;
  ownerName: string;
  initials: string;
  onLogout: () => void;
}

function SidebarContent({
  onNavClick,
  pathname,
  salonName,
  primaryColor,
  logoUrl,
  ownerName,
  initials,
  onLogout,
}: SidebarContentProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "28px 0",
      }}
    >
      {/* ── Identidad del salón ── */}
      <div style={{ padding: "0 20px", marginBottom: "32px" }}>
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          {/* Logo box — logo del salón o inicial */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "1px solid rgba(255,45,85,0.22)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,45,85,0.06)",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={salonName}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "rgba(255,45,85,0.7)",
                  letterSpacing: "-0.02em",
                }}
              >
                {salonName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Marca BeautySync */}
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(245,242,238,0.2)",
              fontWeight: 400,
            }}
          >
            BeautySync
          </span>
        </div>

        {/* Nombre del salón */}
        <p
          style={{
            fontFamily:
              "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "1.25rem",
            fontWeight: 300,
            color: "rgba(245,242,238,0.9)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            margin: 0,
            paddingLeft: "2px",
          }}
        >
          {salonName}
        </p>
      </div>

      {/* ── Separador ── */}
      <div
        style={{
          margin: "0 20px 24px",
          height: "1px",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          flex: 1,
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
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

      {/* ── Footer ── */}
      <div
        style={{
          padding: "20px 20px 0",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          marginTop: "16px",
        }}
      >
        {/* Owner info */}
        {ownerName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255,45,85,0.1)",
                border: "1px solid rgba(255,45,85,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 400,
                color: "rgba(255,45,85,0.65)",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(245,242,238,0.45)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {ownerName}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(245,242,238,0.18)",
                  margin: 0,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Propietaria
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            color: "rgba(245,242,238,0.18)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,80,80,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(245,242,238,0.18)";
          }}
        >
          <LogOut size={13} strokeWidth={1.5} />
          Cerrar sesión
        </motion.button>
      </div>
    </div>
  );
}

// ── DASHBOARD SIDEBAR ─────────────────────────────────────────────────────────
export default function DashboardSidebar({ ownerName = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    : salonName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        style={{
          display: "none",
          width: "220px",
          minHeight: "100vh",
          flexShrink: 0,
          background: "#0D0B0A",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          position: "sticky",
          top: 0,
        }}
        className="lg:flex lg:flex-col"
      >
        <SidebarContent
          pathname={pathname}
          salonName={salonName}
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          ownerName={ownerName}
          initials={initials}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile topbar ────────────────────────────────────────── */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(13,11,10,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={salonName}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "5px",
                objectFit: "contain",
              }}
            />
          )}
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontWeight: 300,
              fontSize: "1.1rem",
              color: "rgba(245,242,238,0.9)",
              margin: 0,
            }}
          >
            {salonName}
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            padding: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(245,242,238,0.3)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                background: "rgba(8,7,6,0.7)",
                backdropFilter: "blur(4px)",
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 50,
                width: "260px",
                background: "#0D0B0A",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Cerrar */}
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "14px",
                  padding: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(245,242,238,0.2)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <SidebarContent
                onNavClick={() => setMobileOpen(false)}
                pathname={pathname}
                salonName={salonName}
                primaryColor={primaryColor}
                logoUrl={logoUrl}
                ownerName={ownerName}
                initials={initials}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
