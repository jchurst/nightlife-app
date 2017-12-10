const express = require('express');
const passport = require('passport');
const router = express.Router();


// Login
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/error',
    successRedirect: '/'
  })
);

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


// Export
module.exports = router;