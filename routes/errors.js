const express = require('express');
const router = express.Router();


// Since this is the last non-error-handling middleware responding, we assume 404
router.use((req, res, next) => {
  res.status(404);
  
  // Respond with HTML page
  if (req.accepts('html')) {
    return res.render('error', {
      title: '404 Page Not Found',
      error: {
        status: 404,
        title: 'Page Not Found',
        details: 'The requested URL ' + req.url + ' was not found on this server.'
      }
    });
  }
  
  // Respond with JSON
  if (req.accepts('json')) {
    return res.send({ error: 'Page Not Found' });
  }
  
  // Default to plain text
  res
    .type('txt')
    .send('Page Not Found');
});


// If all else fails, throw a 500 error
router.use((err, req, res, next) => {
  let error = {
    status: err.status || 500,
    title: err.title || 'Internal Server Error',
    details: err.details || 'The server encountered an internal error and was unable to complete your request.'
  };
  
  // Set error status
  res.status(error.status)
  
  // Respond with HTML page
  if (req.accepts('html')) {
    return res.render('error', {
      title: error.title,
      error: error
    });
  }
  
  // Respond with JSON
  if (req.accepts('json')) {
    return res.send({ error: error });
  }
  
  // Default to plain text
  res
    .type('txt')
    .send(error.title);
});


// Export
module.exports = router;