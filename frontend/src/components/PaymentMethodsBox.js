import React, { useState } from 'react';
import { QrCode, Copy, Check, Building2, Smartphone, User, RefreshCw, Landmark } from 'lucide-react';
import {
  useBcvRate,
  formatBs,
  formatRate,
  formatPlainDecimal,
  formatBcvDate,
} from '../utils/bcv';

export const CLUB_BANK_DETAILS = {
  bancoCodigo: '0102',
  bancoNombre: 'Banco de Venezuela',
  documento: '22762593',
  documentoDisplay: 'V-22762593',
  telefonoPagoMovil: '04129688713',
  tipoCuenta: 'Persona',
};

function CopyButton({ value, label = 'Copiar', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement('textarea');
        area.value = value;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 transition shrink-0 ${
        copied
          ? 'bg-green-700 text-white'
          : 'bg-neutral-800 hover:bg-vinotinto text-neutral-200 hover:text-white'
      } ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

export default function PaymentMethodsBox({
  amount = 0,
  concept = 'Legión Fénix',
  compact = false,
  bcvData = null,
}) {
  const [tab, setTab] = useState('qr'); // 'qr' | 'datos'
  const { bcv: hookBcv, loading: bcvLoading, refreshing, refreshRate } = useBcvRate(bcvData);

  const activeBcv = bcvData || hookBcv;
  const tasa = Number(activeBcv?.tasa_bcv || 0);
  const usdAmount = Math.max(0, Number(amount || 0));
  const formattedUsd = usdAmount.toFixed(2);
  const amountBs = tasa > 0 ? Number((usdAmount * tasa).toFixed(2)) : 0;
  const formattedBs = formatBs(amountBs);
  const plainBs = formatPlainDecimal(amountBs);

  const allPagoMovilText = [
    `Pago Móvil Legión Fénix`,
    `Banco: ${CLUB_BANK_DETAILS.bancoNombre} (${CLUB_BANK_DETAILS.bancoCodigo})`,
    `Documento (${CLUB_BANK_DETAILS.tipoCuenta}): ${CLUB_BANK_DETAILS.documento}`,
    `Teléfono: ${CLUB_BANK_DETAILS.telefonoPagoMovil}`,
    `Monto USD: $${formattedUsd} USD`,
    ...(tasa > 0
      ? [
          `Monto Exacto Bs. (BCV): ${formattedBs} (${plainBs})`,
          `Tasa BCV (${formatBcvDate(activeBcv?.fecha_tasa)}): ${formatRate(tasa)} Bs./USD`,
        ]
      : []),
    `Concepto: ${concept}`,
  ].join('\n');

  const bcvAmountBanner = (
    <div className="bg-gradient-to-r from-[#1a0a10] via-[#171216] to-[#12161f] border border-vinotinto/80 rounded-xl p-3.5 sm:p-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-rojo-fuego" />
          Monto Exacto Calculado Hoy (Tasa Oficial BCV)
        </span>
        <button
          type="button"
          onClick={refreshRate}
          disabled={refreshing}
          className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 inline-flex items-center gap-1"
          title="Actualizar tasa BCV del día"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar Tasa BCV'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-texto-secundario">Total a Pagar ({concept})</p>
          <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              ${formattedUsd} <span className="text-xs font-sans text-texto-secundario">USD</span>
            </span>
            <span className="text-neutral-500 font-bold">=</span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300">
              {bcvLoading && !tasa ? 'Calculando Bs...' : formattedBs}
            </span>
          </div>
        </div>

        {tasa > 0 && usdAmount > 0 && (
          <CopyButton
            value={plainBs}
            label={`Copiar ${plainBs} Bs.`}
            className="bg-vinotinto/80 hover:bg-rojo-fuego border border-rojo-fuego/60 text-white py-1.5 px-3"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/90 text-[11px] text-texto-secundario">
        <span>
          Tasa BCV:{' '}
          <strong className="text-white">
            {tasa > 0 ? `1 USD = ${formatRate(tasa)} Bs.` : 'Consultando...'}
          </strong>
        </span>
        <span>
          Fecha BCV:{' '}
          <strong className="text-white">
            {activeBcv?.fecha_tasa ? formatBcvDate(activeBcv.fecha_tasa) : 'Hoy'}
          </strong>
          {activeBcv?.is_live ? ' • En vivo BCV' : ''}
        </span>
      </div>
    </div>
  );

  const qrBlock = (
    <div className="bg-[#151515] border border-neutral-800 rounded-xl p-4 flex flex-col items-center text-center gap-3">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rojo-fuego">
        <QrCode className="w-4 h-4" /> Escanea QR Pago Móvil Oficial
      </div>
      <div className="bg-white p-2.5 rounded-xl shadow-md">
        <img
          src="/assets/qr-pago-movil.png"
          alt="Código QR Pago Móvil Banco de Venezuela 04129688713"
          className={compact ? 'w-36 h-auto object-contain rounded-lg' : 'w-44 h-auto object-contain rounded-lg'}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-white">
          {CLUB_BANK_DETAILS.bancoNombre} ({CLUB_BANK_DETAILS.bancoCodigo}) • {CLUB_BANK_DETAILS.tipoCuenta}
        </p>
        <p className="text-[11px] text-texto-secundario">
          Doc. <strong className="text-white">{CLUB_BANK_DETAILS.documento}</strong> • Tel.{' '}
          <strong className="text-white">{CLUB_BANK_DETAILS.telefonoPagoMovil}</strong>
        </p>
        <p className="text-xs text-amber-300 font-extrabold">
          ${formattedUsd} USD {tasa > 0 ? `• ${formattedBs}` : ''}
        </p>
      </div>
      <CopyButton value={allPagoMovilText} label="Copiar Datos Pago Móvil" />
    </div>
  );

  const bankDataBlock = (
    <div className="bg-[#151515] border border-neutral-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-rojo-fuego flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Datos Pago Móvil ({CLUB_BANK_DETAILS.tipoCuenta})
        </span>
        <CopyButton value={allPagoMovilText} label="Copiar Todo" />
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 bg-[#101010] border border-neutral-800/80 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] text-texto-secundario uppercase">Banco</p>
            <p className="font-bold text-white">
              {CLUB_BANK_DETAILS.bancoNombre} ({CLUB_BANK_DETAILS.bancoCodigo})
            </p>
          </div>
          <CopyButton value={CLUB_BANK_DETAILS.bancoCodigo} label="Copiar 0102" />
        </div>

        <div className="flex items-center justify-between gap-2 bg-[#101010] border border-neutral-800/80 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] text-texto-secundario uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-rojo-fuego" /> Documento / Cédula ({CLUB_BANK_DETAILS.tipoCuenta})
            </p>
            <p className="font-bold text-white font-mono">{CLUB_BANK_DETAILS.documento}</p>
          </div>
          <CopyButton value={CLUB_BANK_DETAILS.documento} label="Copiar" />
        </div>

        <div className="flex items-center justify-between gap-2 bg-[#101010] border border-neutral-800/80 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] text-texto-secundario uppercase flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-rojo-fuego" /> Teléfono Pago Móvil
            </p>
            <p className="font-bold text-white font-mono">{CLUB_BANK_DETAILS.telefonoPagoMovil}</p>
          </div>
          <CopyButton value={CLUB_BANK_DETAILS.telefonoPagoMovil} label="Copiar" />
        </div>

        <div className="flex items-center justify-between gap-2 bg-[#101010] border border-amber-500/40 rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] text-amber-300 uppercase font-bold">
              Monto Exacto en Bolívares (BCV)
            </p>
            <p className="font-extrabold text-amber-300 font-mono">
              {tasa > 0 ? formattedBs : 'Calculando...'} (${formattedUsd})
            </p>
          </div>
          {tasa > 0 && <CopyButton value={plainBs} label="Copiar Monto" />}
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-3">
        {bcvAmountBanner}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#111111] rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={`py-1.5 rounded-md text-xs font-bold inline-flex items-center justify-center gap-1.5 transition ${
              tab === 'qr' ? 'bg-vinotinto text-white' : 'text-texto-secundario hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Código QR
          </button>
          <button
            type="button"
            onClick={() => setTab('datos')}
            className={`py-1.5 rounded-md text-xs font-bold inline-flex items-center justify-center gap-1.5 transition ${
              tab === 'datos' ? 'bg-vinotinto text-white' : 'text-texto-secundario hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Datos Banco
          </button>
        </div>
        {tab === 'qr' ? qrBlock : bankDataBlock}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bcvAmountBanner}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5">{qrBlock}</div>
        <div className="lg:col-span-7">{bankDataBlock}</div>
      </div>
    </div>
  );
}
