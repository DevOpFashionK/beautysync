"use client";

// components/dashboard/settings/DeleteAccount.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSalon } from "@/context/SalonContext";

interface DeleteAccountProps {
  primaryColor: string;
}

export default function DeleteAccount({ primaryColor }: DeleteAccountProps) {
  const { salon } = useSalon();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Schema dinámico — el nombre del salón debe coincidir exactamente
  const deleteSchema = z.object({
    salonName: z
      .string()
      .refine((val) => val === salon.name, {
        message: "El nombre no coincide con el de tu salón",
      }),
    password: z.string().min(1, "Ingresa tu contraseña"),
  });

  type DeleteForm = z.infer<typeof deleteSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteForm>({ resolver: zodResolver(deleteSchema) });

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.parentElement!.style.borderColor = "#EF4444";
      e.currentTarget.parentElement!.style.boxShadow = "0 0 0 3px #EF444418";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.parentElement!.style.borderColor = "#FCA5A5";
      e.currentTarget.parentElement!.style.boxShadow = "none";
    },
  };

  const simpleFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "#EF4444";
      e.currentTarget.style.boxShadow = "0 0 0 3px #EF444418";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "#FCA5A5";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const handleOpenModal = () => {
    reset();
    setErrorMsg(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (deleting) return; // no cerrar mientras elimina
    reset();
    setErrorMsg(null);
    setShowModal(false);
  };

  const onSubmit = async (data: DeleteForm) => {
    setDeleting(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        // Error específico de contraseña incorrecta
        if (
          response.status === 401 &&
          result.error === "Contraseña incorrecta"
        ) {
          setErrorMsg("La contraseña es incorrecta.");
          return;
        }
        throw new Error(result.error ?? "Error desconocido");
      }

      // ── Éxito: redirigir a /login con mensaje ──────────────────────
      // Usar replace para que no puedan volver atrás
      router.replace("/login?deleted=true");
    } catch (e) {
      console.error("[DeleteAccount] Error:", e);
      setErrorMsg(
        "Ocurrió un error al eliminar la cuenta. Contacta a soporte.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const inputWrapperClass = `
    flex items-center rounded-xl border border-[#FCA5A5] bg-white
    overflow-hidden transition-all
  `;

  const inputClassSimple = `
    w-full px-4 py-2.5 rounded-xl border border-[#FCA5A5] bg-white
    text-sm text-[#2D2420] placeholder:text-[#C4B8B0] outline-none transition-all
  `;

  const inputClass = `
    flex-1 px-4 py-2.5 text-sm text-[#2D2420]
    placeholder:text-[#C4B8B0] outline-none bg-transparent
  `;

  return (
    <>
      {/* ── Zona de peligro ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-red-50">
            <ShieldAlert size={11} className="text-red-500" />
          </div>
          <h2 className="font-semibold text-[#2D2420] text-sm">
            Zona de peligro
          </h2>
        </div>

        <p className="text-xs text-[#9C8E85] leading-relaxed -mt-1">
          Estas acciones son permanentes e irreversibles.
        </p>

        {/* Card de eliminación */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[#2D2420]">
                Eliminar cuenta
              </p>
              <p className="text-xs text-[#9C8E85] leading-relaxed">
                Se eliminarán permanentemente tu salón, clientas, citas,
                servicios y todos tus datos. Esta acción no se puede deshacer.
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="shrink-0 px-4 py-2 rounded-xl border border-red-200
                         text-xs font-semibold text-red-500 bg-white
                         hover:bg-red-50 hover:border-red-300 transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de confirmación ────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl
                           border border-red-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="bg-red-50 px-6 py-5 border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2D2420] text-sm">
                        ¿Eliminar tu cuenta?
                      </p>
                      <p className="text-xs text-[#9C8E85] mt-0.5">
                        Esta acción es permanente e irreversible
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5">
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                  >
                    {/* Consecuencias */}
                    <div className="flex flex-col gap-2">
                      {[
                        "Tu salón y toda su configuración",
                        "Todas tus clientas y su historial",
                        "Todas las citas agendadas",
                        "Todos tus servicios",
                        "Tu acceso a BeautySync",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <AlertTriangle
                            size={12}
                            className="text-red-400 shrink-0"
                          />
                          <p className="text-xs text-[#9C8E85]">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#EDE8E3]" />

                    {/* Confirmar nombre del salón */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                        Escribe el nombre de tu salón para confirmar
                      </label>
                      <p className="text-xs text-red-400 font-medium -mt-0.5">
                        &ldquo;{salon.name}&rdquo;
                      </p>
                      <input
                        type="text"
                        className={inputClassSimple}
                        placeholder={salon.name}
                        autoComplete="off"
                        {...register("salonName")}
                        {...simpleFocusHandlers}
                      />
                      {errors.salonName && (
                        <p className="text-xs text-red-500">
                          {errors.salonName.message}
                        </p>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                        Confirma tu contraseña
                      </label>
                      <div className={inputWrapperClass}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={inputClass}
                          placeholder="Tu contraseña actual"
                          autoComplete="current-password"
                          {...register("password")}
                          {...focusHandlers}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="px-3 text-[#C4B8B0] hover:text-[#9C8E85] transition-colors shrink-0"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Error general */}
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                        >
                          <AlertTriangle
                            size={14}
                            className="text-red-400 shrink-0"
                          />
                          <p className="text-xs text-red-600">{errorMsg}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Botones */}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl border border-[#EDE8E3]
                                   text-sm font-semibold text-[#9C8E85]
                                   hover:text-[#2D2420] hover:border-[#C4B8B0]
                                   transition-all disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <motion.button
                        type="submit"
                        disabled={deleting}
                        whileHover={!deleting ? { scale: 1.01 } : {}}
                        whileTap={!deleting ? { scale: 0.99 } : {}}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                                   text-white bg-red-500 hover:bg-red-600
                                   flex items-center justify-center gap-2
                                   transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deleting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Eliminando…
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            Eliminar cuenta
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
