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
      .max(72, "Máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

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
      e.currentTarget.parentElement!.style.borderColor = primaryColor;
      e.currentTarget.parentElement!.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.parentElement!.style.borderColor = "#EDE8E3";
      e.currentTarget.parentElement!.style.boxShadow = "none";
    },
  };

  const onSubmit = async (data: PasswordForm) => {
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const supabase = createClient();

      // ── Paso 1: verificar contraseña actual ────────────────────────────
      // Supabase no tiene verifyPassword() — el patrón oficial es
      // intentar signInWithPassword y comprobar si falla.
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;

      if (!email) {
        setErrorMsg("No se pudo verificar tu sesión. Recarga la página.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.currentPassword,
      });

      if (signInError) {
        // Error específico — no revelar si la cuenta existe o no,
        // pero en este contexto el usuario ya está logueado, así que
        // es seguro indicar que la contraseña actual es incorrecta.
        setErrorMsg("La contraseña actual es incorrecta.");
        return;
      }

      // ── Paso 2: actualizar a la nueva contraseña ───────────────────────
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

  const inputWrapperClass = `
    flex items-center rounded-xl border border-[#EDE8E3] bg-white
    overflow-hidden transition-all
  `;

  const inputClass = `
    flex-1 px-4 py-2.5 text-sm text-[#2D2420]
    placeholder:text-[#C4B8B0] outline-none bg-transparent
  `;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}14` }}
        >
          <KeyRound size={11} style={{ color: primaryColor }} />
        </div>
        <h2 className="font-semibold text-[#2D2420] text-sm">
          Cambiar contraseña
        </h2>
      </div>

      <p className="text-xs text-[#9C8E85] leading-relaxed -mt-1">
        Confirma tu contraseña actual antes de establecer una nueva.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 mt-1"
      >
        {/* Contraseña actual */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
            Contraseña actual
          </label>
          <div className={inputWrapperClass}>
            <input
              type={showCurrent ? "text" : "password"}
              className={inputClass}
              placeholder="Tu contraseña actual"
              autoComplete="current-password"
              {...register("currentPassword")}
              {...focusHandlers}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="px-3 text-[#C4B8B0] hover:text-[#9C8E85] transition-colors shrink-0"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* Divisor visual */}
        <div className="border-t border-[#EDE8E3]" />

        {/* Nueva contraseña */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
            Nueva contraseña
          </label>
          <div className={inputWrapperClass}>
            <input
              type={showPassword ? "text" : "password"}
              className={inputClass}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
              {...focusHandlers}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="px-3 text-[#C4B8B0] hover:text-[#9C8E85] transition-colors shrink-0"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
            Confirmar contraseña
          </label>
          <div className={inputWrapperClass}>
            <input
              type={showConfirm ? "text" : "password"}
              className={inputClass}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              {...register("confirmPassword")}
              {...focusHandlers}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="px-3 text-[#C4B8B0] hover:text-[#9C8E85] transition-colors shrink-0"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Mensajes de error / éxito */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-600">{errorMsg}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
            >
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-600">
                ¡Contraseña actualizada correctamente!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón submit */}
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={!saving ? { scale: 1.01 } : {}}
          whileTap={!saving ? { scale: 0.99 } : {}}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white
                     flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 24px ${primaryColor}25`,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Verificando…
            </>
          ) : (
            <>
              <KeyRound size={15} /> Actualizar contraseña
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
