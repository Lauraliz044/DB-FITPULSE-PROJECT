const router = require('express').Router();
const report = require('../controllers/report-controller');
const { authenticate, requireAdmin } = require('../middleware/authentication');
const { configureRouter } = require('../middleware/router-validation');

configureRouter(router);
router.get('/sales', authenticate, requireAdmin, report.sales);

module.exports = router;
