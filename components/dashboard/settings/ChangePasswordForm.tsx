"use client";

// components/dashboard/settings/ChangePasswordForm.tsx
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
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChangePasswordFormProps {
  primaryColor: string;
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

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

// ─── Input con toggle de visibilidad ─────────────────────────────────────────
function PasswordInput({
  id,
  show,
  onToggle,
  placeholder,
  autoComplete,
  registration,
  focusHandlers,
  hasError,
}: {
  id: string;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  focusHandlers: {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  };
  hasError: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "8px",
        border: `1px solid ${hasError ? "rgba(255,80,80,0.45)" : T.borderMid}`,
        background: T.surface2,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
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
        {...registration}
        {...focusHandlers}
      />
      <button
        type="button"
        onClick={onToggle}
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
        {show ? (
          <EyeOff size={15} strokeWidth={1.5} />
        ) : (
          <Eye size={15} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

export default function ChangePasswordForm({
  primaryColor,
}: ChangePasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const wrap = e.currentTarget.parentElement!;
      wrap.style.borderColor = T.roseBorder;
      wrap.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const wrap = e.currentTarget.parentElement!;
      wrap.style.borderColor = T.borderMid;
      wrap.style.boxShadow = "none";
    },
  };

  const onSubmit = async (data: PasswordForm) => {
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;

      if (!email) {
        setErrorMsg("No se pudo verificar tu sesión. Recarga la página.");
        return;
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.currentPassword,
      });
      if (signInError) {
        setErrorMsg("La contraseña actual es incorrecta.");
        return;
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error("[ChangePasswordForm] Error:", e);
      setErrorMsg("No se pudo actualizar la contraseña. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
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
          <KeyRound
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
          Cambiar contraseña
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
        Confirma tu contraseña actual antes de establecer una nueva.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Contraseña actual */}
        <div>
          <FieldLabel>Contraseña actual</FieldLabel>
          <PasswordInput
            id="current"
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
            registration={register("currentPassword")}
            focusHandlers={focusHandlers}
            hasError={!!errors.currentPassword}
          />
          <ErrMsg msg={errors.currentPassword?.message} />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: T.border }} />

        {/* Nueva contraseña */}
        <div>
          <FieldLabel>Nueva contraseña</FieldLabel>
          <PasswordInput
            id="new"
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            registration={register("password")}
            focusHandlers={focusHandlers}
            hasError={!!errors.password}
          />
          <ErrMsg msg={errors.password?.message} />
        </div>

        {/* Confirmar contraseña */}
        <div>
          <FieldLabel>Confirmar contraseña</FieldLabel>
          <PasswordInput
            id="confirm"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            placeholder="Repite la nueva contraseña"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            focusHandlers={focusHandlers}
            hasError={!!errors.confirmPassword}
          />
          <ErrMsg msg={errors.confirmPassword?.message} />
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
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.18)",
                borderRadius: "8px",
                padding: "10px 12px",
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
                  color: "rgba(52,211,153,0.85)",
                  margin: 0,
                }}
              >
                ¡Contraseña actualizada correctamente!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={!saving ? { y: -1 } : {}}
          whileTap={!saving ? { scale: 0.99 } : {}}
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
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            opacity: saving ? 0.5 : 1,
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!saving) {
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
              <KeyRound size={14} strokeWidth={1.75} /> Actualizar contraseña
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
