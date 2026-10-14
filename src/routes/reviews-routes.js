const router = require('express').Router();
const review = require('../controllers/review-controller');
const { authenticate, requireClient } = require('../middleware/authentication');
const { configureRouter, noQuery } = require('../middleware/router-validation');

configureRouter(router);
router.post('/', authenticate, requireClient, review.create);
router.get('/:id', authenticate, noQuery, review.get);
router.patch('/:id', authenticate, requireClient, review.update);
router.delete('/:id', authenticate, requireClient, review.remove);

module.exports = router;
