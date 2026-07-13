import React from "react";
import { Honorario } from "@/domain/entities/Finanzas";

interface ComprobanteImpresionProps {
  honorario: Honorario;
  expediente: any;
}

export default function ComprobanteImpresion({ honorario, expediente }: ComprobanteImpresionProps) {
  const montoBolivianos = honorario.moneda === "BS" ? honorario.montoTotal : honorario.montoTotal * 6.96;
  const montoDolares = honorario.moneda === "USD" ? honorario.montoTotal : honorario.montoTotal / 6.96;

  // Cálculos matemáticos de la base de reparto
  const itBs = montoBolivianos * 0.03;
  const itUsd = montoDolares * 0.03;

  const ivaBs = montoBolivianos * 0.13;
  const ivaUsd = montoDolares * 0.13;

  const iueBs = montoBolivianos * 0.125;
  const iueUsd = montoDolares * 0.125;

  const oficinaBs = montoBolivianos * 0.10;
  const oficinaUsd = montoDolares * 0.10;

  const honorarioAbogadoBs = montoBolivianos - (itBs + ivaBs + iueBs + oficinaBs);
  const honorarioAbogadoUsd = montoDolares - (itUsd + ivaUsd + iueUsd + oficinaUsd);

  const abogadoNombre = expediente?.abogado_nombre || "____________________";
  const clienteNombre = expediente?.cliente?.nombres 
    ? `${expediente.cliente.nombres} ${expediente.cliente.apellido_paterno} ${expediente.cliente.apellido_materno}`
    : "____________________";

  const formatear = (num: number) => num.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="hidden print:block w-full text-black bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="border border-black p-4 mb-4">
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="font-bold text-lg italic">ITURRI & ASOCIADOS</h1>
            <p className="italic text-sm">La Paz, Bolivia</p>
          </div>
          <div className="border border-black px-6 py-1 font-bold text-lg">
            Nº
          </div>
        </div>

        <h2 className="text-center font-bold text-xl uppercase tracking-widest mb-6">
          Comprobante de Egreso
        </h2>

        {/* Datos descriptivos */}
        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm mb-4">
          <div className="font-bold">Lugar y Fecha:</div>
          <div>La Paz, {new Date().toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" })}</div>

          <div className="font-bold">Pagado a:</div>
          <div>{abogadoNombre}, pago Honorarios Profesionales de {clienteNombre}.</div>

          <div className="font-bold">Concepto:</div>
          <div>Pago de Honorarios profesionales, Impuestos de Ley, Fondos en custodia.</div>
        </div>

        {/* Tipo de Cambio */}
        <div className="flex justify-end mb-2 text-sm">
          <table className="border-collapse">
            <tbody>
              <tr>
                <td className="border border-black px-4 py-1 text-center font-bold bg-gray-100">T.C.</td>
              </tr>
              <tr>
                <td className="border border-black px-4 py-1 text-center">6,96</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabla Contable */}
        <table className="w-full border-collapse text-sm text-right">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 text-center bg-gray-100 w-24" rowSpan={2}>CODIGO</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100" rowSpan={2}>NOMBRE CUENTA</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100" colSpan={2}>BOLIVIANOS</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100" colSpan={2}>DÓLAR</th>
            </tr>
            <tr>
              <th className="border border-black px-2 py-1 text-center bg-gray-100 w-20">DEBE</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100 w-20">HABER</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100 w-20">DEBE</th>
              <th className="border border-black px-2 py-1 text-center bg-gray-100 w-20">HABER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">510201</td>
              <td className="border-l border-r border-black px-2 py-1 text-left"><span className="underline">REMUNERACIONES</span></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">5102010010</td>
              <td className="border-l border-r border-black px-2 py-1 text-left">
                Honorarios Profesionales<br/>
                <span className="pl-4 text-xs text-gray-700">{abogadoNombre}</span>
              </td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(honorarioAbogadoBs)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(honorarioAbogadoUsd)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">510202</td>
              <td className="border-l border-r border-black px-2 py-1 text-left"><span className="underline">IMPUESTOS Y PATENTES</span></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">5102020002</td>
              <td className="border-l border-r border-black px-2 py-1 text-left">Impuesto a las Transacciones &nbsp;3%</td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(itBs)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(itUsd)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">5102020002</td>
              <td className="border-l border-r border-black px-2 py-1 text-left">Impuesto al Valor Agregado &nbsp;13%</td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(ivaBs)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(ivaUsd)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">5102020002</td>
              <td className="border-l border-r border-black px-2 py-1 text-left">Impuesto Utilidades Empresa &nbsp;12,5%</td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(iueBs)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(iueUsd)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">110101</td>
              <td className="border-l border-r border-black px-2 py-1 text-left"><span className="underline">CAJA</span></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">1101010004</td>
              <td className="border-l border-r border-black px-2 py-1 text-left">Fondos en Custodia</td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(oficinaBs)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1">{formatear(oficinaUsd)}</td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center">110101</td>
              <td className="border-l border-r border-black px-2 py-1 text-left"><span className="underline">CAJA</span></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
              <td className="border-l border-r border-black px-2 py-1"></td>
            </tr>
            <tr>
              <td className="border-l border-r border-black px-2 py-1 text-center pb-8">1101010001</td>
              <td className="border-l border-r border-black px-2 py-1 text-left pb-8">Caja Moneda Nacional</td>
              <td className="border-l border-r border-black px-2 py-1 pb-8"></td>
              <td className="border-l border-r border-black px-2 py-1 pb-8">{formatear(montoBolivianos)}</td>
              <td className="border-l border-r border-black px-2 py-1 pb-8"></td>
              <td className="border-l border-r border-black px-2 py-1 pb-8">{formatear(montoDolares)}</td>
            </tr>
            
            {/* Totales */}
            <tr className="font-bold bg-gray-100">
              <td className="border border-black px-2 py-2 text-right" colSpan={2}>TOTALES</td>
              <td className="border border-black px-2 py-2">{formatear(montoBolivianos)}</td>
              <td className="border border-black px-2 py-2">{formatear(montoBolivianos)}</td>
              <td className="border border-black px-2 py-2">{formatear(montoDolares)}</td>
              <td className="border border-black px-2 py-2">{formatear(montoDolares)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer text */}
        <div className="mt-2 text-[11px] font-bold uppercase space-y-1 tracking-wide">
          <p>SON: {formatear(montoBolivianos)} BOLIVIANOS.</p>
          <p>SON: {formatear(montoDolares)} DÓLARES.</p>
        </div>

      </div>

      {/* Firmas */}
      <div className="grid grid-cols-3 border border-black text-xs font-bold text-center mt-8 break-inside-avoid">
        <div className="border-r border-black min-h-[100px] flex flex-col justify-end p-2 bg-gray-50 uppercase">
          ELABORADO
        </div>
        <div className="border-r border-black min-h-[100px] flex flex-col justify-end p-2 bg-gray-50 uppercase">
          AUTORIZADO
        </div>
        <div className="min-h-[100px] flex flex-col items-start text-left p-3 pt-6 gap-3">
          <div className="flex gap-2 w-full"><span className="w-12">Nombre:</span><span className="border-b border-dotted border-black flex-1"></span></div>
          <div className="flex gap-2 w-full"><span className="w-12">C.I.:</span><span className="border-b border-dotted border-black flex-1"></span></div>
          <div className="flex gap-2 w-full"><span className="w-12">Firma:</span><span className="border-b border-dotted border-black flex-1"></span></div>
          <div className="text-center w-full mt-2 font-bold bg-gray-50 py-1 uppercase">RECIBI CONFORME</div>
        </div>
      </div>
    </div>
  );
}
