"use client";

// app/(dashboard)/dashboard/settings/page.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle, Copy, ExternalLink } from "lucide-react";
import BusinessHoursConfig from "@/components/dashboard/settings/BusinessHoursConfig";
import LogoUploader from "@/components/dashboard/settings/LogoUploader";
import ChangePasswordForm from "@/components/dashboard/settings/ChangePasswordForm";
import ChangeEmailForm from "@/components/dashboard/settings/ChangeEmailForm";
import DeleteAccount from "@/components/dashboard/settings/DeleteAccount";
import { useSalon } from "@/context/SalonContext";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const T = {
  bg: "#080706",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  timezone: z.string(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const TIMEZONES = [
  { value: "America/El_Salvador", label: "El Salvador (GMT-6)" },
  { value: "America/Guatemala", label: "Guatemala (GMT-6)" },
  { value: "America/Tegucigalpa", label: "Honduras (GMT-6)" },
  { value: "America/Managua", label: "Nicaragua (GMT-6)" },
  { value: "America/Costa_Rica", label: "Costa Rica (GMT-6)" },
  { value: "America/Panama", label: "Panamá (GMT-5)" },
  { value: "America/Bogota", label: "Colombia (GMT-5)" },
  { value: "America/Mexico_City", label: "México Central (GMT-6)" },
  { value: "America/Buenos_Aires", label: "Argentina (GMT-3)" },
  { value: "Europe/Madrid", label: "España (GMT+1/+2)" },
];

// ─── Subcomponentes de UI Dark ────────────────────────────────────────────────

function SectionCard({
  children,
  delay = 0,
  danger = false,
}: {
  children: React.ReactNode;
  delay?: number;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: T.surface,
        border: `1px solid ${danger ? "rgba(239,68,68,0.15)" : T.border}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      {children}
    </motion.div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: "10px",
        fontWeight: 400,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.textDim,
        display: "block",
        marginBottom: "7px",
      }}
    >
      {children}
    </label>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { salon, updatePrimaryColor, updateName, canCustomizeBrand } =
    useSalon();
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

  const watchedColor = watch("primary_color");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: salonData } = await supabase
        .from("salons")
        .select("slug, address, phone, timezone")
        .eq("id", salon.id)
        .single();

      if (salonData) {
        setSlug(salonData.slug);
        reset({
          name: salon.name,
          address: salonData.address ?? "",
          phone: salonData.phone ?? "",
          primary_color: salon.primaryColor,
          timezone: salonData.timezone ?? "America/El_Salvador",
        });
      }
      setLoading(false);
    };
    if (salon.id) load();
  }, [salon.id, salon.name, salon.primaryColor, reset]);

  // ── onSubmit — si no puede personalizar marca, ignorar el color del form ────
  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("salons")
      .update({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        // Defensa: si no es Pro, mantener color actual
        primary_color: canCustomizeBrand
          ? data.primary_color
          : salon.primaryColor,
        timezone: data.timezone,
      })
      .eq("id", salon.id);

    updateName(data.name);
    if (canCustomizeBrand) updatePrimaryColor(data.primary_color);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryColor = watchedColor || salon.primaryColor;

  // ── Focus/blur handlers para inputs ─────────────────────────────────────────
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = T.roseBorder;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = T.borderMid;
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1px solid ${T.borderMid}`,
    background: T.surface2,
    fontSize: "14px",
    color: T.textPrimary,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: T.bg,
        }}
      >
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: T.textDim }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* Radial sutil */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle at top right, rgba(255,45,85,0.04) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="relative"
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "40px 24px 80px",
          zIndex: 1,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "1px",
                background: T.roseDim,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: T.roseDim,
              }}
            >
              Ajustes
            </span>
          </div>
          <h1
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              color: T.textPrimary,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Configuración
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: T.textDim,
              marginTop: "6px",
              letterSpacing: "0.02em",
            }}
          >
            Personaliza la información y horarios de tu salón
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ── Enlace de reservas ───────────────────────────────────── */}
          {slug && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: T.surface,
                border: `1px solid ${T.roseBorder}`,
                borderRadius: "12px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Acento esquina */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "14px",
                  height: "14px",
                  borderTop: `1px solid ${T.roseBorder}`,
                  borderRight: `1px solid ${T.roseBorder}`,
                  borderTopRightRadius: "12px",
                  pointerEvents: "none",
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: T.textPrimary,
                  margin: "0 0 4px",
                }}
              >
                Tu enlace de reservas
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: T.textDim,
                  margin: "0 0 14px",
                  letterSpacing: "0.02em",
                }}
              >
                Comparte este link con tus clientas para que agenden en línea
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    flex: 1,
                    background: T.surface2,
                    borderRadius: "7px",
                    padding: "9px 12px",
                    fontSize: "11px",
                    color: T.textDim,
                    border: `1px solid ${T.border}`,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {bookingUrl}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyLink}
                  style={{
                    padding: "9px",
                    borderRadius: "7px",
                    border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : T.border}`,
                    background: copied ? "rgba(16,185,129,0.08)" : T.surface2,
                    color: copied ? "rgba(52,211,153,0.8)" : T.textDim,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                </motion.button>
                <motion.a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "9px",
                    borderRadius: "7px",
                    border: `1px solid ${T.border}`,
                    background: T.surface2,
                    color: T.textDim,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      T.textPrimary)
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = T.textDim)
                  }
                >
                  <ExternalLink size={15} />
                </motion.a>
              </div>
            </motion.div>
          )}

          {/* ── Logo uploader ─────────────────────────────────────────── */}
          <SectionCard delay={0.04}>
            <LogoUploader salonId={salon.id} primaryColor={primaryColor} />
          </SectionCard>

          {/* ── Información del salón ─────────────────────────────────── */}
          <SectionCard delay={0.08}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 400,
                  color: T.textMid,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Información del salón
              </p>

              {/* Nombre */}
              <div>
                <FieldLabel>Nombre del salón</FieldLabel>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: errors.name
                      ? "rgba(255,80,80,0.45)"
                      : T.borderMid,
                  }}
                  {...register("name")}
                  {...focusHandlers}
                />
                {errors.name && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,110,110,0.85)",
                      marginTop: "5px",
                    }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Dirección */}
              <div>
                <FieldLabel>Dirección</FieldLabel>
                <input
                  style={inputStyle}
                  placeholder="Calle Principal 123"
                  {...register("address")}
                  {...focusHandlers}
                />
              </div>

              {/* Teléfono */}
              <div>
                <FieldLabel>Teléfono</FieldLabel>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "8px",
                    border: `1px solid ${T.borderMid}`,
                    background: T.surface2,
                    overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = T.roseBorder;
                    el.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
                  }}
                  onBlurCapture={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = T.borderMid;
                    el.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "11px 12px",
                      background: T.surface,
                      borderRight: `1px solid ${T.border}`,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>🇸🇻</span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: T.textDim,
                      }}
                    >
                      +503
                    </span>
                  </div>
                  <input
                    style={{
                      flex: 1,
                      padding: "11px 12px",
                      fontSize: "14px",
                      color: T.textPrimary,
                      background: "transparent",
                      outline: "none",
                      border: "none",
                      fontFamily: "inherit",
                    }}
                    placeholder="7000 0000"
                    {...register("phone")}
                  />
                </div>
              </div>

              {/* Zona horaria */}
              <div>
                <FieldLabel>Zona horaria</FieldLabel>
                <select
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    cursor: "pointer",
                  }}
                  {...register("timezone")}
                  {...focusHandlers}
                >
                  {TIMEZONES.map((tz) => (
                    <option
                      key={tz.value}
                      value={tz.value}
                      style={{ background: "#131110" }}
                    >
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color de marca */}
              <div>
                <FieldLabel>Color de marca</FieldLabel>
                {canCustomizeBrand ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="color"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          border: `1px solid ${T.borderMid}`,
                          cursor: "pointer",
                          padding: "4px",
                          background: T.surface2,
                        }}
                        {...register("primary_color")}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: "48px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          color: "rgba(255,255,255,0.9)",
                          fontWeight: 400,
                          background: primaryColor,
                          transition: "background 0.2s",
                        }}
                      >
                        {primaryColor}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: T.textDim,
                        marginTop: "6px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      Este color se aplica en el widget de reservas y en el
                      dashboard
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          border: `2px dashed ${T.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: T.surface2,
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={T.textDim}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: "48px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          color: "rgba(255,255,255,0.5)",
                          background: primaryColor,
                          opacity: 0.5,
                        }}
                      >
                        {primaryColor}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "6px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: T.textDim,
                          letterSpacing: "0.03em",
                        }}
                      >
                        Cambiar el color es exclusivo del Plan Pro
                      </p>
                      <a
                        href="/dashboard/billing/upgrade"
                        style={{
                          fontSize: "10px",
                          color: T.roseDim,
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color =
                            T.rose)
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color =
                            T.roseDim)
                        }
                      >
                        Ver Plan Pro →
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Guardar */}
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={!saving ? { y: -1 } : {}}
                whileTap={!saving ? { scale: 0.99 } : {}}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${saved ? "rgba(52,211,153,0.25)" : T.roseBorder}`,
                  background: saved ? "rgba(16,185,129,0.08)" : T.roseGhost,
                  color: saved ? "rgba(52,211,153,0.85)" : T.roseDim,
                  fontSize: "12px",
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: saving ? 0.5 : 1,
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => {
                  if (!saving && !saved) {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,45,85,0.14)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,45,85,0.4)";
                    (e.currentTarget as HTMLElement).style.color = T.rose;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving && !saved) {
                    (e.currentTarget as HTMLElement).style.background =
                      T.roseGhost;
                    (e.currentTarget as HTMLElement).style.borderColor =
                      T.roseBorder;
                    (e.currentTarget as HTMLElement).style.color = T.roseDim;
                  }
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Guardando…
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle size={14} /> ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save size={14} /> Guardar cambios
                  </>
                )}
              </motion.button>
            </form>
          </SectionCard>

          {/* ── Business Hours ────────────────────────────────────────── */}
          <SectionCard delay={0.12}>
            <BusinessHoursConfig
              salonId={salon.id}
              primaryColor={primaryColor}
            />
          </SectionCard>

          {/* ── Cambiar contraseña ────────────────────────────────────── */}
          <SectionCard delay={0.16}>
            <ChangePasswordForm primaryColor={primaryColor} />
          </SectionCard>

          {/* ── Cambiar email ─────────────────────────────────────────── */}
          <SectionCard delay={0.2}>
            <ChangeEmailForm primaryColor={primaryColor} />
          </SectionCard>

          {/* ── Zona de peligro ───────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(239,68,68,0.12)",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(239,68,68,0.3)",
              }}
            >
              Zona de peligro
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(239,68,68,0.12)",
              }}
            />
          </div>

          <SectionCard delay={0.24} danger>
            <DeleteAccount primaryColor={primaryColor} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
