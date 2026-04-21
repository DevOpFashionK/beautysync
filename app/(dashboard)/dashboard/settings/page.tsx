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
import { useSalon } from "@/context/SalonContext";

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
  { value: "America/Guatemala",   label: "Guatemala (GMT-6)" },
  { value: "America/Tegucigalpa", label: "Honduras (GMT-6)" },
  { value: "America/Managua",     label: "Nicaragua (GMT-6)" },
  { value: "America/Costa_Rica",  label: "Costa Rica (GMT-6)" },
  { value: "America/Panama",      label: "Panamá (GMT-5)" },
  { value: "America/Bogota",      label: "Colombia (GMT-5)" },
  { value: "America/Mexico_City", label: "México Central (GMT-6)" },
  { value: "America/Buenos_Aires",label: "Argentina (GMT-3)" },
  { value: "Europe/Madrid",       label: "España (GMT+1/+2)" },
];

export default function SettingsPage() {
  const { salon, updatePrimaryColor, updateName } = useSalon();
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } =
    useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

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

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("salons")
      .update({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        primary_color: data.primary_color,
        timezone: data.timezone,
      })
      .eq("id", salon.id);

    updateName(data.name);
    updatePrimaryColor(data.primary_color);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#C4B8B0]" />
      </div>
    );
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = primaryColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = "#EDE8E3";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const inputClass = `
    w-full px-4 py-2.5 rounded-xl border border-[#EDE8E3] bg-white
    text-sm text-[#2D2420] placeholder:text-[#C4B8B0] outline-none transition-all
  `;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* FIX: max-w-2xl mx-auto centra el contenido igual que Facturación */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 md:px-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: primaryColor }} />
            <span
              className="text-xs font-semibold tracking-[0.15em] uppercase"
              style={{ color: primaryColor }}
            >
              Ajustes
            </span>
          </div>
          <h1 className="font-['Cormorant_Garamond'] text-4xl font-semibold text-[#2D2420]">
            Configuración
          </h1>
          <p className="text-sm text-[#9C8E85] mt-1">
            Personaliza la información y horarios de tu salón
          </p>
        </div>

        {/* Booking link */}
        {slug && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border p-5"
            style={{ borderColor: `${primaryColor}25`, backgroundColor: `${primaryColor}06` }}
          >
            <p className="text-sm font-semibold text-[#2D2420] mb-0.5">Tu enlace de reservas</p>
            <p className="text-xs text-[#9C8E85] mb-3">
              Comparte este link con tus clientas para que agenden en línea
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-2.5 text-xs text-[#9C8E85]
                              border border-[#EDE8E3] truncate font-mono">
                {bookingUrl}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className={`p-2.5 rounded-xl border transition-all ${
                  copied
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-white border-[#EDE8E3] text-[#9C8E85] hover:text-[#2D2420]"
                }`}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </motion.button>
              <motion.a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-white border border-[#EDE8E3]
                           text-[#9C8E85] hover:text-[#2D2420] transition-colors"
              >
                <ExternalLink size={16} />
              </motion.a>
            </div>
          </motion.div>
        )}

        {/* Logo uploader */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="bg-white rounded-2xl border border-[#EDE8E3] p-6 mb-6"
        >
          <LogoUploader salonId={salon.id} primaryColor={primaryColor} />
        </motion.div>

        {/* Salon info form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-[#EDE8E3] p-6 mb-6"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <h2 className="font-semibold text-[#2D2420] text-sm">Información del salón</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                Nombre del salón
              </label>
              <input
                className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                {...register("name")}
                {...focusHandlers}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                Dirección
              </label>
              <input
                className={inputClass}
                placeholder="Calle Principal 123"
                {...register("address")}
                {...focusHandlers}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                Teléfono
              </label>
              <div
                className="flex items-center rounded-xl border border-[#EDE8E3] bg-white
                           overflow-hidden transition-all"
                onFocusCapture={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = primaryColor;
                  el.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                }}
                onBlurCapture={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#EDE8E3";
                  el.style.boxShadow = "none";
                }}
              >
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FAF8F5]
                                border-r border-[#EDE8E3] shrink-0">
                  <span className="text-sm">🇸🇻</span>
                  <span className="text-sm font-medium text-[#9C8E85]">+503</span>
                </div>
                <input
                  className="flex-1 px-3 py-2.5 text-sm text-[#2D2420]
                             placeholder:text-[#C4B8B0] outline-none bg-transparent"
                  placeholder="7000 0000"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                Zona horaria
              </label>
              <select className={`${inputClass} bg-white`} {...register("timezone")} {...focusHandlers}>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                Color de marca
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="w-12 h-12 rounded-xl border border-[#EDE8E3] cursor-pointer p-1 bg-white"
                  {...register("primary_color")}
                />
                <div
                  className="flex-1 h-12 rounded-xl flex items-center justify-center
                             text-white text-xs font-semibold tracking-wider transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  {primaryColor}
                </div>
              </div>
              <p className="text-[10px] text-[#9C8E85]">
                Este color se aplica en el widget de reservas y en el dashboard
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={!saving ? { scale: 1.01 } : {}}
              whileTap={!saving ? { scale: 0.99 } : {}}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                         flex items-center justify-center gap-2 mt-1
                         disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}25` }}
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin" /> Guardando…</>
              ) : saved ? (
                <><CheckCircle size={15} /> ¡Guardado!</>
              ) : (
                <><Save size={15} /> Guardar cambios</>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Business Hours */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-[#EDE8E3] p-6"
        >
          <BusinessHoursConfig salonId={salon.id} primaryColor={primaryColor} />
        </motion.div>

      </div>
    </div>
  );
}