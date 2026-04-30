"use client";

// components/dashboard/settings/ChangeEmailForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChangeEmailFormProps {
  primaryColor: string;
}

const emailSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newEmail: z
    .string()
    .min(1, "Ingresa el nuevo email")
    .email("Ingresa un email válido"),
});

type EmailForm = z.infer<typeof emailSchema>;

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.88)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
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

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
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

const ErrMsg = ({ msg }: { msg?: string }) =>
  msg ? (
    <p
      style={{
        fontSize: "11px",
        color: "rgba(255,110,110,0.85)",
        marginTop: "5px",
      }}
    >
      {msg}
    </p>
  ) : null;

export default function ChangeEmailForm({
  primaryColor,
}: ChangeEmailFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const wrapFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const w = e.currentTarget.parentElement!;
      w.style.borderColor = T.roseBorder;
      w.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const w = e.currentTarget.parentElement!;
      w.style.borderColor = T.borderMid;
      w.style.boxShadow = "none";
    },
  };

  const simpleFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = T.roseBorder;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = T.borderMid;
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const onSubmit = async (data: EmailForm) => {
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const currentEmail = userData.user?.email;

      if (!currentEmail) {
        setErrorMsg("No se pudo verificar tu sesión. Recarga la página.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: data.currentPassword,
      });
      if (signInError) {
        setErrorMsg("La contraseña es incorrecta.");
        return;
      }

      if (data.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
        setErrorMsg("El nuevo email debe ser diferente al actual.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      reset();
    } catch (e) {
      console.error("[ChangeEmailForm] Error:", e);
      setErrorMsg("No se pudo procesar el cambio. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "5px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mail
            size={11}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: T.textMid,
            margin: 0,
          }}
        >
          Cambiar email
        </h2>
      </div>

      <p
        style={{
          fontSize: "11px",
          color: T.textDim,
          marginTop: "-4px",
          lineHeight: 1.6,
          letterSpacing: "0.02em",
        }}
      >
        Recibirás un email de confirmación en tu dirección actual y en la nueva.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Contraseña actual */}
        <div>
          <FieldLabel>Contraseña actual</FieldLabel>
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
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirma tu identidad"
              autoComplete="current-password"
              style={{
                flex: 1,
                padding: "11px 14px",
                fontSize: "14px",
                color: T.textPrimary,
                background: "transparent",
                outline: "none",
                border: "none",
                fontFamily: "inherit",
              }}
              {...register("currentPassword")}
              {...wrapFocus}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              style={{
                padding: "0 12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.textDim,
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = T.roseDim)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = T.textDim)
              }
            >
              {showPassword ? (
                <EyeOff size={15} strokeWidth={1.5} />
              ) : (
                <Eye size={15} strokeWidth={1.5} />
              )}
            </button>
          </div>
          <ErrMsg msg={errors.currentPassword?.message} />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: T.border }} />

        {/* Nuevo email */}
        <div>
          <FieldLabel>Nuevo email</FieldLabel>
          <input
            type="email"
            placeholder="nuevo@ejemplo.com"
            autoComplete="email"
            style={inputStyle}
            {...register("newEmail")}
            {...simpleFocus}
          />
          <ErrMsg msg={errors.newEmail?.message} />
        </div>

        {/* Banners */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <AlertTriangle
                size={13}
                strokeWidth={1.75}
                style={{ color: "rgba(252,165,165,0.7)", flexShrink: 0 }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(252,165,165,0.85)",
                  margin: 0,
                }}
              >
                {errorMsg}
              </p>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.18)",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <CheckCircle
                  size={13}
                  strokeWidth={1.75}
                  style={{ color: "rgba(52,211,153,0.7)", flexShrink: 0 }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "rgba(52,211,153,0.85)",
                    margin: 0,
                  }}
                >
                  ¡Solicitud enviada correctamente!
                </p>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(52,211,153,0.6)",
                  lineHeight: 1.65,
                  margin: "0 0 0 21px",
                }}
              >
                Revisa ambos correos y confirma el cambio en cada uno. Tu email
                actual seguirá funcionando hasta que confirmes en los dos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={saving || success}
          whileHover={!saving && !success ? { y: -1 } : {}}
          whileTap={!saving && !success ? { scale: 0.99 } : {}}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${T.roseBorder}`,
            background: T.roseGhost,
            color: T.roseDim,
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: saving || success ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            opacity: saving || success ? 0.5 : 1,
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!saving && !success) {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,45,85,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(255,45,85,0.4)";
              (e.currentTarget as HTMLElement).style.color = "#FF2D55";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = T.roseGhost;
            (e.currentTarget as HTMLElement).style.borderColor = T.roseBorder;
            (e.currentTarget as HTMLElement).style.color = T.roseDim;
          }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Verificando…
            </>
          ) : (
            <>
              <Mail size={14} strokeWidth={1.75} /> Cambiar email
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
