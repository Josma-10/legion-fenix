const express = require('express');
const router = express.Router();
const entrenadoresController = require('./entrenadores.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');
const { uploadCloud } = require('../../config/cloudinary');

router.use(verifyToken);

// Dashboard e instructivos exclusivos de Entrenadores y Admin
router.get('/dashboard', checkRole(['ENTRENADOR']), entrenadoresController.getCoachDashboard);
router.post('/microciclos', checkRole(['ENTRENADOR']), entrenadoresController.createMicrociclo);
router.patch('/microciclos/:id/estado', checkRole(['ENTRENADOR']), entrenadoresController.updateMicrocicloEstado);
router.delete('/microciclos/:id', checkRole(['ENTRENADOR']), entrenadoresController.deleteMicrociclo);

router.post('/videos', checkRole(['ENTRENADOR']), uploadCloud.single('video_file'), entrenadoresController.addVideo);
router.delete('/videos/:id', checkRole(['ENTRENADOR']), entrenadoresController.deleteVideo);

// Tabla de Juego / Simulador 2D (Máximo 10 formaciones por categoría)
router.get('/tacticas', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.listTacticas);
router.post('/tacticas', checkRole(['ENTRENADOR']), entrenadoresController.createTactica);
router.put('/tacticas/:id', checkRole(['ENTRENADOR']), entrenadoresController.updateTactica);
router.delete('/tacticas/:id', checkRole(['ENTRENADOR']), entrenadoresController.deleteTactica);

// Trabajos 3D Escritos y Agenda Compartida de Espacios en Cancha (Coach + Fisio)
router.get('/trabajos', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.listTrabajos);
router.post('/trabajos', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.createTrabajo);
router.patch('/trabajos/:id', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.updateTrabajo);
router.delete('/trabajos/:id', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.deleteTrabajo);

// Evaluación Manual y Masiva del Jugador (Física, Técnica con Balón, Coordinativa)
router.get('/evaluations', checkRole(['ENTRENADOR', 'FISIO']), entrenadoresController.listEvaluations);
router.post('/evaluations', checkRole(['ENTRENADOR']), entrenadoresController.createEvaluation);
router.post('/evaluations/batch', checkRole(['ENTRENADOR']), entrenadoresController.createBatchEvaluations);

// Asistencia Entrenamientos y Juegos + Elegibilidad (Entrenador)
router.get('/attendance', checkRole(['ENTRENADOR']), entrenadoresController.getCoachAttendance);
router.post('/attendance', checkRole(['ENTRENADOR']), entrenadoresController.recordCoachAttendance);

// Convocatorias Oficiales con notificación automática (Bandeja + Email + WhatsApp)
router.get('/convocatorias', checkRole(['ENTRENADOR']), entrenadoresController.listConvocatorias);
router.post('/convocatorias', checkRole(['ENTRENADOR']), entrenadoresController.createConvocatoria);

module.exports = router;
