const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const homeEnvPath = path.join(os.homedir(), '.env');
if (fs.existsSync(homeEnvPath)) {
  dotenv.config({ path: homeEnvPath, override: false });
}

const app = require('./src/app');
const pool = require('./src/config/db');
const { hasCloudinaryCredentials } = require('./src/config/cloudinary');
const notificationService = require('./src/services/notificationService');
const whatsappQrService = require('./src/services/whatsappQrService');

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL verificada.');
    whatsappQrService
      .autoResumeIfSessionExists()
      .then((resumed) => {
        if (resumed) console.log('📱 Sesión previa de WhatsApp QR reanudada.');
      })
      .catch((err) => console.warn('⚠️ WhatsApp QR auto-resume:', err.message));
    notificationService
      .syncAndDispatchUpcomingPaymentReminders()
      .then((res) => {
        if (res.createdCount > 0) {
          console.log(`🔔 Recordatorios automáticos procesados (5 días antes): ${res.createdCount}`);
        }
      })
      .catch((err) => console.warn('⚠️ Sync inicial de recordatorios:', err.message));
  } catch (err) {
    console.warn('⚠️ No se pudo conectar a PostgreSQL al iniciar:', err.message);
    console.warn('   Asegúrate de configurar .env y ejecutar "npm run db:init" en backend/.');
  }

  const reminderTimer = setInterval(() => {
    notificationService.syncAndDispatchUpcomingPaymentReminders().catch(() => {});
  }, 60 * 60 * 1000);
  if (typeof reminderTimer.unref === 'function') reminderTimer.unref();

  app.listen(PORT, () => {
    console.log(`🔥 Servidor Legión Fénix activo en http://localhost:${PORT}`);
    console.log(
      `☁️  Almacenamiento multimedia: ${
        hasCloudinaryCredentials ? 'Cloudinary Cloud' : 'Disco local (/uploads)'
      }`
    );
  });
}

startServer();
