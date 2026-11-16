const router = require('express').Router();
const packageController = require('../controllers/package-controller');
const { authenticate, requireAdmin } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.get('/', authenticate, packageController.list);
router.get('/:id', authenticate, noQuery, packageController.get);
router.post('/', authenticate, requireAdmin, packageController.create);
router.patch('/:id', authenticate, requireAdmin, packageController.update);
router.delete('/:id', authenticate, requireAdmin, packageController.remove);

module.exports = router;
