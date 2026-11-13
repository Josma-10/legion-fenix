const pool = require('../config/db');

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const DEFAULT_FALLBACK_RATE = 901.6175;

let memoryCache = null;

function toDateStr(dateInput) {
  if (!dateInput) return new Date().toISOString().slice(0, 10);
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

async function fetchExternalOfficialBcv() {
  // 1. Fuente principal oficial Venezuela (DolarApi BCV oficial)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: AbortSignal.timeout(3500),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const rate = Number(json?.promedio);
      if (Number.isFinite(rate) && rate > 1) {
        return {
          moneda: 'USD',
          tasa_bcv: Number(rate.toFixed(4)),
          fuente: 'Banco Central de Venezuela (DolarApi Oficial)',
          fecha_tasa: toDateStr(json.fechaActualizacion),
          is_live: true,
        };
      }
    }
  } catch {
    // Continuar con respaldo oficial
  }

  // 2. Fuente respaldo internacional (ExchangeRate API VES)
  try {
    const res2 = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(3500),
      headers: { Accept: 'application/json' },
    });
    if (res2.ok) {
      const json2 = await res2.json();
      const rate2 = Number(json2?.rates?.VES);
      if (Number.isFinite(rate2) && rate2 > 1) {
        return {
          moneda: 'USD',
          tasa_bcv: Number(rate2.toFixed(4)),
          fuente: 'BCV Referencial (ExchangeRate API)',
          fecha_tasa: new Date().toISOString().slice(0, 10),
          is_live: true,
        };
      }
    }
  } catch {
    // Usar último valor en base de datos
  }

  return null;
}

async function persistRateToDb(rateInfo) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO configuracion_tasas (moneda, tasa_bcv, fuente, fecha_tasa, actualizado_en)
       VALUES ($1, $2, $3, $4::date, CURRENT_TIMESTAMP)
       ON CONFLICT (moneda) DO UPDATE
       SET tasa_bcv = EXCLUDED.tasa_bcv,
           fuente = EXCLUDED.fuente,
           fecha_tasa = EXCLUDED.fecha_tasa,
           actualizado_en = CURRENT_TIMESTAMP
       RETURNING moneda, tasa_bcv::float8 AS tasa_bcv, fuente, fecha_tasa, actualizado_en`,
      [rateInfo.moneda || 'USD', rateInfo.tasa_bcv, rateInfo.fuente, rateInfo.fecha_tasa]
    );
    return rows[0] || rateInfo;
  } catch {
    return rateInfo;
  }
}

async function readRateFromDb() {
  try {
    const { rows } = await pool.query(
      `SELECT moneda, tasa_bcv::float8 AS tasa_bcv, fuente, fecha_tasa, actualizado_en
       FROM configuracion_tasas
       WHERE moneda = 'USD'
       LIMIT 1`
    );
    if (rows[0] && Number(rows[0].tasa_bcv) > 1) {
      return {
        ...rows[0],
        fecha_tasa: toDateStr(rows[0].fecha_tasa),
        is_live: false,
      };
    }
  } catch {
    // Fallback por defecto si aún no existe tabla
  }
  return {
    moneda: 'USD',
    tasa_bcv: DEFAULT_FALLBACK_RATE,
    fuente: 'BCV Referencia Guardada',
    fecha_tasa: new Date().toISOString().slice(0, 10),
    actualizado_en: new Date().toISOString(),
    is_live: false,
  };
}

/**
 * Obtiene la tasa BCV oficial del día.
 * Usa caché de 15 min y respalda automáticamente en PostgreSQL (configuracion_tasas).
 */
async function getBcvRate({ forceRefresh = false } = {}) {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);

  if (
    !forceRefresh &&
    memoryCache &&
    now - memoryCache.cachedAt < CACHE_TTL_MS &&
    memoryCache.serverDate === todayStr
  ) {
    return {
      ...memoryCache.data,
      cached: true,
    };
  }

  const live = await fetchExternalOfficialBcv();
  if (live) {
    const saved = await persistRateToDb(live);
    const result = {
      moneda: 'USD',
      tasa_bcv: Number(saved.tasa_bcv || live.tasa_bcv),
      fuente: saved.fuente || live.fuente,
      fecha_tasa: toDateStr(saved.fecha_tasa || live.fecha_tasa),
      actualizado_en: saved.actualizado_en || new Date().toISOString(),
      is_live: true,
      cached: false,
    };
    memoryCache = { data: result, cachedAt: now, serverDate: todayStr };
    return result;
  }

  const dbFallback = await readRateFromDb();
  memoryCache = { data: dbFallback, cachedAt: now - CACHE_TTL_MS + 60000, serverDate: todayStr };
  return {
    ...dbFallback,
    cached: false,
  };
}

function convertUsdToBs(montoUsd, bcvData) {
  const usd = Number(montoUsd || 0);
  const tasa = Number(bcvData?.tasa_bcv || DEFAULT_FALLBACK_RATE);
  return {
    monto_usd: Number(usd.toFixed(2)),
    tasa_bcv: Number(tasa.toFixed(4)),
    monto_bs: Number((usd * tasa).toFixed(2)),
  };
}

module.exports = {
  getBcvRate,
  convertUsdToBs,
};
