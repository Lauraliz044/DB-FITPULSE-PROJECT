const router = require('express').Router();
const session = require('../controllers/session-controller');
const { configureRouter } = require('../middleware/router-validation');

configureRouter(router);
router.post('/', session.create);

module.exports = router;
