// Middleware for attaching the user to the request object
exports.attachUser = (req, res, next) => {
  res.locals.user = req.user;
  next();
};


// Middleware for handling user authentication on admin routes
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  
  res.redirect('/');
};