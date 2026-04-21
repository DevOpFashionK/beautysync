"use client";

// components/dashboard/settings/LogoUploader.tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSalon } from "@/context/SalonContext";

interface LogoUploaderProps {
  salonId: string;
  primaryColor: string;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg"];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Formato no permitido. Usa: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo es muy grande. Máximo ${MAX_SIZE_MB}MB`;
  }
  return null;
}

export default function LogoUploader({ salonId, primaryColor }: LogoUploaderProps) {
  // Lee y actualiza el Context directamente — actualiza el sidebar en tiempo real
  const { salon, updateLogoUrl } = useSalon();
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

        // Agregar timestamp para forzar recarga del navegador si la URL es la misma
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        const { error: dbError } = await supabase
          .from("salons")
          .update({ logo_url: urlData.publicUrl }) // guardar sin timestamp en DB
          .eq("id", salonId);

        if (dbError) throw dbError;

        // Actualizar Context → sidebar se actualiza inmediatamente sin recargar
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
    [salonId, currentLogoUrl, updateLogoUrl]
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
    [uploadFile]
  );

  const handleRemoveLogo = async () => {
    setRemoving(true);
    setError(null);

    try {
      const supabase = createClient();
      const filePaths = ALLOWED_EXTENSIONS.map((ext) => `${salonId}/logo.${ext}`);
      await supabase.storage.from("salon-assets").remove(filePaths);

      const { error: dbError } = await supabase
        .from("salons")
        .update({ logo_url: null })
        .eq("id", salonId);

      if (dbError) throw dbError;

      // Actualizar Context → sidebar quita el logo inmediatamente
      updateLogoUrl(null);
      setPreview(null);
    } catch (e) {
      console.error("[LogoUploader] Remove error:", e);
      setError("Error al eliminar el logo.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}14` }}
        >
          <ImageIcon size={11} style={{ color: primaryColor }} />
        </div>
        <h2 className="font-semibold text-[#2D2420] text-sm">Logo del salón</h2>
      </div>

      <p className="text-xs text-[#9C8E85] leading-relaxed -mt-1">
        Aparece en el widget de reservas y en el dashboard.
        Formatos: JPG, PNG, WebP, SVG · Máximo {MAX_SIZE_MB}MB
      </p>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
          >
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-600">Logo actualizado correctamente</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className="relative shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed
                     flex items-center justify-center overflow-hidden transition-colors"
          style={{ borderColor: preview ? `${primaryColor}40` : "#EDE8E3" }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Logo del salón"
                className="w-full h-full object-contain p-1"
              />
              {(uploading || removing) && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin" style={{ color: primaryColor }} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImageIcon size={20} className="text-[#C4B8B0]" />
              <span className="text-[9px] text-[#C4B8B0]">Sin logo</span>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          className="flex-1"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <motion.div
            animate={{
              borderColor: isDragging ? primaryColor : "#EDE8E3",
              backgroundColor: isDragging ? `${primaryColor}06` : "#FAF8F5",
            }}
            className="rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer"
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Loader2 size={18} className="animate-spin" style={{ color: primaryColor }} />
                <p className="text-xs text-[#9C8E85]">Subiendo logo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <Upload size={18} className="text-[#C4B8B0]" />
                <div>
                  <p className="text-xs font-medium text-[#2D2420]">
                    {isDragging ? "Suelta aquí" : "Arrastra o haz clic"}
                  </p>
                  <p className="text-[10px] text-[#9C8E85] mt-0.5">para subir tu logo</p>
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => !uploading && inputRef.current?.click()}
              disabled={uploading || removing}
              className="flex-1 py-2 rounded-xl border border-[#EDE8E3] text-xs font-medium
                         text-[#9C8E85] hover:text-[#2D2420] hover:border-[#C4B8B0]
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              {uploading ? "Subiendo..." : "Seleccionar archivo"}
            </button>

            {preview && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploading || removing}
                className="px-3 py-2 rounded-xl border border-red-100 text-xs font-medium
                           text-red-400 hover:bg-red-50 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removing ? <Loader2 size={12} className="animate-spin" /> : "Eliminar"}
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
        className="hidden"
      />
    </div>
  );
}