const router = require('express').Router();

router.use('/users', require('./users-routes'));
router.use('/sessions', require('./sessions-routes'));
router.use('/classes', require('./classes-routes'));
router.use('/packages', require('./packages-routes'));
router.use('/purchases', require('./purchases-routes'));
router.use('/reservations', require('./reservations-routes'));
router.use('/reviews', require('./reviews-routes'));
router.use('/personal-records', require('./personal-records-routes'));
router.use('/reports', require('./reports-routes'));

module.exports = router;
