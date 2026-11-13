import React, { useEffect, useMemo, useState } from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PaymentMethodsBox from '../../components/PaymentMethodsBox';
import api from '../../utils/api';
import { useBcvRate, formatBs, formatRate } from '../../utils/bcv';

export default function PagosSemaforoModule({
  activePlayer,
  transactions = [],
  bcvInitial = null,
  preselectedTxId = null,
  onReceiptUploaded,
}) {
  const [receiptModalTx, setReceiptModalTx] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    metodo_pago: 'Pago Móvil',
    referencia_pago: '',
    telefono_pago: '',
    file: null,
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const { bcv } = useBcvRate(bcvInitial);
  const tasa = Number(bcv?.tasa_bcv || 0);

  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.estado_pago !== 'Pagado'),
    [transactions]
  );

  const pendingTotal = useMemo(
    () => pendingTransactions.reduce((acc, t) => acc + Number(t.monto || 0), 0),
    [pendingTransactions]
  );

  // Selecciona automáticamente la factura indicada o la primera pendiente
  const [selectedPayId, setSelectedPayId] = useState('');

  useEffect(() => {
    if (
      preselectedTxId &&
      pendingTransactions.some((t) => String(t.id_transaccion) === String(preselectedTxId))
    ) {
      setSelectedPayId(String(preselectedTxId));
    }
  }, [preselectedTxId, pendingTransactions]);

  useEffect(() => {
    if (pendingTransactions.length === 0) {
      setSelectedPayId('none');
    } else if (
      !selectedPayId ||
      selectedPayId === 'none' ||
      (selectedPayId !== 'all' &&
        !pendingTransactions.some((t) => String(t.id_transaccion) === selectedPayId))
    ) {
      setSelectedPayId(String(pendingTransactions[0].id_transaccion));
    }
  }, [pendingTransactions, selectedPayId]);

  const selectedInvoice =
    selectedPayId !== 'all' && selectedPayId !== 'none'
      ? pendingTransactions.find((t) => String(t.id_transaccion) === selectedPayId) ||
        pendingTransactions[0] ||
        null
      : null;

  const autoAmountUsd =
    pendingTransactions.length === 0
      ? 0
      : selectedPayId === 'all'
      ? pendingTotal
      : Number(selectedInvoice?.monto || pendingTotal);

  const autoConcept =
    pendingTransactions.length === 0
      ? `Solvente — ${activePlayer?.nombre || 'Atleta'} ${activePlayer?.apellido || ''}`.trim()
      : selectedPayId === 'all'
      ? `Total Pendiente (${pendingTransactions.length} cuotas) - ${activePlayer?.nombre || ''}`.trim()
      : `${selectedInvoice?.descripcion_detalle || selectedInvoice?.concepto} - ${activePlayer?.nombre || ''}`.trim();

  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptModalTx || !receiptForm.file) return;
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('metodo_pago', receiptForm.metodo_pago);
      formData.append('referencia_pago', receiptForm.referencia_pago);
      formData.append('telefono_pago', receiptForm.telefono_pago);
      formData.append('comprobante', receiptForm.file);

      await api.post(`/payments/${receiptModalTx.id_transaccion}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setReceiptModalTx(null);
      setReceiptForm({
        metodo_pago: 'Pago Móvil',
        referencia_pago: '',
        telefono_pago: '',
        file: null,
      });
      if (onReceiptUploaded) await onReceiptUploaded();
    } catch (err) {
      alert(err.response?.data?.error || 'Error subiendo comprobante.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Leyenda del Semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-fenix p-4 border-l-4 border-l-green-500">
          <p className="text-xs font-bold text-green-400">🟢 SOLVENTE</p>
          <p className="text-xs text-texto-secundario mt-1">
            Atleta al día y habilitado para entrenamientos y convocatorias.
          </p>
        </div>
        <div className="card-fenix p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs font-bold text-yellow-400">🟡 PENDIENTE</p>
          <p className="text-xs text-texto-secundario mt-1">
            Cuota emitida dentro del plazo vigente o comprobante por validar.
          </p>
        </div>
        <div className="card-fenix p-4 border-l-4 border-l-rojo-fuego">
          <p className="text-xs font-bold text-rojo-fuego">🔴 MOROSO</p>
          <p className="text-xs text-texto-secundario mt-1">
            Factura vencida. Genera bloqueo automático de convocatorias oficiales.
          </p>
        </div>
      </div>

      {/* Opciones de Pago con Monto Automático + Tasa BCV del Día */}
      <div className="card-fenix p-5 sm:p-6 space-y-4 border-vinotinto/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              OPCIONES DE PAGO CON CÁLCULO AUTOMÁTICO BCV
            </h2>
            <p className="text-xs text-texto-secundario">
              El sistema carga directamente tu deuda actual, la convierte a Bolívares BCV y permite confirmar con el botón &quot;Ya Pagué&quot;.
            </p>
          </div>

          {pendingTransactions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPayId}
                onChange={(e) => setSelectedPayId(e.target.value)}
                className="input-fenix w-auto text-xs border-vinotinto"
              >
                {pendingTransactions.map((tx) => (
                  <option key={tx.id_transaccion} value={String(tx.id_transaccion)}>
                    {tx.descripcion_detalle || tx.concepto} — ${Number(tx.monto).toFixed(2)} (
                    {tx.estado_pago})
                  </option>
                ))}
                {pendingTransactions.length > 1 && (
                  <option value="all">
                    Total Todas las Pendientes (${pendingTotal.toFixed(2)})
                  </option>
                )}
              </select>

              {(selectedInvoice || pendingTransactions[0]) && (
                <button
                  type="button"
                  onClick={() => setReceiptModalTx(selectedInvoice || pendingTransactions[0])}
                  className="btn-cta text-xs py-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Ya Pagué
                </button>
              )}
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-green-950/70 border border-green-600 text-xs font-bold text-green-300 inline-flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Sin Deudas Pendientes ($0.00 / Bs. 0,00)
            </span>
          )}
        </div>

        <PaymentMethodsBox
          amount={autoAmountUsd}
          concept={autoConcept}
          bcvData={bcv}
        />
      </div>

      <div className="card-fenix p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          ESTADO DE CUENTA DEL ATLETA
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-neutral-700 text-texto-secundario text-xs uppercase">
                <th className="py-3 pr-4">Concepto</th>
                <th className="py-3 pr-4">Vencimiento</th>
                <th className="py-3 pr-4">Monto ($ / Bs. BCV)</th>
                <th className="py-3 pr-4">Estado Semáforo</th>
                <th className="py-3 pr-4">Comprobante</th>
                <th className="py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-texto-secundario text-sm">
                    No existen cargos registrados para este atleta.
                  </td>
                </tr>
              ) : (
                transactions.map((pago) => {
                  const montoUsd = Number(pago.monto || 0);
                  const liveBs = tasa > 0 ? montoUsd * tasa : null;
                  const shownBs = pago.monto_bs ? Number(pago.monto_bs) : liveBs;
                  return (
                    <tr key={pago.id_transaccion} className="border-b border-neutral-800/80 hover:bg-neutral-900/40">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-white">
                          {pago.descripcion_detalle || pago.concepto}
                        </p>
                        <span className="text-[11px] text-texto-secundario">{pago.concepto}</span>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-neutral-300">
                        {new Date(pago.fecha_vencimiento).toLocaleDateString('es-VE')}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-white">${montoUsd.toFixed(2)} USD</p>
                        {shownBs !== null && (
                          <span className="text-[11px] font-semibold text-amber-300">
                            {formatBs(shownBs)}
                            {pago.tasa_bcv
                              ? ` (BCV ${formatRate(pago.tasa_bcv)})`
                              : ' (BCV hoy)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge estado={pago.estado_pago} />
                      </td>
                      <td className="py-3.5 pr-4 text-xs">
                        {pago.comprobante_url ? (
                          <div className="space-y-0.5">
                            <a
                              href={pago.comprobante_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-rojo-fuego hover:underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {pago.comprobante_estado === 'En_Revision'
                                ? 'En Revisión'
                                : pago.comprobante_estado}
                            </a>
                            {(pago.referencia_pago || pago.telefono_pago) && (
                              <p className="text-[10px] text-texto-secundario">
                                {pago.referencia_pago ? `Ref: ${pago.referencia_pago}` : ''}
                                {pago.telefono_pago ? ` • Tel: ${pago.telefono_pago}` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500">Sin adjunto</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {pago.estado_pago !== 'Pagado' ? (
                          <button
                            onClick={() => setReceiptModalTx(pago)}
                            className="btn-cta text-xs py-1.5 px-3.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {pago.comprobante_estado === 'En_Revision'
                              ? 'Reemplazar Soporte'
                              : `Ya Pagué ($${montoUsd.toFixed(2)})`}
                          </button>
                        ) : (
                          <span className="text-green-400 text-xs font-semibold">
                            ✓ Validado ({pago.metodo_pago || 'Club'})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Subir Comprobante */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-fenix max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 border-vinotinto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">PAGAR Y CARGAR COMPROBANTE</h3>
              <button onClick={() => setReceiptModalTx(null)} className="p-1 bg-neutral-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#151515] p-3 rounded-lg border border-neutral-800 text-xs flex items-center justify-between gap-2">
              <p className="text-white font-bold">{receiptModalTx.descripcion_detalle || receiptModalTx.concepto}</p>
              <div className="text-right shrink-0">
                <p className="text-rojo-fuego font-extrabold text-base">
                  ${Number(receiptModalTx.monto).toFixed(2)} USD
                </p>
                {tasa > 0 && (
                  <p className="text-[11px] font-bold text-amber-300">
                    {formatBs(Number(receiptModalTx.monto) * tasa)}
                  </p>
                )}
              </div>
            </div>

            <PaymentMethodsBox
              amount={receiptModalTx.monto}
              concept={receiptModalTx.descripcion_detalle || receiptModalTx.concepto}
              bcvData={bcv}
              compact
            />

            <form onSubmit={handleUploadReceipt} className="space-y-3 pt-2 border-t border-neutral-800">
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">Método de Pago Utilizado</label>
                <select
                  className="input-fenix"
                  value={receiptForm.metodo_pago}
                  onChange={(e) => setReceiptForm({ ...receiptForm, metodo_pago: e.target.value })}
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo Taquilla">Efectivo Taquilla</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-texto-secundario mb-1">Número de Referencia*</label>
                  <input
                    type="text"
                    className="input-fenix"
                    placeholder="Últimos 6 dígitos o código"
                    value={receiptForm.referencia_pago}
                    onChange={(e) => setReceiptForm({ ...receiptForm, referencia_pago: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-texto-secundario mb-1">Teléfono Origen del Pago*</label>
                  <input
                    type="tel"
                    className="input-fenix"
                    placeholder="04125551234"
                    value={receiptForm.telefono_pago}
                    onChange={(e) => setReceiptForm({ ...receiptForm, telefono_pago: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-texto-secundario mb-1">
                  Capture / Archivo de Comprobante (PDF, PNG o JPG)*
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="input-fenix text-xs"
                  onChange={(e) => setReceiptForm({ ...receiptForm, file: e.target.files?.[0] || null })}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalTx(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={uploadingReceipt} className="btn-cta text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingReceipt ? 'Subiendo...' : 'Enviar Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
