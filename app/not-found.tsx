// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#FAF8F5" }}
    >
      {/* Decorative number */}
      <div className="relative mb-6">
        <p
          className="font-['Cormorant_Garamond'] text-[120px] md:text-[160px] font-semibold
                     leading-none select-none"
          style={{ color: "#EDE8E3" }}
        >
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="font-['Cormorant_Garamond'] text-2xl md:text-3xl font-semibold"
            style={{ color: "#2D2420" }}
          >
            Página no encontrada
          </p>
        </div>
      </div>

      {/* Message */}
      <p className="text-[#9C8E85] text-sm leading-relaxed max-w-xs mb-8">
        El enlace que buscas no existe o fue removido.
        Si buscas reservar una cita, verifica el link con tu salón.
      </p>

      {/* Decorative divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-px bg-[#EDE8E3]" />
        <span className="text-[#C4B8B0] text-xs">✦</span>
        <div className="w-12 h-px bg-[#EDE8E3]" />
      </div>

      {/* CTA */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                   text-white text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#D4375F" }}
      >
        Volver al inicio
      </Link>

      {/* BeautySync brand */}
      <p className="text-xs text-[#C4B8B0] mt-12">
        BeautySync · El salón que trabaja solo
      </p>
    </div>
  );
}