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
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSalon } from "@/context/SalonContext";

interface DeleteAccountProps {
  primaryColor: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.88)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
};

export default function DeleteAccount({ primaryColor }: DeleteAccountProps) {
  const { salon } = useSalon();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const deleteSchema = z.object({
    salonName: z.string().refine((val) => val === salon.name, {
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

  const redFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const wrapRedFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const w = e.currentTarget.parentElement!;
      w.style.borderColor = "rgba(239,68,68,0.4)";
      w.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const w = e.currentTarget.parentElement!;
      w.style.borderColor = "rgba(239,68,68,0.2)";
      w.style.boxShadow = "none";
    },
  };

  const handleOpenModal = () => {
    reset();
    setErrorMsg(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (deleting) return;
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
        if (
          response.status === 401 &&
          result.error === "Contraseña incorrecta"
        ) {
          setErrorMsg("La contraseña es incorrecta.");
          return;
        }
        throw new Error(result.error ?? "Error desconocido");
      }
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

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(239,68,68,0.2)",
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

  return (
    <>
      {/* ── Zona de peligro ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "5px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert
              size={11}
              strokeWidth={1.75}
              style={{ color: "rgba(252,165,165,0.7)" }}
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
            Zona de peligro
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
          Estas acciones son permanentes e irreversibles.
        </p>

        {/* Card de eliminación */}
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.15)",
            background: "rgba(239,68,68,0.04)",
            padding: "16px 18px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: T.textPrimary,
                margin: "0 0 4px",
              }}
            >
              Eliminar cuenta
            </p>
            <p
              style={{
                fontSize: "11px",
                color: T.textDim,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              Se eliminarán permanentemente tu salón, clientas, citas, servicios
              y todos tus datos. Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: "7px",
              border: "1px solid rgba(239,68,68,0.2)",
              background: "transparent",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "rgba(252,165,165,0.6)",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.color =
                "rgba(252,165,165,0.9)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "rgba(252,165,165,0.6)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(239,68,68,0.2)";
            }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,7,6,0.82)",
                backdropFilter: "blur(6px)",
                zIndex: 50,
              }}
            />

            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 51,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "440px",
                  background: "#0E0C0B",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Acento esquina — rojo en modal destructivo */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "14px",
                    height: "14px",
                    borderTop: "1px solid rgba(239,68,68,0.3)",
                    borderRight: "1px solid rgba(239,68,68,0.3)",
                    borderTopRightRadius: "14px",
                    pointerEvents: "none",
                  }}
                />

                {/* Modal header */}
                <div
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    padding: "20px 22px",
                    borderBottom: "1px solid rgba(239,68,68,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Trash2
                      size={16}
                      strokeWidth={1.75}
                      style={{ color: "rgba(252,165,165,0.75)" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 400,
                        color: T.textPrimary,
                        margin: 0,
                      }}
                    >
                      ¿Eliminar tu cuenta?
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: T.textDim,
                        margin: "2px 0 0",
                        letterSpacing: "0.03em",
                      }}
                    >
                      Esta acción es permanente e irreversible
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    disabled={deleting}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: T.textDim,
                      display: "flex",
                      alignItems: "center",
                      opacity: deleting ? 0.3 : 1,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = T.textMid)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = T.textDim)
                    }
                  >
                    <X size={15} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Modal body */}
                <div style={{ padding: "20px 22px" }}>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Consecuencias */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {[
                        "Tu salón y toda su configuración",
                        "Todas tus clientas y su historial",
                        "Todas las citas agendadas",
                        "Todos tus servicios",
                        "Tu acceso a BeautySync",
                      ].map((item) => (
                        <div
                          key={item}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <AlertTriangle
                            size={11}
                            strokeWidth={1.75}
                            style={{
                              color: "rgba(252,165,165,0.4)",
                              flexShrink: 0,
                            }}
                          />
                          <p
                            style={{
                              fontSize: "12px",
                              color: T.textDim,
                              margin: 0,
                            }}
                          >
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{ height: "1px", background: T.border }} />

                    {/* Confirmar nombre del salón */}
                    <div>
                      <FieldLabel>
                        Escribe el nombre de tu salón para confirmar
                      </FieldLabel>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "rgba(252,165,165,0.55)",
                          margin: "0 0 8px",
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{salon.name}&rdquo;
                      </p>
                      <input
                        type="text"
                        placeholder={salon.name}
                        autoComplete="off"
                        style={inputBase}
                        {...register("salonName")}
                        {...redFocus}
                      />
                      {errors.salonName && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,110,110,0.85)",
                            marginTop: "5px",
                          }}
                        >
                          {errors.salonName.message}
                        </p>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                      <FieldLabel>Confirma tu contraseña</FieldLabel>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "8px",
                          border: "1px solid rgba(239,68,68,0.2)",
                          background: T.surface2,
                          overflow: "hidden",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                      >
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Tu contraseña actual"
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
                          {...register("password")}
                          {...wrapRedFocus}
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
                            ((e.currentTarget as HTMLElement).style.color =
                              T.textMid)
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.color =
                              T.textDim)
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={15} strokeWidth={1.5} />
                          ) : (
                            <Eye size={15} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,110,110,0.85)",
                            marginTop: "5px",
                          }}
                        >
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
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
                            style={{
                              color: "rgba(252,165,165,0.7)",
                              flexShrink: 0,
                            }}
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
                    </AnimatePresence>

                    {/* Botones */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={deleting}
                        style={{
                          flex: 1,
                          padding: "11px",
                          borderRadius: "8px",
                          border: `1px solid ${T.border}`,
                          background: "transparent",
                          fontSize: "12px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: T.textDim,
                          cursor: deleting ? "not-allowed" : "pointer",
                          opacity: deleting ? 0.4 : 1,
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          if (!deleting) {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              T.borderMid;
                            (e.currentTarget as HTMLElement).style.color =
                              T.textMid;
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            T.border;
                          (e.currentTarget as HTMLElement).style.color =
                            T.textDim;
                        }}
                      >
                        Cancelar
                      </button>
                      <motion.button
                        type="submit"
                        disabled={deleting}
                        whileHover={!deleting ? { scale: 1.01 } : {}}
                        whileTap={!deleting ? { scale: 0.99 } : {}}
                        style={{
                          flex: 1,
                          padding: "11px",
                          borderRadius: "8px",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          fontSize: "12px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(252,165,165,0.85)",
                          cursor: deleting ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          opacity: deleting ? 0.7 : 1,
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          if (!deleting) {
                            (e.currentTarget as HTMLElement).style.background =
                              "rgba(239,68,68,0.18)";
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "rgba(239,68,68,0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(239,68,68,0.1)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(239,68,68,0.3)";
                        }}
                      >
                        {deleting ? (
                          <>
                            <Loader2
                              size={13}
                              strokeWidth={1.75}
                              className="animate-spin"
                            />{" "}
                            Eliminando…
                          </>
                        ) : (
                          <>
                            <Trash2 size={13} strokeWidth={1.75} /> Eliminar
                            cuenta
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
