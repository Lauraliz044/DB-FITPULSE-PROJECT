const router = require('express').Router();
const purchase = require('../controllers/purchase-controller');
const { authenticate, requireAdmin, requireClient } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.post('/', authenticate, requireClient, purchase.create);
router.get('/', authenticate, requireAdmin, purchase.list);
router.get('/:id', authenticate, noQuery, purchase.get);

module.exports = router;
