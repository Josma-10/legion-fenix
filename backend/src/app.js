const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const categoriasRoutes = require('./modules/categorias/categorias.routes');
const publicoRoutes = require('./modules/publico/publico.routes');
const representantesRoutes = require('./modules/representantes/representantes.routes');
const pagosRoutes = require('./modules/pagos/pagos.routes');
const entrenadoresRoutes = require('./modules/entrenadores/entrenadores.routes');
const fisioRoutes = require('./modules/fisio/fisio.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();
app.set('trust proxy', 1);

const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [];

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin:
      configuredOrigins.length > 0
        ? [...configuredOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000']
        : true,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos cargados localmente en modo desarrollo (fallback cuando no hay Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    club: 'Legión Fénix',
    modules: [
      'auth',
      'categorias',
      'publico',
      'representantes',
      'pagos',
      'entrenadores',
      'fisio',
      'admin',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Rutas por módulo independiente
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/public', publicoRoutes);
app.use('/api/players', representantesRoutes);
app.use('/api/payments', pagosRoutes);
app.use('/api/coach', entrenadoresRoutes);
app.use('/api/fisio', fisioRoutes);
app.use('/api/admin', adminRoutes);

// Manejador de errores de Multer y rutas
app.use((err, _req, res, _next) => {
  console.error('❌ Error en API:', err.message);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
  }
  return res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
