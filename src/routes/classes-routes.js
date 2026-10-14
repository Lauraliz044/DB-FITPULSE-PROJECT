const router = require('express').Router();
const classController = require('../controllers/class-controller');
const review = require('../controllers/review-controller');
const { authenticate, requireAdmin } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.get('/', authenticate, classController.list);
router.get('/:id', authenticate, noQuery, classController.get);
router.post('/', authenticate, requireAdmin, classController.create);
router.patch('/:id', authenticate, requireAdmin, classController.update);
router.delete('/:id', authenticate, requireAdmin, classController.remove);
router.get('/:classId/reviews', authenticate, review.listForClass);

module.exports = router;
