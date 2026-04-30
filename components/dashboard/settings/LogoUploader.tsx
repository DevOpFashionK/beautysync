"use client";

// components/dashboard/settings/LogoUploader.tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSalon } from "@/context/SalonContext";

interface LogoUploaderProps {
  salonId: string;
  primaryColor: string;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg"];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return `Formato no permitido. Usa: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`;
  if (file.size > MAX_SIZE_BYTES)
    return `El archivo es muy grande. Máximo ${MAX_SIZE_MB}MB`;
  return null;
}

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

export default function LogoUploader({
  salonId,
  primaryColor,
}: LogoUploaderProps) {
  const { salon, updateLogoUrl, canCustomizeBrand } = useSalon();
  const currentLogoUrl = salon.logoUrl;

  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setError(null);
      setSuccess(false);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const filePath = `${salonId}/logo.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("salon-assets")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("salon-assets")
          .getPublicUrl(filePath);
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        const { error: dbError } = await supabase
          .from("salons")
          .update({ logo_url: urlData.publicUrl })
          .eq("id", salonId);

        if (dbError) throw dbError;

        updateLogoUrl(publicUrl);
        setPreview(publicUrl);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (e) {
        console.error("[LogoUploader] Upload error:", e);
        setError("Error al subir el logo. Intenta nuevamente.");
        setPreview(currentLogoUrl);
      } finally {
        setUploading(false);
      }
    },
    [salonId, currentLogoUrl, updateLogoUrl],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      uploadFile(file);
    },
    [uploadFile],
  );

  const handleRemoveLogo = async () => {
    setRemoving(true);
    setError(null);
    try {
      const supabase = createClient();
      const filePaths = ALLOWED_EXTENSIONS.map(
        (ext) => `${salonId}/logo.${ext}`,
      );
      await supabase.storage.from("salon-assets").remove(filePaths);
      const { error: dbError } = await supabase
        .from("salons")
        .update({ logo_url: null })
        .eq("id", salonId);
      if (dbError) throw dbError;
      updateLogoUrl(null);
      setPreview(null);
    } catch (e) {
      console.error("[LogoUploader] Remove error:", e);
      setError("Error al eliminar el logo.");
    } finally {
      setRemoving(false);
    }
  };

  // ─── Plan no Pro: bloqueo ─────────────────────────────────────────────────
  if (!canCustomizeBrand) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <ImageIcon
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
            Logo del salón
          </h2>
          <span
            style={{
              fontSize: "9px",
              padding: "2px 8px",
              borderRadius: "20px",
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}22`,
              color: `${primaryColor}99`,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Plan Pro
          </span>
        </div>

        {currentLogoUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "8px",
                border: `2px dashed ${primaryColor}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src={currentLogoUrl}
                alt="Logo del salón"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "4px",
                }}
              />
            </div>
            <p style={{ fontSize: "11px", color: T.textDim, lineHeight: 1.6 }}>
              Tu logo actual se seguirá mostrando, pero no podrás cambiarlo
              hasta activar el Plan Pro.
            </p>
          </div>
        )}

        <div
          style={{
            borderRadius: "10px",
            border: `2px dashed ${T.border}`,
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: `${primaryColor}10`,
                border: `1px solid ${primaryColor}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock
                size={16}
                strokeWidth={1.75}
                style={{ color: `${primaryColor}88` }}
              />
            </div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: T.textMid,
                margin: 0,
              }}
            >
              Feature exclusiva del Plan Pro
            </p>
            <p
              style={{
                fontSize: "11px",
                color: T.textDim,
                maxWidth: "240px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Sube el logo de tu salón y refuerza tu marca en el widget de
              reservas y el dashboard.
            </p>
            <a
              href="/dashboard/billing/upgrade"
              style={{
                display: "inline-block",
                marginTop: "4px",
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: T.roseGhost,
                border: `1px solid ${T.roseBorder}`,
                color: T.roseDim,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,45,85,0.16)";
                (e.currentTarget as HTMLElement).style.color = "#FF2D55";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = T.roseGhost;
                (e.currentTarget as HTMLElement).style.color = T.roseDim;
              }}
            >
              Ver Plan Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Plan Pro: funcionalidad completa ────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
          <ImageIcon
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
          Logo del salón
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
        Formatos: JPG, PNG, WebP, SVG · Máximo {MAX_SIZE_MB}MB
      </p>

      <AnimatePresence>
        {error && (
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
              style={{ color: "rgba(252,165,165,0.7)", flexShrink: 0 }}
            />
            <p
              style={{
                fontSize: "12px",
                color: "rgba(252,165,165,0.85)",
                margin: 0,
              }}
            >
              {error}
            </p>
          </motion.div>
        )}
        {success && (
          <motion.div
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
              Logo actualizado correctamente
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        {/* Preview */}
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            width: "72px",
            height: "72px",
            borderRadius: "10px",
            border: `2px dashed ${preview ? `${primaryColor}40` : T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Logo del salón"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "4px",
                }}
              />
              {(uploading || removing) && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(8,7,6,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: primaryColor }}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <ImageIcon
                size={18}
                strokeWidth={1.25}
                style={{ color: T.textDim }}
              />
              <span
                style={{
                  fontSize: "8px",
                  color: T.textDim,
                  letterSpacing: "0.06em",
                }}
              >
                Sin logo
              </span>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          style={{ flex: 1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <motion.div
            animate={{
              borderColor: isDragging ? primaryColor : T.border,
              background: isDragging
                ? `${primaryColor}06`
                : "rgba(255,255,255,0.015)",
            }}
            style={{
              borderRadius: "8px",
              border: `2px dashed ${T.border}`,
              padding: "14px",
              textAlign: "center",
              cursor: uploading ? "default" : "pointer",
            }}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: `${primaryColor}99` }}
                />
                <p style={{ fontSize: "11px", color: T.textDim, margin: 0 }}>
                  Subiendo logo...
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Upload
                  size={16}
                  strokeWidth={1.5}
                  style={{ color: T.textDim }}
                />
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: T.textMid,
                      margin: 0,
                    }}
                  >
                    {isDragging ? "Suelta aquí" : "Arrastra o haz clic"}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: T.textDim,
                      margin: "2px 0 0",
                    }}
                  >
                    para subir tu logo
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => !uploading && inputRef.current?.click()}
              disabled={uploading || removing}
              style={{
                flex: 1,
                padding: "7px 12px",
                borderRadius: "7px",
                border: `1px solid ${T.border}`,
                background: "transparent",
                fontSize: "11px",
                letterSpacing: "0.05em",
                color: T.textDim,
                cursor: uploading || removing ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                opacity: uploading || removing ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!uploading && !removing) {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    T.borderMid;
                  (e.currentTarget as HTMLElement).style.color = T.textMid;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.textDim;
              }}
            >
              {uploading ? "Subiendo..." : "Seleccionar archivo"}
            </button>
            {preview && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploading || removing}
                style={{
                  padding: "7px 12px",
                  borderRadius: "7px",
                  border: "1px solid rgba(239,68,68,0.18)",
                  background: "transparent",
                  fontSize: "11px",
                  color: "rgba(252,165,165,0.6)",
                  cursor: uploading || removing ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  opacity: uploading || removing ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(239,68,68,0.07)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(252,165,165,0.85)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(252,165,165,0.6)";
                }}
              >
                {removing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Eliminar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
