const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fenix_secret_key';

/**
 * Middleware de validación de token JWT en cabecera Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Acceso no autorizado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

const optionalVerifyToken = (req, _res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  return next();
};

/**
 * Middleware RBAC: Verifica que el rol autenticado esté autorizado.
 * El rol ADMINISTRADOR posee acceso total a todos los endpoints protegidos.
 */
const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    if (req.user.rol === 'ADMINISTRADOR' || allowedRoles.includes(req.user.rol)) {
      return next();
    }

    return res.status(403).json({ error: 'Permisos insuficientes para esta operación.' });
  };
};

module.exports = { verifyToken, optionalVerifyToken, checkRole, JWT_SECRET };
