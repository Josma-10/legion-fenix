const express = require('express');
const router = express.Router();
const fisioController = require('./fisio.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.use(verifyToken);

// Entrenadores y Fisio pueden consultar bajas clínicas y reportar lesiones de juego/entrenamiento
router.get('/dashboard', checkRole(['FISIO', 'ENTRENADOR']), fisioController.getDashboard);
router.post('/injuries', checkRole(['FISIO', 'ENTRENADOR']), fisioController.createInjury);
router.post('/report-injury', checkRole(['FISIO', 'ENTRENADOR']), fisioController.createInjury);

// Diagnóstico evolutivo, Alta Médica y edición de ficha médica/podología son exclusivos del Fisioterapeuta
router.patch('/injuries/:id', checkRole(['FISIO']), fisioController.updateInjury);
router.patch('/medical-records/:idJugador', checkRole(['FISIO']), fisioController.updateMedicalRecord);

module.exports = router;
