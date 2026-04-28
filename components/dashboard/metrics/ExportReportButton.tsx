"use client";

// components/dashboard/metrics/ExportReportButton.tsx
//
// Exportación de reporte PDF construido con jsPDF puro.
// SIN html2canvas — cada elemento se dibuja programáticamente.
//
// FIXES:
//   - Eliminada función drawBar (declarada pero nunca usada)
//   - toggle usa if/else en vez de expresión ternaria (ESLint no-unused-expressions)
//   - Símbolo ✦ reemplazado por "N°1" en el PDF (helvetica no soporta unicode especial)

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

// ─── Tipos de datos del reporte ───────────────────────────────────────────────

export interface ReportData {
  // Actividad
  citasDelMes: number;
  citasDelta: number | null;
  noShowRate: number;
  noShowDelta: number | null;
  cancellationRate: number;
  cancellationDelta: number | null;
  // Finanzas
  ingresos: number;
  ingresosDelta: number | null;
  ticketPromedio: number;
  ticketDelta: number | null;
  ingresosYearAgo: number;
  revenueYearDelta: number | null;
  clientasNuevas: number;
  clientasVolvieron: number;
  totalClients: number;
  // Retención
  rebookingRate: number;
  rebookingCount: number;
  visitFrequency: number;
  // Servicios
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
    isTop: boolean;
  }>;
  // Meta
  salonName: string;
  primaryColor: string;
  currentMonth: string;
  previousMonth: string;
}

interface ExportReportButtonProps {
  data: ReportData;
}

// ─── Categorías ───────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    id: "actividad",
    label: "Actividad",
    description: "Citas, No-Shows y Cancelaciones del mes",
  },
  {
    id: "finanzas",
    label: "Finanzas",
    description: "Ingresos, Ticket Promedio y comparativo mensual",
  },
  {
    id: "retencion",
    label: "Retención",
    description: "Rebooking y Frecuencia de visita",
  },
  {
    id: "servicios",
    label: "Servicios populares",
    description: "Top 5 servicios más solicitados del mes",
  },
];

