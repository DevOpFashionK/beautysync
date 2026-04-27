"use client";

// components/dashboard/metrics/ExportReportButton.tsx
//
// Botón de exportación de reporte PDF con selección por categorías.
//
// Flujo:
//   1. Dueña hace clic en "Exportar reporte"
//   2. Modal muestra 5 categorías con checkboxes
//   3. Selecciona las que quiere (o "Exportar todo")
//   4. html2canvas captura cada sección del DOM por su data-export-id
//   5. jsPDF ensambla el PDF con encabezado, secciones capturadas y pie
//
// Cada sección del dashboard tiene data-export-id="nombre-seccion"
// Este componente busca esos elementos y los captura como imágenes.
//
// Props:
//   salonName    — nombre del salón (aparece en el header del PDF)
//   primaryColor — color de acento del salón
//   currentMonth — mes del reporte ("Abril 2026")

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  CheckSquare,
  Square,
  Loader2,
  FileText,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExportCategory {
  id: string; // coincide con data-export-id del DOM
  label: string;
  description: string;
}

interface ExportReportButtonProps {
  salonName: string;
  primaryColor: string;
  currentMonth: string;
}

type ExportStatus = "idle" | "capturing" | "generating" | "done" | "error";

// ─── Categorías disponibles ───────────────────────────────────────────────────

const CATEGORIES: ExportCategory[] = [
  {
    id: "export-actividad",
    label: "Actividad",
    description: "Citas, No-Shows y Cancelaciones del mes",
  },
  {
    id: "export-finanzas",
    label: "Finanzas",
    description: "Ingresos, Ticket Promedio y comparativo mensual",
  },
  {
    id: "export-tendencias",
    label: "Tendencias",
    description: "Gráfica de barras e ingresos acumulados",
  },
  {
    id: "export-retencion",
    label: "Retención",
    description: "Rebooking y Frecuencia de visita",
  },
  {
    id: "export-servicios",
    label: "Servicios populares",
    description: "Top 5 servicios más solicitados del mes",
  },
];

// ─── Helper: formato de fecha ────────────────────────────────────────────────

function getReportDate(): string {
  return new Date().toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/El_Salvador",
  });
}

// ─── Helper: captura de sección DOM ──────────────────────────────────────────

