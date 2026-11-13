const pool = require('../../config/db');
const adminModel = require('./admin.model');

const getFinancialSummaryAndBreakEven = async () => {
  const [movimientos, quadrantsRaw, receivablesRes, morososRes] = await Promise.all([
    adminModel.getMovimientosContables(),
    adminModel.getQuadrantMetricsRaw(),
    pool.query(`
      SELECT
        COALESCE(SUM(monto) FILTER (WHERE estado_pago = 'Pendiente'), 0)::numeric(10,2) AS total_pendiente,
        COALESCE(SUM(monto) FILTER (WHERE estado_pago = 'Vencido'), 0)::numeric(10,2) AS total_vencido,
        COUNT(*) FILTER (WHERE comprobante_estado = 'En_Revision')::int AS comprobantes_por_validar
      FROM transacciones_jugador
    `),
    pool.query(`
      SELECT COUNT(*)::int AS atletas_morosos FROM jugadores WHERE activo = TRUE AND estado_cuenta = 'Moroso'
    `),
  ]);

  let totalIngresos = 0;
  let totalEgresos = 0;
  for (const m of movimientos) {
    const val = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') totalIngresos += val;
    else if (m.tipo === 'Egreso') totalEgresos += val;
  }

  const cuadrantesEquilibrio = quadrantsRaw.map((q) => {
    const costoFijo = Number(q.costo_fijo_mensual);
    const costoVariable = Number(q.costo_variable_atleta);
    const cuotaPromedio = Number(q.cuota_mensual_promedio);
    const capacidad = Number(q.capacidad_atletas);
    const atletasActivos = Number(q.atletas_activos);
    const ingresosReales = Number(q.ingresos_reales);
    const egresosReales = Number(q.egresos_reales);

    const margenContribucion = Math.max(cuotaPromedio - costoVariable, 0);
    const puntoEquilibrioAtletas =
      margenContribucion > 0 ? Math.ceil(costoFijo / margenContribucion) : 0;
    const puntoEquilibrioIngreso = Number((puntoEquilibrioAtletas * cuotaPromedio).toFixed(2));
    const coberturaPorcentaje =
      puntoEquilibrioAtletas > 0
        ? Math.min(Math.round((atletasActivos / puntoEquilibrioAtletas) * 100), 200)
        : 0;
    const diferenciaAtletas = atletasActivos - puntoEquilibrioAtletas;
    const ingresoProyectadoActual = Number((atletasActivos * cuotaPromedio).toFixed(2));
    const costoTotalProyectado = Number((costoFijo + atletasActivos * costoVariable).toFixed(2));

    return {
      ...q,
      costo_fijo_mensual: costoFijo,
      costo_variable_atleta: costoVariable,
      cuota_mensual_promedio: cuotaPromedio,
      capacidad_atletas: capacidad,
      atletas_activos: atletasActivos,
      ingresos_reales: ingresosReales,
      egresos_reales: egresosReales,
      margen_contribucion: Number(margenContribucion.toFixed(2)),
      punto_equilibrio_atletas: puntoEquilibrioAtletas,
      punto_equilibrio_ingreso: puntoEquilibrioIngreso,
      cobertura_porcentaje: coberturaPorcentaje,
      diferencia_atletas: diferenciaAtletas,
      ingreso_proyectado_actual: ingresoProyectadoActual,
      costo_total_proyectado: costoTotalProyectado,
      balance_real_cuadrante: Number((ingresosReales - egresosReales).toFixed(2)),
      estado_equilibrio:
        atletasActivos >= puntoEquilibrioAtletas || ingresosReales >= puntoEquilibrioIngreso
          ? 'Sobre Equilibrio'
          : 'Bajo Equilibrio',
    };
  });

  const rec = receivablesRes.rows[0];
  return {
    resumen: {
      total_ingresos: Number(totalIngresos.toFixed(2)),
      total_egresos: Number(totalEgresos.toFixed(2)),
      balance_neto: Number((totalIngresos - totalEgresos).toFixed(2)),
      por_cobrar_pendiente: Number(rec.total_pendiente),
      cartera_vencida: Number(rec.total_vencido),
      comprobantes_por_validar: rec.comprobantes_por_validar,
      atletas_morosos: morososRes.rows[0].atletas_morosos,
    },
    movimientos,
    cuadrantes: cuadrantesEquilibrio,
  };
};

module.exports = {
  getFinancialSummaryAndBreakEven,
};
