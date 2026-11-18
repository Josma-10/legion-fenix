const express = require('express');
const router = express.Router();
const representantesController = require('./representantes.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');
const { uploadCloud } = require('../../config/cloudinary');

router.get('/', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ENTRENADOR', 'FISIO', 'ANALISTA_ADMIN']), representantesController.listPlayers);
router.get('/notifications', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA']), representantesController.getInboxNotifications);
router.patch('/notifications/:id/read', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA']), representantesController.markInboxNotificationRead);
router.get('/check-dorsal', verifyToken, representantesController.checkDorsal);
router.get('/:id', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ENTRENADOR', 'FISIO', 'ANALISTA_ADMIN']), representantesController.getPlayerDossier);
router.patch('/:id/convocatorias/:idPartido', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ADMINISTRADOR']), representantesController.respondConvocation);
router.patch('/:id/entrenamientos/:idTrabajo', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ADMINISTRADOR']), representantesController.respondTrainingAttendance);
router.patch('/:id/sizes', verifyToken, checkRole(['REPRESENTANTE', 'ATLETA', 'ENTRENADOR', 'ANALISTA_ADMIN', 'ADMINISTRADOR']), representantesController.updatePlayerSizes);
router.post('/upload-photo', verifyToken, uploadCloud.single('foto'), representantesController.uploadPlayerPhoto);
router.post('/register-complete', verifyToken, checkRole(['REPRESENTANTE']), representantesController.registerCompleteAthlete);

module.exports = router;
