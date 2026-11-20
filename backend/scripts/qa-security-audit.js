/**
 * QA STRESS & SECURITY PENETRATION AUDIT SUITE
 * Legión Fénix FC - Suite de Auditoría de Seguridad por Niveles (0 al 4)
 * Utiliza fetch nativo de Node.js contra un servidor Express efímero.
 */

const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { JWT_SECRET } = require('../src/middlewares/auth');

async function runSecurityAudit() {
  console.log('===============================================================');
  console.log('🛡️  INICIANDO SUITE DE AUDITORÍA QA Y PRUEBAS DE SEGURIDAD');
  console.log('    LEGIÓN FÉNIX FC • PENETRATION & STRESS TEST REPORT');
  console.log('===============================================================\n');

  // Iniciar servidor en puerto libre dinámico
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passedTests = 0;
  let totalTests = 0;
  const vulnerabilities = [];

  function recordResult(level, name, success, details) {
    totalTests++;
    if (success) {
      passedTests++;
      console.log(`  ✅ [NIVEL ${level}] ${name} - BLINDADO`);
    } else {
      console.log(`  ❌ [NIVEL ${level}] ${name} - VULNERABILIDAD DETECTADA: ${details}`);
      vulnerabilities.push({ level, name, details });
    }
  }

  // Tokens de prueba para RBAC
  const adminToken = jwt.sign(
    { id: 9999, rol: 'ADMINISTRADOR', nombre: 'Super Admin', email: 'admin@legion.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const repTokenA = jwt.sign(
    { id: 8881, id_representante: 501, rol: 'REPRESENTANTE', nombre: 'Rep A', email: 'repA@legion.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const atletaToken = jwt.sign(
    { id: 7771, id_representante: 601, rol: 'ATLETA', nombre: 'Atleta Sub20', email: 'atleta@legion.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const fakeSecretToken = jwt.sign(
    { id: 6666, rol: 'ADMINISTRADOR', nombre: 'Hacker' },
    'clave_falsa_invalida_123',
    { expiresIn: '1h' }
  );

  try {
    // =========================================================================
    // NIVEL 0: VALIDACIÓN DE LÍMITES, TIPOS Y DESBORDAMIENTO (STRESS & BOUNDARY)
    // =========================================================================
    console.log('\n--- NIVEL 0: LÍMITES, TIPOS Y DESBORDAMIENTO (BOUNDARY/OVERFLOW) ---');

    // 0.1 Login con payload gigante (>50KB)
    try {
      const hugePayload = 'A'.repeat(50000);
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: hugePayload, password: 'password123' }),
      });
      const ok = res.status === 400;
      recordResult(0, 'Control de Desbordamiento de Carga (>50k chars)', ok, `Status recibido: ${res.status}`);
    } catch (err) {
      recordResult(0, 'Control de Desbordamiento de Carga', false, err.message);
    }

    // 0.2 Política de contraseña débil en registro (Semáforo Verde)
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Usuario Test',
          email: 'test_weak@legion.com',
          password: '123', // Débil, no cumple semáforo verde
          documento_identidad: 'V-12345678',
        }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.status === 400 && data.error && data.error.includes('Semáforo Verde');
      recordResult(0, 'Rechazo de Contraseña Débil (Semáforo Verde)', ok, data.error || 'Aceptó contraseña débil');
    } catch (err) {
      recordResult(0, 'Rechazo de Contraseña Débil', false, err.message);
    }

    // 0.3 Registro Atleta con edad menor de 18 años por el endpoint directo
    try {
      const res = await fetch(`${baseUrl}/api/auth/register-athlete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: 'Atleta Menor',
          dni_cedula: 'PN:1234567890',
          fecha_nacimiento: '2015-05-10', // 11 años
          genero: 'Masculino',
          estatura: 145,
          peso: 38,
          pierna_habil: 'Derecha',
          disciplina: 'Fútbol Campo',
          posicion_juego: 'Medio',
          telefono: '04141234567',
          email: 'menor@legion.com',
          password: 'Password123!',
          referencia_bancaria: '12345678',
          telefono_pago: '04141234567',
        }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.status === 400 && data.error && data.error.includes('menores de edad');
      recordResult(0, 'Bloqueo de Auto-Inscripción de Menores (<18 años)', ok, data.error || 'Permitió menor');
    } catch (err) {
      recordResult(0, 'Bloqueo de Auto-Inscripción de Menores', false, err.message);
    }

    // 0.4 Registro con fecha de nacimiento futura o corrupta
    try {
      const res = await fetch(`${baseUrl}/api/auth/register-athlete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: 'Viajero del Tiempo',
          fecha_nacimiento: '2099-12-31',
          telefono: '04141234567',
          email: 'futuro@legion.com',
          password: 'Password123!',
          referencia_bancaria: '12345678',
          telefono_pago: '04141234567',
          estatura: 175,
          peso: 70,
          pierna_habil: 'Derecha',
          disciplina: 'Campo',
          posicion_juego: 'Delantero',
        }),
      });
      const ok = res.status === 400;
      recordResult(0, 'Rechazo de Fecha de Nacimiento Futura/Inválida', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(0, 'Rechazo de Fecha de Nacimiento Futura', false, err.message);
    }

    // =========================================================================
    // NIVEL 1: INYECCIÓN SQL (SQL INJECTION ATTACKS)
    // =========================================================================
    console.log('\n--- NIVEL 1: PRUEBAS DE PENETRACIÓN POR INYECCIÓN SQL ---');

    // 1.1 SQL Injection en Login username
    try {
      const sqlPayloads = [
        "' OR '1'='1",
        "admin' --",
        "'; DROP TABLE usuarios; --",
        "' UNION SELECT 1, 'admin', 'hash', 'ADMINISTRADOR' --",
      ];

      let allBlocked = true;
      for (const payload of sqlPayloads) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: payload, password: 'password123' }),
        });
        const data = await res.json().catch(() => ({}));
        // Debe responder 400 o 401, nunca 200 ni 500 sintáctico de postgres
        if (res.status === 200 || (res.status === 500 && data.error && data.error.includes('syntax error'))) {
          allBlocked = false;
          break;
        }
      }
      recordResult(1, 'Blindaje contra Inyección SQL en Autenticación', allBlocked, 'Un payload causó fuga o error sintáctico');
    } catch (err) {
      recordResult(1, 'Blindaje SQL en Login', false, err.message);
    }

    // 1.2 SQL Injection en Parámetros de Consulta (Query Params)
    try {
      const res = await fetch(`${baseUrl}/api/admin/attendance?fecha=2026-11-20&id_categoria=1%20OR%201=1`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      // id_categoria se procesa con Number(), evitando SQLi (retorna 200 o 400, nunca 500 sintáctico)
      const ok = res.status === 200 || res.status === 400;
      recordResult(1, 'Sanitización de Inyección SQL en Query Params Numéricos', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(1, 'Sanitización de Query Params', false, err.message);
    }

    // 1.3 SQL Injection en Búsqueda Pública de Atletas
    try {
      const res = await fetch(`${baseUrl}/api/public/categories/1/roster?q=' UNION SELECT null,null,null,null,null,null--`);
      const ok = res.status === 200 || res.status === 404;
      recordResult(1, 'Inyección SQL en Filtros Públicos / Roster', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(1, 'Filtros Públicos Roster SQLi', false, err.message);
    }

    // =========================================================================
    // NIVEL 2: CROSS-SITE SCRIPTING (XSS) & INYECCIÓN DE SCRIPTS
    // =========================================================================
    console.log('\n--- NIVEL 2: PROTECCIÓN CONTRA XSS E INYECCIÓN DE SCRIPTS ---');

    // 2.1 Verificación de cabeceras de seguridad HTTP Helmet
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      const hasXContentType = res.headers.get('x-content-type-options') === 'nosniff';
      const ok = hasXContentType;
      recordResult(2, 'Cabeceras de Protección HTTP (Helmet nosniff / XSS Protection)', ok, 'Cabeceras ausentes');
    } catch (err) {
      recordResult(2, 'Cabeceras Helmet', false, err.message);
    }

    // 2.2 Inserción de payload XSS en observaciones de asistencia y campos de entrada
    try {
      const xssPayload = '<script>alert("Hacked")</script><img src=x onerror=alert(1)>';
      const res = await fetch(`${baseUrl}/api/admin/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          id_jugador: 'xss<script>test',
          action: 'checkin',
          observaciones: xssPayload,
        }),
      });
      // El backend debe rechazar datos no numéricos con 400 Bad Request
      const ok = res.status === 400;
      recordResult(2, 'Resistencia y Rechazo a Inyección XSS en Parámetros de Entrada', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(2, 'Resistencia a XSS', false, err.message);
    }

    // =========================================================================
    // NIVEL 3: VALIDACIÓN DE ARCHIVOS Y PATH TRAVERSAL
    // =========================================================================
    console.log('\n--- NIVEL 3: CARGA DE ARCHIVOS Y PROTECCIÓN PATH TRAVERSAL ---');

    // 3.1 Intento de Directory Traversal en endpoint de estáticos /uploads
    try {
      const res = await fetch(`${baseUrl}/uploads/../../../../etc/passwd`);
      const ok = res.status === 404 || res.status === 400 || res.status === 403;
      recordResult(3, 'Protección contra Path Traversal en Rutas de Archivos', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(3, 'Protección Path Traversal', false, err.message);
    }

    // =========================================================================
    // NIVEL 4: AUTENTICACIÓN JWT, FALSIFICACIÓN Y ESCALADA DE PRIVILEGIOS (RBAC)
    // =========================================================================
    console.log('\n--- NIVEL 4: INTEGRIDAD JWT Y CONTROL DE ACCESO BASADO EN ROLES (RBAC) ---');

    // 4.1 Acceso a endpoint administrativo sin Token
    try {
      const res = await fetch(`${baseUrl}/api/admin/attendance`);
      const ok = res.status === 401 || res.status === 403;
      recordResult(4, 'Denegación de Acceso a Rutas Administrativas Sin Token', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(4, 'Sin Token', false, err.message);
    }

    // 4.2 Acceso con Token firmado con clave secreta forjada (Tampered JWT)
    try {
      const res = await fetch(`${baseUrl}/api/admin/attendance`, {
        headers: { Authorization: `Bearer ${fakeSecretToken}` },
      });
      const ok = res.status === 401;
      recordResult(4, 'Rechazo Inmediato de Token JWT Falsificado/Manipulado', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(4, 'Token Falsificado', false, err.message);
    }

    // 4.3 Escalada de Privilegios: Representante intentando acceder a ruta de Administrador
    try {
      const res = await fetch(`${baseUrl}/api/admin/attendance`, {
        headers: { Authorization: `Bearer ${repTokenA}` },
      });
      const ok = res.status === 403;
      recordResult(4, 'Impedir Escalada de Privilegios (Rol REPRESENTANTE -> ADMIN)', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(4, 'Escalada Representante -> Admin', false, err.message);
    }

    // 4.4 Escalada de Privilegios: Atleta intentando acceder a configuración de Entrenadores
    try {
      const res = await fetch(`${baseUrl}/api/coach/trabajos`, {
        headers: { Authorization: `Bearer ${atletaToken}` },
      });
      const ok = res.status === 403 || res.status === 401;
      recordResult(4, 'Impedir Escalada de Privilegios (Rol ATLETA -> ENTRENADOR)', ok, `Status: ${res.status}`);
    } catch (err) {
      recordResult(4, 'Escalada Atleta -> Coach', false, err.message);
    }
  } finally {
    server.close();
  }

  console.log('\n===============================================================');
  console.log(`📊 RESULTADO FINAL AUDITORÍA DE SEGURIDAD: ${passedTests}/${totalTests} PRUEBAS EXITOSAS`);
  if (vulnerabilities.length === 0) {
    console.log('🎉 EL SISTEMA ESTÁ 100% BLINDADO EN TODOS LOS NIVELES AUDITADOS.');
  } else {
    console.log(`⚠️ SE DETECTARON ${vulnerabilities.length} ASPECTOS A REFORZAR.`);
  }
  console.log('===============================================================\n');

  process.exit(vulnerabilities.length === 0 ? 0 : 1);
}

runSecurityAudit().catch((err) => {
  console.error('Error fatal ejecutando auditoría:', err);
  process.exit(1);
});
