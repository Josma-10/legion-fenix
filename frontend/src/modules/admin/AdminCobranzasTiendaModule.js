import React, { useEffect, useState } from 'react';
import { Plus, FileText, ShoppingBag, Landmark } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import api from '../../utils/api';
import { formatBs, formatRate, formatBcvDate } from '../../utils/bcv';

export default function AdminCobranzasTiendaModule({
  financeData = {},
  players = [],
  onReloadFinance,
  onReloadAll,
  onFeedback,
}) {
  const [chargeForm, setChargeForm] = useState({
    id_jugador: players[0] ? String(players[0].id_jugador) : '',
    concepto: 'Mensualidad',
    descripcion_detalle: '',
    monto: '45.00',
    fecha_vencimiento: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    estado_pago: 'Pendiente',
  });

  useEffect(() => {
    if (players.length > 0 && !chargeForm.id_jugador) {
      setChargeForm((prev) => ({
        ...prev,
        id_jugador: String(players[0].id_jugador),
      }));
    }
  }, [players, chargeForm.id_jugador]);

  const handleCreateCharge = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', chargeForm);
      setChargeForm((prev) => ({ ...prev, descripcion_detalle: '' }));
      if (onFeedback) onFeedback('Nuevo cargo emitido correctamente.');
      if (onReloadFinance) await onReloadFinance();
    } catch (err) {
      alert(err.response?.data?.error || 'Error emitiendo cargo.');
    }
  };

  const handleApproveTx = async (idTransaccion) => {
    await api.patch(`/payments/${idTransaccion}/approve`);
    if (onFeedback) {
      onFeedback('Pago aprobado. Se registró el ingreso contable y se actualizó el semáforo del atleta.');
    }
    if (onReloadAll) await onReloadAll();
  };

  const handleRejectTx = async (idTransaccion) => {
    await api.patch(`/payments/${idTransaccion}/reject`);
    if (onFeedback) {
      onFeedback('Comprobante rechazado. El atleta permanece pendiente de regularización.');
    }
    if (onReloadFinance) await onReloadFinance();
  };

  const handleStoreOrderStatus = async (idPedido, estado_pago) => {
    await api.patch(`/admin/store-orders/${idPedido}`, { estado_pago });
    if (onFeedback) onFeedback(`Estado del pedido #${idPedido} actualizado a ${estado_pago}.`);
    if (onReloadFinance) await onReloadFinance();
  };

  const transactions = financeData.transactions || [];
  const storeOrders = financeData.storeOrders || [];
  const bcv = financeData.bcv || null;
  const tasa = Number(bcv?.tasa_bcv || 0);

  return (
    <section className="space-y-6">
      {bcv && (
        <div className="card-fenix p-4 border-l-4 border-l-amber-400 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <Landmark className="w-4 h-4 text-amber-300" />
            Tasa Oficial BCV del Día: <span className="text-amber-300">1 USD = {formatRate(bcv.tasa_bcv)} Bs.</span>
          </div>
          <span className="text-texto-secundario">
            Fecha BCV: <strong className="text-white">{formatBcvDate(bcv.fecha_tasa)}</strong> • {bcv.fuente}
          </span>
        </div>
      )}

      <form onSubmit={handleCreateCharge} className="card-fenix p-5 space-y-3">
        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-rojo-fuego" /> EMITIR NUEVO CARGO / MENSUALIDAD / MULTA
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            className="input-fenix lg:col-span-2"
            value={chargeForm.id_jugador}
            onChange={(e) => setChargeForm({ ...chargeForm, id_jugador: e.target.value })}
          >
            {players.map((p) => (
              <option key={p.id_jugador} value={p.id_jugador}>
                {p.nombre} {p.apellido} ({p.categoria_nombre})
              </option>
            ))}
          </select>
          <select
            className="input-fenix"
            value={chargeForm.concepto}
            onChange={(e) => setChargeForm({ ...chargeForm, concepto: e.target.value })}
          >
            <option value="Mensualidad">Mensualidad</option>
            <option value="Inscripcion">Inscripción</option>
            <option value="Arbitraje">Arbitraje</option>
            <option value="Torneo">Torneo</option>
            <option value="Multa_Amarilla">Multa Amarilla</option>
            <option value="Multa_Roja">Multa Roja</option>
          </select>
          <input
            type="text"
            className="input-fenix"
            placeholder="Descripción (ej: Dic 2026)"
            value={chargeForm.descripcion_detalle}
            onChange={(e) => setChargeForm({ ...chargeForm, descripcion_detalle: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            className="input-fenix"
            placeholder="Monto $"
            value={chargeForm.monto}
            onChange={(e) => setChargeForm({ ...chargeForm, monto: e.target.value })}
          />
          <select
            className="input-fenix"
            value={chargeForm.estado_pago}
            onChange={(e) => setChargeForm({ ...chargeForm, estado_pago: e.target.value })}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Vencido">Vencido (Moroso)</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-cta text-xs">Emitir Cargo al Atleta</button>
        </div>
      </form>

      <div className="card-fenix p-5">
        <h3 className="font-display text-2xl font-bold text-white mb-4">
          CONTROL DE COBRANZAS Y VALIDACIÓN DE COMPROBANTES
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-neutral-700 text-texto-secundario uppercase text-xs">
                <th className="py-2.5">Atleta</th>
                <th className="py-2.5">Concepto</th>
                <th className="py-2.5">Monto ($ / Bs.)</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5">Soporte / Ref.</th>
                <th className="py-2.5 text-right">Validación</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const shownBs = tx.monto_bs ? Number(tx.monto_bs) : tasa > 0 ? Number(tx.monto) * tasa : null;
                return (
                <tr key={tx.id_transaccion} className="border-b border-neutral-800">
                  <td className="py-3">
                    <p className="font-bold text-white">
                      {tx.jugador_nombre} {tx.jugador_apellido}
                    </p>
                    <span className="text-[11px] text-texto-secundario">{tx.representante_nombre}</span>
                  </td>
                  <td className="py-3">
                    <p className="text-neutral-200 font-semibold">
                      {tx.descripcion_detalle || tx.concepto}
                    </p>
                    <span className="text-[11px] text-texto-secundario">
                      Vence: {new Date(tx.fecha_vencimiento).toLocaleDateString('es-VE')}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="font-bold text-white">${Number(tx.monto).toFixed(2)}</p>
                    {shownBs !== null && (
                      <span className="text-[11px] text-amber-300 font-semibold">
                        {formatBs(shownBs)}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <StatusBadge estado={tx.estado_pago} />
                  </td>
                  <td className="py-3 text-xs">
                    {tx.comprobante_url ? (
                      <div className="space-y-0.5">
                        <a
                          href={tx.comprobante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-rojo-fuego hover:underline font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver Comprobante
                        </a>
                        <p className="text-[10px] text-texto-secundario">
                          {tx.metodo_pago} • Ref: {tx.referencia_pago || 'N/A'}
                          {tx.telefono_pago ? ` • Tel: ${tx.telefono_pago}` : ''} ({tx.comprobante_estado})
                        </p>
                      </div>
                    ) : (
                      <span className="text-neutral-500">Sin adjunto</span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {tx.estado_pago !== 'Pagado' ? (
                      <>
                        <button
                          onClick={() => handleApproveTx(tx.id_transaccion)}
                          className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-bold"
                        >
                          Aprobar
                        </button>
                        {tx.comprobante_estado === 'En_Revision' && (
                          <button
                            onClick={() => handleRejectTx(tx.id_transaccion)}
                            className="px-3 py-1 rounded bg-neutral-800 hover:bg-rojo-fuego text-white text-xs font-bold"
                          >
                            Rechazar
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-green-400 text-xs font-semibold">✓ Conciliado</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedidos Verificados de Tienda Oficial */}
      <div className="card-fenix p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rojo-fuego" />
            PEDIDOS TIENDA OFICIAL (PAGOS VERIFICADOS)
          </h3>
          <span className="text-xs text-texto-secundario">
            {storeOrders.length} Pedido(s) registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-neutral-700 text-texto-secundario uppercase text-xs">
                <th className="py-2.5">Pedido / Comprador</th>
                <th className="py-2.5">Productos</th>
                <th className="py-2.5">Total ($ / Bs.)</th>
                <th className="py-2.5">Verificación Bancaria / Capture</th>
                <th className="py-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {storeOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-texto-secundario text-xs">
                    Aún no hay pedidos pagados desde la Tienda Oficial.
                  </td>
                </tr>
              ) : (
                storeOrders.map((order) => {
                  const shownOrderBs = order.monto_bs
                    ? Number(order.monto_bs)
                    : tasa > 0
                    ? Number(order.monto_total) * tasa
                    : null;
                  return (
                  <tr key={order.id_pedido} className="border-b border-neutral-800">
                    <td className="py-3">
                      <p className="font-bold text-white">
                        #{order.id_pedido} • {order.comprador_nombre}
                      </p>
                      <span className="text-[11px] text-texto-secundario">
                        {new Date(order.creado_en).toLocaleString('es-VE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-neutral-300 space-y-0.5">
                      {(Array.isArray(order.items_json) ? order.items_json : []).map((it, idx) => (
                        <div key={idx}>
                          {it.qty}x {it.nombre} (Talla {it.talla})
                        </div>
                      ))}
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-green-400">
                        ${Number(order.monto_total).toFixed(2)}
                      </p>
                      {shownOrderBs !== null && (
                        <span className="text-[11px] text-amber-300 font-semibold">
                          {formatBs(shownOrderBs)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-xs space-y-0.5">
                      {order.comprobante_url && (
                        <a
                          href={order.comprobante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-rojo-fuego hover:underline font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver Capture
                        </a>
                      )}
                      <p className="text-[11px] text-texto-secundario">
                        {order.metodo_pago} • Ref: <strong className="text-white">{order.referencia_bancaria}</strong> • Tel:{' '}
                        <strong className="text-white">{order.telefono_pago}</strong>
                      </p>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={order.estado_pago}
                        onChange={(e) => handleStoreOrderStatus(order.id_pedido, e.target.value)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                          order.estado_pago === 'Verificado'
                            ? 'bg-green-950 border-green-700 text-green-300'
                            : order.estado_pago === 'En_Revision'
                            ? 'bg-yellow-950 border-yellow-700 text-yellow-300'
                            : 'bg-red-950 border-rojo-fuego text-red-200'
                        }`}
                      >
                        <option value="Verificado">Verificado</option>
                        <option value="En_Revision">En Revisión</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
