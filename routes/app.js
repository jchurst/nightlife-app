const express = require('express');
const router = express.Router();
const yelp = require('yelp-fusion');
const User = require('../models/user');
const Location = require('../models/location');
const isLoggedIn = require('../util').isLoggedIn;


// Index (Search)
router.get('/', (req, res) => {
  let { location } = req.query;
  
  if (location && req.user) {
    // If we are searching a new location, save it to our `user`
    User.update({ _id: req.user._id }, { location }, err => {
      if (err) throw err;
    });
  } else if (req.user && req.user.location) {
    // Otherwise, attempt to use the existing `location` value from `user`
    location = req.user.location;
  }
  
  // If `location` ended up with a non-empty value, display search results from Yelp
  if (location) {
    const searchRequest = {
      term: 'bars',
      location: location
    }
    
    yelp.accessToken(process.env.YELP_ID, process.env.YELP_SECRET)
      .then(response => {
        const client = yelp.client(response.jsonBody.access_token);
        
        client.search(searchRequest)
          .then(response => {
            const businessIds = response.jsonBody.businesses.map(item => item.id);
            
            // Lookup locations from the database that match items in the search results
            Location.find({ locationId: { $in: businessIds } }, (err, locations) => {
              if (err) throw err;
              
              const searchResults = response.jsonBody.businesses.map(item => {
                const match = locations.find(doc => doc.locationId === item.id);
                
                // Convert meters to miles
                item.distance = (item.distance * 0.000621371192).toFixed(2);
                
                // If we have an existing record for this location, use it to attach some extra data
                if (match) {
                  // Filter out expired attendees
                  let attendees = match.attendees.filter(item => {
                    const now = (new Date()).getTime();
                    const expire = item.expireAt.getTime();
                    
                    return now < expire;
                  });
                  
                  // If we remove some expired attendees, save the model
                  if (attendees.length !== match.attendees.length) {
                    Location.findByIdAndUpdate(match._id, { attendees }, err => {
                      if (err) throw err;
                    });
                  }
                  
                  item.numAttending = attendees.length;
                  item.isAttending = req.user && attendees.find(item => item.twitterId === req.user.twitter.id.toString()) ? true : false;
                } else {
                  item.numAttending = 0;
                  item.isAttending = false;
                }
                
                return item;
              });
              
              res.render('index.html', { searchRequest, searchResults });
            });
          })
          .catch(err => {
            throw err;
          });
      }).catch(err => {
        throw err;
      });
  } else {
    // Otherwise, display the search location
    res.render('index.html');
  }
});


// Set a user's attendance for a location
router.get('/attend/:id', isLoggedIn, (req, res) => {
  Location.findOne({ locationId: req.params.id }, (err, location) => {
    if (err) throw err;
    
    if (location) {
      const exists = location.attendees.find(item => item.twitterId === req.user.twitter.id.toString());
      
      // If the user isn't already attending, add them to the list
      if (!exists) {
        const pushObject = { attendees: { twitterId: req.user.twitter.id } };
        
        location.update({ $push: pushObject }, (err, result) => {
          if (err) throw err;
          
          res.redirect('/');
        });
      } else {
        // Otherwise, do nothing
        res.redirect('/');
      }
    } else {
      // Create location with attendee
      const newLocation = new Location({
        locationId: req.params.id,
        attendees: [{ twitterId: req.user.twitter.id }]
      });
      
      newLocation.save(err => {
        if (err) throw err;
        
        res.redirect('/');
      });
    }
  });
});


// Remove a user's attendance from a location
router.get('/remove/:id', isLoggedIn, (req, res) => {
  const pullObject = { attendees: { twitterId: req.user.twitter.id } };
  
  Location.findOneAndUpdate({ locationId: req.params.id }, { $pull: pullObject }, (err, result) => {
    if (err) throw err;
    
    res.redirect('/');
  });
});


// Export
module.exports = router;