async function captureSection(sectionId: string): Promise<string | null> {
  const element = document.querySelector(
    `[data-export-id="${sectionId}"]`,
  ) as HTMLElement | null;

  if (!element) return null;

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(element, {
      scale: 2, // resolución 2x para PDF nítido
      useCORS: true,
      backgroundColor: "#FAF8F5",
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// ─── Helper: generación del PDF ───────────────────────────────────────────────

async function generatePDF(
  salonName: string,
  primaryColor: string,
  currentMonth: string,
  selectedIds: string[],
  onStatus: (s: ExportStatus) => void,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Paleta ────────────────────────────────────────────────────────────────
  // Convertir hex primaryColor a RGB para jsPDF
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };
  const primary = hexToRgb(primaryColor);

  // ── Header del PDF ────────────────────────────────────────────────────────
  // Franja de color superior
  pdf.setFillColor(primary.r, primary.g, primary.b);
  pdf.rect(0, 0, pageW, 28, "F");

  // Nombre del salón
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(salonName, margin, 13);

  // Subtítulo
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Reporte de métricas · ${currentMonth}`, margin, 20);

  // Fecha de generación (derecha)
  const dateStr = getReportDate();
  pdf.setFontSize(8);
  pdf.text(dateStr, pageW - margin, 20, { align: "right" });

  // ── Separador ─────────────────────────────────────────────────────────────
  pdf.setDrawColor(primary.r, primary.g, primary.b);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 32, pageW - margin, 32);

  let cursorY = 38; // posición Y actual en mm

  // ── Capturar y añadir secciones seleccionadas ─────────────────────────────
  onStatus("capturing");

  for (const catId of selectedIds) {
    const category = CATEGORIES.find((c) => c.id === catId);
    if (!category) continue;

    // Label de sección en el PDF
    pdf.setTextColor(primary.r, primary.g, primary.b);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(category.label.toUpperCase(), margin, cursorY);
    cursorY += 5;

    // Línea bajo el label
    pdf.setDrawColor(237, 232, 227); // #EDE8E3
    pdf.setLineWidth(0.2);
    pdf.line(margin, cursorY, pageW - margin, cursorY);
    cursorY += 4;

    // Capturar la sección del DOM
    const imgData = await captureSection(catId);

    if (imgData) {
      // Calcular altura proporcional de la imagen en el PDF
      const element = document.querySelector(
        `[data-export-id="${catId}"]`,
      ) as HTMLElement;
      const elemW = element?.scrollWidth ?? 800;
      const elemH = element?.scrollHeight ?? 300;
      const imgH = (elemH / elemW) * contentW;
      const safeImgH = Math.min(imgH, pageH - cursorY - 20); // no exceder la página

      // Nueva página si no cabe
      if (cursorY + safeImgH > pageH - 20) {
        pdf.addPage();
        cursorY = 20;
      }

      pdf.addImage(imgData, "PNG", margin, cursorY, contentW, safeImgH);
      cursorY += safeImgH + 8;
    } else {
      // Fallback si la captura falla
      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text("(Sección no disponible)", margin, cursorY);
      cursorY += 8;
    }

    // Espaciado entre secciones
    cursorY += 4;

    // Nueva página si el cursor está muy abajo
    if (cursorY > pageH - 30) {
      pdf.addPage();
      cursorY = 20;
    }
  }

  // ── Pie de página en cada página ──────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(237, 232, 227);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
    pdf.setTextColor(180, 170, 165);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Generado por BeautySync · beautysync.vercel.app",
      margin,
      pageH - 7,
    );
    pdf.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 7, {
      align: "right",
    });
  }

  // ── Descargar ─────────────────────────────────────────────────────────────
  onStatus("generating");
  const fileName = `BeautySync_${salonName.replace(/\s+/g, "_")}_${currentMonth.replace(/\s+/g, "_")}.pdf`;
  pdf.save(fileName);
}

// ─── Checkbox item ────────────────────────────────────────────────────────────

function CategoryCheckbox({
  category,
  checked,
  onChange,
  primaryColor,
}: {
  category: ExportCategory;
  checked: boolean;
  onChange: (id: string) => void;
  primaryColor: string;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onChange(category.id)}
      className="w-full flex items-start gap-3 py-3 px-1 text-left rounded-xl
                 transition-colors"
      style={{ borderBottom: "1px solid #F3EDE8" }}
    >
      {/* Checkbox ícono */}
      <div className="mt-0.5 shrink-0">
        {checked ? (
          <CheckSquare
            size={18}
            strokeWidth={2}
            style={{ color: primaryColor }}
          />
        ) : (
          <Square size={18} strokeWidth={1.5} style={{ color: "#C4B8B0" }} />
        )}
      </div>

      {/* Label + descripción */}
      <div>
        <p
          className="text-sm font-semibold leading-tight"
          style={{ color: checked ? "#2D2420" : "#5C4F48" }}
        >
          {category.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#B5A99F" }}>
          {category.description}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Status label ─────────────────────────────────────────────────────────────

function StatusLabel({ status }: { status: ExportStatus }) {
  if (status === "idle" || status === "done") return null;

  const messages: Record<ExportStatus, string> = {
    idle: "",
    capturing: "Capturando secciones...",
    generating: "Generando PDF...",
    done: "",
    error: "Ocurrió un error. Intenta de nuevo.",
  };

  const isError = status === "error";

  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-center mt-2"
      style={{ color: isError ? "#B91C1C" : "#9C8E85" }}
    >
      {messages[status]}
    </motion.p>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function ExportModal({
  salonName,
  primaryColor,
  currentMonth,
  onClose,
}: {
  salonName: string;
  primaryColor: string;
  currentMonth: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.id)), // todas seleccionadas por defecto
  );
  const [status, setStatus] = useState<ExportStatus>("idle");

  const allSelected = selected.size === CATEGORIES.length;
  const noneSelected = selected.size === 0;
  const isExporting = status === "capturing" || status === "generating";

  const toggleCategory = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(CATEGORIES.map((c) => c.id)));
  }, [allSelected]);

  const handleExport = useCallback(async () => {
    if (noneSelected || isExporting) return;

    // Orden fijo de exportación (mismo orden visual del dashboard)
    const orderedIds = CATEGORIES.map((c) => c.id).filter((id) =>
      selected.has(id),
    );

    try {
      await generatePDF(
        salonName,
        primaryColor,
        currentMonth,
        orderedIds,
        setStatus,
      );
      setStatus("done");
      setTimeout(onClose, 800);
    } catch {
      setStatus("error");
    }
  }, [
    noneSelected,
    isExporting,
    selected,
    salonName,
    primaryColor,
    currentMonth,
    onClose,
  ]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(45,36,32,0.35)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="fixed z-50 inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto
                   sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                   sm:w-[420px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#FDFBF8" }}
      >
        {/* Header del modal */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #EDE8E3" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${primaryColor}14` }}
            >
              <FileText
                size={15}
                strokeWidth={1.75}
                style={{ color: primaryColor }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#2D2420" }}>
                Exportar reporte
              </p>
              <p className="text-xs" style={{ color: "#B5A99F" }}>
                {currentMonth}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "#C4B8B0" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#9C8E85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#C4B8B0")
            }
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-4">
          {/* Seleccionar todo */}
          <motion.button
            whileHover={{ x: 2 }}
            onClick={toggleAll}
            className="w-full flex items-center gap-2 mb-2 pb-3 text-xs font-semibold"
            style={{
              color: primaryColor,
              borderBottom: `1px solid ${primaryColor}20`,
            }}
          >
            {allSelected ? (
              <CheckSquare size={15} strokeWidth={2} />
            ) : (
              <Square size={15} strokeWidth={1.5} />
            )}
            {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
          </motion.button>

          {/* Lista de categorías */}
          <div className="flex flex-col">
            {CATEGORIES.map((cat) => (
              <CategoryCheckbox
                key={cat.id}
                category={cat}
                checked={selected.has(cat.id)}
                onChange={toggleCategory}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>

        {/* Footer con botón de acción */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid #EDE8E3" }}>
          <motion.button
            whileHover={!isExporting && !noneSelected ? { y: -1 } : {}}
            whileTap={!isExporting && !noneSelected ? { scale: 0.98 } : {}}
            onClick={handleExport}
            disabled={noneSelected || isExporting}
            className="w-full flex items-center justify-center gap-2.5
                       py-3 rounded-xl text-sm font-semibold
                       transition-all duration-200"
            style={{
              background: noneSelected
                ? "#EDE8E3"
                : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
              color: noneSelected ? "#B5A99F" : "#FFFFFF",
              cursor: noneSelected || isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.85 : 1,
            }}
          >
            {isExporting ? (
              <>
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                {status === "capturing" ? "Capturando..." : "Generando PDF..."}
              </>
            ) : status === "done" ? (
              <>
                <Download size={15} strokeWidth={2} />
                ¡Listo! Descargando...
              </>
            ) : (
              <>
                <Download size={15} strokeWidth={2} />
                Exportar{" "}
                {selected.size === CATEGORIES.length
                  ? "reporte completo"
                  : `${selected.size} ${selected.size === 1 ? "sección" : "secciones"}`}
              </>
            )}
          </motion.button>

          <StatusLabel status={status} />

          {noneSelected && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: "#C4B8B0" }}
            >
              Selecciona al menos una sección
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExportReportButton({
  salonName,
  primaryColor,
  currentMonth,
}: ExportReportButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Botón trigger */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   text-sm font-medium transition-all duration-200"
        style={{
          background: "#FFFFFF",
          border: "1px solid #EDE8E3",
          color: "#5C4F48",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = primaryColor;
          (e.currentTarget as HTMLElement).style.color = primaryColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
          (e.currentTarget as HTMLElement).style.color = "#5C4F48";
        }}
      >
        <Download size={14} strokeWidth={1.75} />
        Exportar reporte
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ExportModal
            salonName={salonName}
            primaryColor={primaryColor}
            currentMonth={currentMonth}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
