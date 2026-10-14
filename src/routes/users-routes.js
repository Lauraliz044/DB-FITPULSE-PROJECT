const router = require('express').Router();
const progress = require('../controllers/progress-controller');
const purchase = require('../controllers/purchase-controller');
const record = require('../controllers/record-controller');
const reservation = require('../controllers/reservation-controller');
const user = require('../controllers/user-controller');
const { authenticate, requireAdmin, requireClient } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.post('/', user.register);
router.get('/', authenticate, requireAdmin, user.list);
router.get('/:id', authenticate, noQuery, user.get);
router.patch('/:id/status', authenticate, requireAdmin, user.updateStatus);
router.get('/:userId/purchases', authenticate, purchase.listForUser);
router.get('/:userId/reservations', authenticate, reservation.listForUser);
router.get('/:userId/personal-records', authenticate, record.listForUser);
router.post('/:userId/personal-records', authenticate, requireClient, record.create);
router.get('/:userId/progress', authenticate, noQuery, progress.get);

module.exports = router;
