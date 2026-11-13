import React, { useState } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Upload,
  AlertCircle,
  CreditCard,
  FileText,
  ZoomIn,
} from 'lucide-react';
import PaymentMethodsBox from '../../components/PaymentMethodsBox';
import api from '../../utils/api';
import { useBcvRate, formatBs, formatRate } from '../../utils/bcv';

const STORE_FILTERS = ['Todos', 'Uniforme Local', 'Uniforme Visitante', 'Accesorios'];

export default function TiendaOficialModule({ products = [] }) {
  const { bcv } = useBcvRate();
  const tasa = Number(bcv?.tasa_bcv || 0);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [storeFilter, setStoreFilter] = useState('Todos');
  const [zoomProduct, setZoomProduct] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [checkoutForm, setCheckoutForm] = useState({
    comprador_nombre: '',
    metodo_pago: 'Pago Móvil',
    telefono_pago: '',
    referencia_bancaria: '',
    comprobante: null,
  });
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [verifiedOrder, setVerifiedOrder] = useState(null);

  const visibleProducts = products.filter((p) => {
    if (storeFilter === 'Todos') return true;
    return String(p.categoria_producto || '').toLowerCase() === storeFilter.toLowerCase();
  });

  const addToCart = (product) => {
    const defaultSize = (product.tallas_disponibles || 'M').split(',')[0].trim();
    const size = selectedSizes[product.id_producto] || defaultSize;
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.id_producto === product.id_producto && item.talla === size
      );
      if (idx >= 0) {
        return prev.map((item, i) => (i === idx ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, talla: size, qty: 1 }];
    });
    setVerifiedOrder(null);
    setCheckoutError('');
    setCartOpen(true);
  };

  const updateCartQty = (idx, delta) => {
    setCart((prev) =>
      prev
        .map((item, i) => (i === idx ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartTotal = cart.reduce((acc, item) => acc + Number(item.precio) * item.qty, 0);
  const cartTotalBs = tasa > 0 ? cartTotal * tasa : 0;
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleStoreCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutForm.comprador_nombre.trim()) {
      setCheckoutError('Ingresa tu nombre completo para registrar el pedido.');
      return;
    }
    if (!checkoutForm.telefono_pago || checkoutForm.telefono_pago.replace(/\D/g, '').length < 10) {
      setCheckoutError('Ingresa el número de teléfono válido desde donde realizaste el pago.');
      return;
    }
    if (!checkoutForm.referencia_bancaria || checkoutForm.referencia_bancaria.trim().length < 4) {
      setCheckoutError('Ingresa el número de referencia bancaria (mínimo 4 caracteres).');
      return;
    }
    if (!checkoutForm.comprobante) {
      setCheckoutError('Debes adjuntar el capture de pantalla del pago para verificar la compra.');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('comprador_nombre', checkoutForm.comprador_nombre.trim());
      formData.append('metodo_pago', checkoutForm.metodo_pago);
      formData.append('telefono_pago', checkoutForm.telefono_pago.trim());
      formData.append('referencia_bancaria', checkoutForm.referencia_bancaria.trim());
      formData.append('comprobante', checkoutForm.comprobante);
      formData.append(
        'items',
        JSON.stringify(
          cart.map((item) => ({
            id_producto: item.id_producto,
            talla: item.talla,
            qty: item.qty,
          }))
        )
      );

      const res = await api.post('/public/store-orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVerifiedOrder(res.data.pedido);
      setCart([]);
      setCheckoutForm({
        comprador_nombre: '',
        metodo_pago: 'Pago Móvil',
        telefono_pago: '',
        referencia_bancaria: '',
        comprobante: null,
      });
    } catch (err) {
      setCheckoutError(err.response?.data?.error || 'No se pudo verificar el pago del pedido.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  return (
    <section id="tienda" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/logo-legion-fenix.png"
            alt="Escudo Tienda Oficial Legión Fénix"
            className="w-12 h-12 object-contain hidden sm:block drop-shadow"
          />
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rojo-fuego flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Indumentaria Local, Visitante &amp; Accesorios
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
              TIENDA OFICIAL LEGIÓN FÉNIX FC
            </h2>
            {tasa > 0 && (
              <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                Cálculo automático a Tasa Oficial BCV hoy: 1 USD = {formatRate(tasa)} Bs.
              </p>
            )}
          </div>
        </div>

        <button onClick={() => setCartOpen(true)} className="btn-vinotinto relative">
          <ShoppingCart className="w-4 h-4" />
          Carrito ({cartCount})
          {cartCount > 0 && (
            <span className="ml-1 bg-rojo-fuego text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              ${cartTotal.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Filtros de Colección Oficial */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STORE_FILTERS.map((cat) => {
            const active = storeFilter === cat;
            const isAway = cat === 'Uniforme Visitante';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setStoreFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                  active
                    ? isAway
                      ? 'bg-[#2a2109] border-dorado-fenix text-dorado-fenix'
                      : 'bg-vinotinto border-rojo-fuego text-white'
                    : 'bg-gris-tarjeta border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {cat === 'Uniforme Local' && (
                  <img src="/assets/logo-legion-fenix.png" alt="" className="w-4 h-4 object-contain" />
                )}
                {cat === 'Uniforme Visitante' && (
                  <img src="/assets/logo-legion-fenix-visitante.png" alt="" className="w-4 h-4 object-contain" />
                )}
                {cat}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-texto-secundario">
          Haz clic en cualquier uniforme para ampliar detalles
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {visibleProducts.map((prod) => {
          const sizes = (prod.tallas_disponibles || 'M').split(',').map((s) => s.trim());
          const currentSize = selectedSizes[prod.id_producto] || sizes[0];
          const prodPrice = Number(prod.precio);
          const isVisitante = String(prod.categoria_producto || '').toLowerCase().includes('visitante');
          const isLocal = String(prod.categoria_producto || '').toLowerCase().includes('local');

          return (
            <div
              key={prod.id_producto}
              className={`card-fenix p-4 flex flex-col justify-between gap-4 transition hover:-translate-y-0.5 ${
                isVisitante
                  ? 'border-dorado-fenix/35 hover:border-dorado-fenix/70'
                  : isLocal
                  ? 'border-rojo-fuego/35 hover:border-rojo-fuego/75'
                  : 'hover:border-neutral-600'
              }`}
            >
              <div>
                <button
                  type="button"
                  onClick={() => setZoomProduct(prod)}
                  className="group relative w-full h-48 bg-gradient-to-b from-[#f3f4f6] to-[#d9dce3] rounded-xl overflow-hidden mb-3 flex items-center justify-center border border-white/10"
                  title="Ver detalles en grande"
                >
                  <img
                    src={prod.imagen_url || '/assets/uniforme-local-jugador-kit.png'}
                    alt={prod.nombre}
                    className="w-full h-full object-contain p-2 transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 opacity-85 group-hover:opacity-100">
                    <ZoomIn className="w-3 h-3" /> Zoom
                  </span>
                  {(isLocal || isVisitante) && (
                    <img
                      src={isVisitante ? '/assets/logo-legion-fenix-visitante.png' : '/assets/logo-legion-fenix.png'}
                      alt=""
                      className="absolute top-2 left-2 w-7 h-7 object-contain drop-shadow"
                    />
                  )}
                </button>
                <span
                  className={`text-[10px] uppercase font-extrabold tracking-wider ${
                    isVisitante ? 'text-dorado-fenix' : 'text-rojo-fuego'
                  }`}
                >
                  {prod.categoria_producto}
                </span>
                <h3 className="font-bold text-sm text-white mt-0.5 leading-snug">{prod.nombre}</h3>
                <p className="text-xs text-texto-secundario mt-1 line-clamp-2">{prod.descripcion}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between gap-1">
                  <div>
                    <span className="font-display text-2xl font-extrabold text-white block leading-none">
                      ${prodPrice.toFixed(2)}
                    </span>
                    {tasa > 0 && (
                      <span className="text-[10px] text-amber-300 font-semibold">
                        {formatBs(prodPrice * tasa)}
                      </span>
                    )}
                  </div>
                  <select
                    value={currentSize}
                    onChange={(e) =>
                      setSelectedSizes({ ...selectedSizes, [prod.id_producto]: e.target.value })
                    }
                    className="bg-[#121212] border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>Talla {s}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => addToCart(prod)}
                  className={`w-full text-xs py-2 rounded-lg font-bold transition inline-flex items-center justify-center gap-2 ${
                    isVisitante
                      ? 'bg-dorado-fenix hover:bg-amber-400 text-black'
                      : 'btn-cta'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar al Carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Vista Ampliada de Uniforme */}
      {zoomProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomProduct(null)}
        >
          <div
            className="bg-gris-tarjeta border border-neutral-700 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rojo-fuego">
                  {zoomProduct.categoria_producto}
                </span>
                <h3 className="font-display text-2xl font-extrabold text-white">
                  {zoomProduct.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomProduct(null)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-rojo-fuego text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gradient-to-b from-[#f3f4f6] to-[#d9dce3] rounded-xl p-4 flex items-center justify-center max-h-[65vh]">
              <img
                src={zoomProduct.imagen_url}
                alt={zoomProduct.nombre}
                className="max-h-[58vh] w-auto object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-neutral-300 max-w-lg">{zoomProduct.descripcion}</p>
              <button
                type="button"
                onClick={() => {
                  addToCart(zoomProduct);
                  setZoomProduct(null);
                }}
                className="btn-cta text-xs"
              >
                <Plus className="w-4 h-4" /> Agregar (${Number(zoomProduct.precio).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Carrito Tienda Oficial con QR, Datos Copiables y Verificación */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-gris-tarjeta border-l border-neutral-800 h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 shrink-0">
              <div>
                <h3 className="font-display text-2xl font-extrabold text-white">TU CARRITO FÉNIX</h3>
                <p className="text-[11px] text-texto-secundario">
                  Tienda Oficial Legión Fénix • Pago exacto a tasa BCV del día
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rojo-fuego transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {verifiedOrder ? (
                <div className="bg-green-950/60 border border-green-600 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-9 h-9 text-green-400 shrink-0" />
                    <div>
                      <h4 className="font-display text-xl font-extrabold text-white">
                        ¡PAGO VERIFICADO Y CONFIRMADO!
                      </h4>
                      <p className="text-xs text-green-200">
                        Pedido #{verifiedOrder.id_pedido} aprobado mediante referencia bancaria, capture de pantalla y teléfono.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#121212] border border-green-800/70 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-texto-secundario">Titular:</span>
                      <span className="font-bold text-white">{verifiedOrder.comprador_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-texto-secundario">Método:</span>
                      <span className="font-semibold text-white">{verifiedOrder.metodo_pago}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-texto-secundario">Referencia Bancaria:</span>
                      <span className="font-mono font-bold text-green-400">
                        {verifiedOrder.referencia_bancaria}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-texto-secundario">Teléfono Origen Pago:</span>
                      <span className="font-mono font-bold text-white">{verifiedOrder.telefono_pago}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-neutral-800 pt-1.5 mt-1">
                      <span className="text-texto-secundario">Total Pagado:</span>
                      <div className="text-right">
                        <span className="font-display text-lg font-extrabold text-green-400 block">
                          ${Number(verifiedOrder.monto_total).toFixed(2)} USD
                        </span>
                        {verifiedOrder.monto_bs && (
                          <span className="text-[11px] font-bold text-amber-300">
                            {formatBs(verifiedOrder.monto_bs)} (Tasa BCV {formatRate(verifiedOrder.tasa_bcv)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {verifiedOrder.comprobante_url && (
                      <a
                        href={verifiedOrder.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-rojo-fuego hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Ver Capture Adjunto
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setVerifiedOrder(null);
                        setCartOpen(false);
                      }}
                      className="btn-cta text-xs py-2 ml-auto"
                    >
                      Seguir Comprando
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <p className="text-sm text-texto-secundario py-12 text-center">
                  Aún no has agregado indumentaria oficial al carrito.
                </p>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.id_producto}-${item.talla}`}
                        className="bg-[#151515] border border-neutral-800 rounded-lg p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">{item.nombre}</p>
                          <p className="text-xs text-texto-secundario">
                            Talla {item.talla} • ${Number(item.precio).toFixed(2)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -1)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, 1)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -item.qty)}
                            className="p-1 text-rojo-fuego"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-neutral-800 pt-4 space-y-4">
                    <div className="flex items-center justify-between bg-[#151515] border border-vinotinto/60 rounded-xl px-4 py-3">
                      <div>
                        <span className="text-sm font-bold text-texto-secundario block">Total a Pagar:</span>
                        {tasa > 0 && (
                          <span className="text-[11px] text-texto-secundario">
                            Tasa BCV: {formatRate(tasa)} Bs./USD
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-display font-extrabold text-white block leading-none">
                          ${cartTotal.toFixed(2)} USD
                        </span>
                        {tasa > 0 && (
                          <span className="text-sm font-extrabold text-amber-300">
                            {formatBs(cartTotalBs)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-rojo-fuego" /> PAGAR PEDIDO CON QR O DATOS BANCARIOS
                      </h4>
                      <PaymentMethodsBox
                        amount={cartTotal}
                        concept="Tienda Oficial Legión Fénix"
                        bcvData={bcv}
                        compact
                      />
                    </div>

                    <form onSubmit={handleStoreCheckout} className="space-y-3 pt-2 border-t border-neutral-800">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        Verificación del Pago Realizado
                      </p>

                      {checkoutError && (
                        <div className="bg-rojo-fuego/15 border border-rojo-fuego text-red-200 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rojo-fuego shrink-0" />
                          <span>{checkoutError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                          Nombre y Apellido del Comprador*
                        </label>
                        <input
                          type="text"
                          className="input-fenix text-xs"
                          placeholder="Ej: María Fernanda Pérez"
                          value={checkoutForm.comprador_nombre}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, comprador_nombre: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                            Método Utilizado
                          </label>
                          <select
                            className="input-fenix text-xs"
                            value={checkoutForm.metodo_pago}
                            onChange={(e) =>
                              setCheckoutForm({ ...checkoutForm, metodo_pago: e.target.value })
                            }
                          >
                            <option value="Pago Móvil">Pago Móvil</option>
                            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                            <option value="Zelle">Zelle</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                            Teléfono Origen del Pago*
                          </label>
                          <input
                            type="tel"
                            className="input-fenix text-xs"
                            placeholder="04125551234"
                            value={checkoutForm.telefono_pago}
                            onChange={(e) =>
                              setCheckoutForm({ ...checkoutForm, telefono_pago: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                          Referencia Bancaria*
                        </label>
                        <input
                          type="text"
                          className="input-fenix text-xs"
                          placeholder="Ej: 88451209"
                          value={checkoutForm.referencia_bancaria}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, referencia_bancaria: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-texto-secundario mb-1">
                          Capture de Pantalla del Pago (PNG, JPG o PDF)*
                        </label>
                        <label className="input-fenix text-xs flex items-center justify-between cursor-pointer hover:border-rojo-fuego">
                          <span className="truncate text-neutral-300">
                            {checkoutForm.comprobante
                              ? checkoutForm.comprobante.name
                              : 'Seleccionar capture de pantalla...'}
                          </span>
                          <Upload className="w-4 h-4 text-rojo-fuego shrink-0 ml-2" />
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              setCheckoutForm({
                                ...checkoutForm,
                                comprobante: e.target.files?.[0] || null,
                              })
                            }
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={checkoutSubmitting}
                        className="btn-cta w-full text-sm py-3"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {checkoutSubmitting
                          ? 'Verificando Referencia, Teléfono y Capture...'
                          : tasa > 0
                          ? `Pagar y Verificar ($${cartTotal.toFixed(2)} / ${formatBs(cartTotalBs)})`
                          : `Pagar y Verificar Compra ($${cartTotal.toFixed(2)})`}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
