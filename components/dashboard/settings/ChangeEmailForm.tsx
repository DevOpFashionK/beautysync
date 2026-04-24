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

  // focusHandlers para inputs sin wrapper (email field tiene borde propio)
  const simpleFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = primaryColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "#EDE8E3";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const onSubmit = async (data: EmailForm) => {
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const supabase = createClient();

      // ── Paso 1: obtener email actual de la sesión ──────────────────────
      const { data: userData } = await supabase.auth.getUser();
      const currentEmail = userData.user?.email;

      if (!currentEmail) {
        setErrorMsg("No se pudo verificar tu sesión. Recarga la página.");
        return;
      }

      // ── Paso 2: verificar contraseña actual ────────────────────────────
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: data.currentPassword,
      });

      if (signInError) {
        setErrorMsg("La contraseña es incorrecta.");
        return;
      }

      // ── Paso 3: verificar que el nuevo email es diferente al actual ────
      if (data.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
        setErrorMsg("El nuevo email debe ser diferente al actual.");
        return;
      }

      // ── Paso 4: solicitar cambio de email ──────────────────────────────
      // Supabase enviará confirmación a AMBOS emails automáticamente
      // porque "Secure email change" está activado en el dashboard
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

  const inputWrapperClass = `
    flex items-center rounded-xl border border-[#EDE8E3] bg-white
    overflow-hidden transition-all
  `;

  const inputClass = `
    flex-1 px-4 py-2.5 text-sm text-[#2D2420]
    placeholder:text-[#C4B8B0] outline-none bg-transparent
  `;

  const inputClassSimple = `
    w-full px-4 py-2.5 rounded-xl border border-[#EDE8E3] bg-white
    text-sm text-[#2D2420] placeholder:text-[#C4B8B0] outline-none transition-all
  `;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}14` }}
        >
          <Mail size={11} style={{ color: primaryColor }} />
        </div>
        <h2 className="font-semibold text-[#2D2420] text-sm">Cambiar email</h2>
      </div>

      <p className="text-xs text-[#9C8E85] leading-relaxed -mt-1">
        Recibirás un email de confirmación en tu dirección actual y en la nueva.
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
              type={showPassword ? "text" : "password"}
              className={inputClass}
              placeholder="Confirma tu identidad"
              autoComplete="current-password"
              {...register("currentPassword")}
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
          {errors.currentPassword && (
            <p className="text-xs text-red-500">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* Divisor visual */}
        <div className="border-t border-[#EDE8E3]" />

        {/* Nuevo email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
            Nuevo email
          </label>
          <input
            type="email"
            className={inputClassSimple}
            placeholder="nuevo@ejemplo.com"
            autoComplete="email"
            {...register("newEmail")}
            {...simpleFocusHandlers}
          />
          {errors.newEmail && (
            <p className="text-xs text-red-500">{errors.newEmail.message}</p>
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
              className="flex flex-col gap-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">
                  ¡Solicitud enviada correctamente!
                </p>
              </div>
              <p className="text-xs text-emerald-600 leading-relaxed pl-5">
                Revisa ambos correos y confirma el cambio en cada uno. Tu email
                actual seguirá funcionando hasta que confirmes en los dos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón submit */}
        <motion.button
          type="submit"
          disabled={saving || success}
          whileHover={!saving && !success ? { scale: 1.01 } : {}}
          whileTap={!saving && !success ? { scale: 0.99 } : {}}
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
              <Mail size={15} /> Cambiar email
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
