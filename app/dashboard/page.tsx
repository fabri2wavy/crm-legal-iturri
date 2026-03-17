import TestBaseDatos from "../../components/TestBaseDatos";
export default function DashboardInicio() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Panel de Control</h1>
      <p className="text-slate-500 mb-8">Bienvenido al sistema integrado de gestión legal.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta de métrica 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Casos Activos</h3>
          <p className="text-3xl font-bold text-blue-900">0</p>
        </div>

        {/* Tarjeta de métrica 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Clientes Registrados</h3>
          <p className="text-3xl font-bold text-blue-900">0</p>
        </div>

        {/* Tarjeta de métrica 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Audiencias Próximas</h3>
          <p className="text-3xl font-bold text-blue-900">0</p>
    </div>
  </div>

  {/* Inyectamos el botón de prueba aquí */}
  <TestBaseDatos />
</div>
  );
}