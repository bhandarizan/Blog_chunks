const { Router } = require('express');
const { handleSignin, handleSignup, handleLogout } = require('../controllers/user');
const router = Router();

router.get('/signin', (req, res) => {
   return res.render('signin');
});

router.get('/signup', (req, res) => {
   return res.render('signup');
});

router.post('/signin', handleSignin);

router.get('/logout', handleLogout);

router.post('/signup', handleSignup);

module.exports = router;