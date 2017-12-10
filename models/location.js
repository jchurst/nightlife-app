const mongoose = require('mongoose');


// Schema
const LocationSchema = new mongoose.Schema({
  
  locationId: {
    type: String,
    unique: true
  },
  
  attendees: [{
    twitterId: String,
    expireAt: {
      type: Date,
      default: () => {
        let d = new Date();
        d.setDate(d.getDate() + 1);
        
        return d;
      }
    }
  }]
  
});


// Export
module.exports = mongoose.model('Location', LocationSchema);