type ExportStatus = "idle" | "generating" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getReportDate(): string {
  return new Date().toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/El_Salvador",
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function deltaText(delta: number | null): string {
  if (delta === null) return "Sin datos previos";
  if (delta === 0) return "Sin cambio vs mes anterior";
  return `${delta > 0 ? "+" : ""}${delta}% vs mes anterior`;
}

// ─── Motor de PDF ─────────────────────────────────────────────────────────────

async function buildPDF(
  data: ReportData,
  selectedIds: string[],
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const colW = pageW - margin * 2;
  const primary = hexToRgb(data.primaryColor);

  const TEXT_DARK = { r: 45, g: 36, b: 32 };
  const TEXT_MID = { r: 92, g: 79, b: 72 };
  const TEXT_LIGHT = { r: 156, g: 142, b: 133 };
  const TEXT_XLIGHT = { r: 196, g: 184, b: 176 };
  const BORDER = { r: 237, g: 232, b: 227 };
  const BG_CARD = { r: 255, g: 255, b: 255 };
  const BG_PAGE = { r: 250, g: 248, b: 245 };

  let y = 0;

  const setColor = (c: { r: number; g: number; b: number }) =>
    pdf.setTextColor(c.r, c.g, c.b);
  const setFill = (c: { r: number; g: number; b: number }) =>
    pdf.setFillColor(c.r, c.g, c.b);
  const setDraw = (c: { r: number; g: number; b: number }) =>
    pdf.setDrawColor(c.r, c.g, c.b);

  const drawFooter = () => {
    const pg = pdf.getNumberOfPages();
    setDraw(BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
    setColor(TEXT_XLIGHT);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Generado por BeautySync · beautysync.vercel.app",
      margin,
      pageH - 7,
    );
    pdf.text(`Pagina ${pg}`, pageW - margin, pageH - 7, { align: "right" });
  };

  const newPageIfNeeded = (neededH: number) => {
    if (y + neededH > pageH - 20) {
      pdf.addPage();
      setFill(BG_PAGE);
      pdf.rect(0, 0, pageW, pageH, "F");
      y = 20;
      drawFooter();
    }
  };

  const drawSectionTitle = (title: string) => {
    newPageIfNeeded(14);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    setColor(primary);
    pdf.text(title.toUpperCase(), margin, y);
    y += 3;
    setDraw(BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const drawKPICard = (
    label: string,
    value: string,
    sublabel: string,
    x: number,
    cardY: number,
    w: number,
    h: number = 28,
  ) => {
    setFill(BG_CARD);
    setDraw(BORDER);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, cardY, w, h, 2, 2, "FD");
    setFill(primary);
    pdf.roundedRect(x, cardY, w, 1.5, 0.5, 0.5, "F");
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_LIGHT);
    pdf.text(label.toUpperCase(), x + 4, cardY + 7);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_DARK);
    pdf.text(value, x + 4, cardY + 17);
    if (sublabel) {
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "normal");
      setColor(TEXT_XLIGHT);
      pdf.text(sublabel, x + 4, cardY + 23);
    }
  };

  const drawKPIRow3 = (
    cards: Array<{ label: string; value: string; sublabel: string }>,
  ) => {
    newPageIfNeeded(34);
    const gap = 3;
    const w = (colW - gap * 2) / 3;
    cards.forEach((card, i) => {
      drawKPICard(
        card.label,
        card.value,
        card.sublabel,
        margin + i * (w + gap),
        y,
        w,
      );
    });
    y += 33;
  };

  const drawKPIRow2 = (
    cards: Array<{ label: string; value: string; sublabel: string }>,
  ) => {
    newPageIfNeeded(34);
    const gap = 3;
    const w = (colW - gap) / 2;
    cards.forEach((card, i) => {
      drawKPICard(
        card.label,
        card.value,
        card.sublabel,
        margin + i * (w + gap),
        y,
        w,
      );
    });
    y += 33;
  };

  const drawSpacer = (h = 6) => {
    y += h;
  };

  // ── Fondo página 1 ────────────────────────────────────────────────────────
  setFill(BG_PAGE);
  pdf.rect(0, 0, pageW, pageH, "F");

  // ── Header ────────────────────────────────────────────────────────────────
  setFill(primary);
  pdf.rect(0, 0, pageW, 32, "F");
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text(data.salonName, margin, 14);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Reporte de metricas · ${data.currentMonth}`, margin, 22);
  pdf.setFontSize(8);
  pdf.text(getReportDate(), pageW - margin, 22, { align: "right" });

  setDraw(primary);
  pdf.setLineWidth(0.4);
  pdf.line(margin, 36, pageW - margin, 36);
  y = 42;
  drawFooter();

  // ── ACTIVIDAD ─────────────────────────────────────────────────────────────
  if (selectedIds.includes("actividad")) {
    drawSectionTitle(`Actividad · ${data.currentMonth}`);
    drawKPIRow3([
      {
        label: "Citas del mes",
        value: String(data.citasDelMes),
        sublabel: deltaText(data.citasDelta),
      },
      {
        label: "Tasa de No-Show",
        value: `${data.noShowRate}%`,
        sublabel: deltaText(
          data.noShowDelta != null ? -data.noShowDelta : null,
        ),
      },
      {
        label: "Cancelaciones",
        value: `${data.cancellationRate}%`,
        sublabel: deltaText(
          data.cancellationDelta != null ? -data.cancellationDelta : null,
        ),
      },
    ]);
    drawSpacer(4);
  }

  // ── FINANZAS ──────────────────────────────────────────────────────────────
  if (selectedIds.includes("finanzas")) {
    drawSectionTitle(`Finanzas · ${data.currentMonth}`);
    drawKPIRow3([
      {
        label: "Ingresos estimados",
        value: formatCurrency(data.ingresos),
        sublabel: deltaText(data.ingresosDelta),
      },
      {
        label: "Ticket promedio",
        value: formatCurrency(data.ticketPromedio),
        sublabel: "por cita completada",
      },
      {
        label: "Vs año anterior",
        value: formatCurrency(data.ingresosYearAgo),
        sublabel: deltaText(data.revenueYearDelta),
      },
    ]);
    drawSpacer(3);
    drawKPIRow2([
      {
        label: "Clientas nuevas",
        value: String(data.clientasNuevas),
        sublabel: "no visitaron el mes anterior",
      },
      {
        label: "Clientas que volvieron",
        value: String(data.clientasVolvieron),
        sublabel: `de ${data.totalClients} clientas en 60 dias`,
      },
    ]);
    drawSpacer(4);
  }

  // ── RETENCIÓN ─────────────────────────────────────────────────────────────
  if (selectedIds.includes("retencion")) {
    drawSectionTitle("Retencion de clientas");

    const retLabel =
      data.rebookingRate >= 60
        ? "Excelente"
        : data.rebookingRate >= 40
          ? "Buena"
          : data.rebookingRate >= 20
            ? "Regular"
            : "Por mejorar";

    const freqLabel =
      data.visitFrequency <= 14
        ? "Muy frecuente"
        : data.visitFrequency <= 30
          ? "Frecuente"
          : data.visitFrequency <= 45
            ? "Ocasional"
            : "Esporadica";

    newPageIfNeeded(50);
    const halfW = (colW - 3) / 2;

    // Card rebooking
    setFill(BG_CARD);
    setDraw(BORDER);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, halfW, 44, 2, 2, "FD");
    setFill(primary);
    pdf.roundedRect(margin, y, halfW, 1.5, 0.5, 0.5, "F");
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_LIGHT);
    pdf.text("TASA DE REBOOKING", margin + 4, y + 8);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    setColor(primary);
    pdf.text(`${data.rebookingRate}%`, margin + 4, y + 21);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_DARK);
    pdf.text(retLabel, margin + 4, y + 29);
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "normal");
    setColor(TEXT_LIGHT);
    pdf.text(
      `${data.rebookingCount} de ${data.totalClients} clientas volvieron en 60 dias`,
      margin + 4,
      y + 36,
    );

    // Card frecuencia
    const cx = margin + halfW + 3;
    setFill(BG_CARD);
    pdf.roundedRect(cx, y, halfW, 44, 2, 2, "FD");
    setFill(primary);
    pdf.roundedRect(cx, y, halfW, 1.5, 0.5, 0.5, "F");
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_LIGHT);
    pdf.text("FRECUENCIA DE VISITA", cx + 4, y + 8);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    setColor(primary);
    pdf.text(
      data.visitFrequency > 0 ? `${data.visitFrequency} dias` : "Sin datos",
      cx + 4,
      y + 21,
    );
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    setColor(TEXT_DARK);
    pdf.text(freqLabel, cx + 4, y + 29);
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "normal");
    setColor(TEXT_LIGHT);
    pdf.text("promedio entre visitas · ultimos 90 dias", cx + 4, y + 36);

    y += 49;
    drawSpacer(4);
  }

  // ── SERVICIOS ─────────────────────────────────────────────────────────────
  if (selectedIds.includes("servicios")) {
    drawSectionTitle(`Servicios populares · ${data.currentMonth}`);

    if (!data.topServices.length) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      setColor(TEXT_XLIGHT);
      pdf.text("Sin servicios registrados este mes.", margin, y);
      y += 10;
    } else {
      const maxCount = data.topServices[0]?.count ?? 1;

      // Encabezado de tabla
      newPageIfNeeded(10);
      pdf.setFontSize(6.5);
      pdf.setFont("helvetica", "bold");
      setColor(TEXT_XLIGHT);
      pdf.text("#", margin, y);
      pdf.text("SERVICIO", margin + 10, y);
      pdf.text("CITAS", pageW - margin - 20, y, { align: "right" });
      pdf.text("INGRESOS", pageW - margin, y, { align: "right" });
      y += 3;
      setDraw(BORDER);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageW - margin, y);
      y += 5;

      data.topServices.forEach((svc, i) => {
        newPageIfNeeded(18);
        const pct = Math.round((svc.count / maxCount) * 100);
        const barX = margin + 10;
        const barW = colW - 10 - 45;
        const fillW = (pct / 100) * barW;

        // FIX: "N°1" en vez de "✦" — helvetica no soporta unicode especial
        const rankLabel = svc.isTop ? "N.1" : String(i + 1);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", svc.isTop ? "bold" : "normal");
        setColor(svc.isTop ? primary : TEXT_LIGHT);
        pdf.text(rankLabel, margin + 2, y + 4, { align: "center" });

        // Nombre
        pdf.setFontSize(8);
        pdf.setFont("helvetica", svc.isTop ? "bold" : "normal");
        setColor(svc.isTop ? TEXT_DARK : TEXT_MID);
        pdf.text(svc.name, margin + 10, y + 4);

        // Citas
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        setColor(svc.isTop ? primary : TEXT_LIGHT);
        pdf.text(String(svc.count), pageW - margin - 20, y + 4, {
          align: "right",
        });

        // Ingresos
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        setColor(TEXT_MID);
        pdf.text(formatCurrency(svc.revenue), pageW - margin, y + 4, {
          align: "right",
        });

        // Barra de proporción
        setFill({ r: 243, g: 237, b: 232 });
        pdf.roundedRect(barX, y + 7, barW, 2.5, 0.5, 0.5, "F");
        if (fillW > 0) {
          setFill(
            svc.isTop
              ? primary
              : {
                  r: Math.min(255, primary.r + 80),
                  g: Math.min(255, primary.g + 80),
                  b: Math.min(255, primary.b + 80),
                },
          );
          pdf.roundedRect(barX, y + 7, fillW, 2.5, 0.5, 0.5, "F");
        }

        y += 14;

        if (i < data.topServices.length - 1) {
          setDraw({ r: 243, g: 237, b: 232 });
          pdf.setLineWidth(0.15);
          pdf.line(margin + 10, y - 1, pageW - margin, y - 1);
        }
      });
    }

    drawSpacer(4);
  }

  // ── Actualizar pie con total de páginas ───────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    pdf.setPage(pg);
    setFill(BG_PAGE);
    pdf.rect(pageW - margin - 30, pageH - 11, 35, 8, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    setColor(TEXT_XLIGHT);
    pdf.text(`Pagina ${pg} de ${totalPages}`, pageW - margin, pageH - 7, {
      align: "right",
    });
  }

  const fileName = `BeautySync_${data.salonName.replace(/\s+/g, "_")}_${data.currentMonth.replace(/\s+/g, "_")}.pdf`;
  pdf.save(fileName);
}

// ─── Checkbox item ────────────────────────────────────────────────────────────

function CategoryCheckbox({
  category,
  checked,
  onChange,
  primaryColor,
}: {
  category: Category;
  checked: boolean;
  onChange: (id: string) => void;
  primaryColor: string;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onChange(category.id)}
      className="w-full flex items-start gap-3 py-3 px-1 text-left"
      style={{ borderBottom: "1px solid #F3EDE8" }}
    >
      <div className="mt-0.5 shrink-0">
        {checked ? (
          <CheckSquare
            size={17}
            strokeWidth={2}
            style={{ color: primaryColor }}
          />
        ) : (
          <Square size={17} strokeWidth={1.5} style={{ color: "#C4B8B0" }} />
        )}
      </div>
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

// ─── Modal ────────────────────────────────────────────────────────────────────

function ExportModal({
  data,
  onClose,
}: {
  data: ReportData;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.id)),
  );
  const [status, setStatus] = useState<ExportStatus>("idle");

  const allSelected = selected.size === CATEGORIES.length;
  const noneSelected = selected.size === 0;
  const isGenerating = status === "generating";

  // FIX: if/else en vez de expresión ternaria — evita ESLint no-unused-expressions
  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(CATEGORIES.map((c) => c.id)));
  }, [allSelected]);

  const handleExport = useCallback(async () => {
    if (noneSelected || isGenerating) return;
    setStatus("generating");
    try {
      const orderedIds = CATEGORIES.map((c) => c.id).filter((id) =>
        selected.has(id),
      );
      await buildPDF(data, orderedIds);
      setStatus("done");
      setTimeout(onClose, 900);
    } catch (err) {
      console.error("PDF error:", err);
      setStatus("error");
    }
  }, [noneSelected, isGenerating, selected, data, onClose]);

  return (
    <>
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #EDE8E3" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${data.primaryColor}14` }}
            >
              <FileText
                size={15}
                strokeWidth={1.75}
                style={{ color: data.primaryColor }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#2D2420" }}>
                Exportar reporte
              </p>
              <p className="text-xs" style={{ color: "#B5A99F" }}>
                {data.currentMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
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
          <motion.button
            whileHover={{ x: 2 }}
            onClick={toggleAll}
            className="w-full flex items-center gap-2 mb-2 pb-3 text-xs font-semibold"
            style={{
              color: data.primaryColor,
              borderBottom: `1px solid ${data.primaryColor}20`,
            }}
          >
            {allSelected ? (
              <CheckSquare size={14} strokeWidth={2} />
            ) : (
              <Square size={14} strokeWidth={1.5} />
            )}
            {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
          </motion.button>

          <div className="flex flex-col">
            {CATEGORIES.map((cat) => (
              <CategoryCheckbox
                key={cat.id}
                category={cat}
                checked={selected.has(cat.id)}
                onChange={toggle}
                primaryColor={data.primaryColor}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid #EDE8E3" }}>
          <motion.button
            whileHover={!isGenerating && !noneSelected ? { y: -1 } : {}}
            whileTap={!isGenerating && !noneSelected ? { scale: 0.98 } : {}}
            onClick={handleExport}
            disabled={noneSelected || isGenerating}
            className="w-full flex items-center justify-center gap-2.5 py-3
                       rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: noneSelected
                ? "#EDE8E3"
                : `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.primaryColor}CC 100%)`,
              color: noneSelected ? "#B5A99F" : "#FFFFFF",
              opacity: isGenerating ? 0.85 : 1,
              cursor: noneSelected || isGenerating ? "not-allowed" : "pointer",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />{" "}
                Generando PDF...
              </>
            ) : status === "done" ? (
              <>
                <Download size={15} strokeWidth={2} /> ¡Listo! Descargando...
              </>
            ) : (
              <>
                <Download size={15} strokeWidth={2} />
                {selected.size === CATEGORIES.length
                  ? "Exportar reporte completo"
                  : `Exportar ${selected.size} ${selected.size === 1 ? "seccion" : "secciones"}`}
              </>
            )}
          </motion.button>

          {status === "error" && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: "#B91C1C" }}
            >
              Ocurrio un error. Intenta de nuevo.
            </p>
          )}
          {noneSelected && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: "#C4B8B0" }}
            >
              Selecciona al menos una seccion.
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExportReportButton({ data }: ExportReportButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
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
          (e.currentTarget as HTMLElement).style.borderColor =
            data.primaryColor;
          (e.currentTarget as HTMLElement).style.color = data.primaryColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
          (e.currentTarget as HTMLElement).style.color = "#5C4F48";
        }}
      >
        <Download size={14} strokeWidth={1.75} />
        Exportar reporte
      </motion.button>

      <AnimatePresence>
        {modalOpen && (
          <ExportModal data={data} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
