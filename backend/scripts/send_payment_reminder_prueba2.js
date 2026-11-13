const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const homeEnvPath = path.join(os.homedir(), '.env');
if (fs.existsSync(homeEnvPath)) {
  dotenv.config({ path: homeEnvPath, override: false });
}

const pool = require('../src/config/db');
const { JWT_SECRET } = require('../src/middlewares/auth');
const notificationService = require('../src/services/notificationService');

async function dispatchViaRunningServer() {
  const port = Number(process.env.PORT) || 4000;
  const token = jwt.sign(
    { id: 1, rol: 'ADMINISTRADOR', nombre: 'admin', email: 'admin@legionfenix.com' },
    JWT_SECRET,
    { expiresIn: '60s' }
  );
  const resp = await fetch(`http://127.0.0.1:${port}/api/admin/notifications/dispatch-prueba2`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status} desde servidor local: ${errText}`);
  }
  return await resp.json();
}

async function main() {
  try {
    let result;
    let viaServer = false;

    try {
      result = await dispatchViaRunningServer();
      viaServer = true;
    } catch {
      result = await notificationService.dispatchPrueba2Reminder();
    }

    console.log('=== SCRIPT DE RECORDATORIO PRUEBA2 ===');
    console.log('Modo de ejecución:', viaServer ? 'Servidor Backend Activo (sesión WhatsApp QR compartida)' : 'Directo DB/SMTP');
    console.log('Destinatario:', result.destinatario);
    console.log('Correo:', result.email);
    console.log('Teléfono WhatsApp:', result.telefono);
    console.log('Mensaje:', result.mensaje);
    console.log('SMTP configurado:', notificationService.isEmailConfigured());
    console.log('Resultado Email:', JSON.stringify(result.emailResult, null, 2));
    console.log('Resultado WhatsApp:', JSON.stringify(result.waResult, null, 2));
  } catch (err) {
    console.error('❌ Error ejecutando recordatorio prueba2:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
