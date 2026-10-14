const router = require('express').Router();
const record = require('../controllers/record-controller');
const { authenticate, requireClient } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.get('/:id', authenticate, noQuery, record.get);
router.patch('/:id', authenticate, requireClient, record.update);
router.delete('/:id', authenticate, requireClient, record.remove);

module.exports = router;
