const router = require('express').Router();
const package = require('../controllers/package-controller');
const { authenticate, requireAdmin } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.get('/', authenticate, package.list);
router.get('/:id', authenticate, noQuery, package.get);
router.post('/', authenticate, requireAdmin, package.create);
router.patch('/:id', authenticate, requireAdmin, package.update);
router.delete('/:id', authenticate, requireAdmin, package.remove);

module.exports = router;
