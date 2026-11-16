const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth');
const { uploadCloud } = require('../../config/cloudinary');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post(
  '/register-athlete',
  uploadCloud.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'comprobante_pago', maxCount: 1 },
  ]),
  authController.registerAthlete
);
router.post(
  '/register-minor',
  uploadCloud.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'comprobante_pago', maxCount: 1 },
  ]),
  authController.registerMinorAthlete
);
router.get('/me', verifyToken, authController.me);

module.exports = router;
