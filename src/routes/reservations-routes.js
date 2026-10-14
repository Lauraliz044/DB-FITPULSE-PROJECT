const router = require('express').Router();
const reservation = require('../controllers/reservation-controller');
const { authenticate, requireAdmin, requireClient } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.post('/', authenticate, requireClient, reservation.create);
router.get('/:id', authenticate, noQuery, reservation.get);
router.patch('/:id/attendance', authenticate, requireAdmin, reservation.attendance);

module.exports = router;
