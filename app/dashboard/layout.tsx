import BotonSalir from "../../components/BotonSalir";
import PerfilUsuario from "../../components/PerfilUsuario";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-xl font-bold tracking-tight">
            Iturri & Asociados
          </h2>
          <p className="text-blue-300 text-sm mt-1">CRM Legal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Aquí luego agregaremos links interactivos */}
          <a
            href="#"
            className="block px-4 py-2.5 bg-blue-800 rounded-lg font-medium transition-colors"
          >
            Inicio
          </a>
          <a
            href="#"
            className="block px-4 py-2.5 hover:bg-blue-800/50 rounded-lg text-blue-100 transition-colors"
          >
            Expedientes
          </a>
          <a
            href="#"
            className="block px-4 py-2.5 hover:bg-blue-800/50 rounded-lg text-blue-100 transition-colors"
          >
            Clientes
          </a>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="p-4 border-t border-blue-800">
            <PerfilUsuario />
            <BotonSalir />
          </div>
        </div>
      </aside>

      {/* Contenido Principal (Aquí se inyectan las páginas) */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
