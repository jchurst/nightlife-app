const mongoose = require('mongoose');


// Schema
const UserSchema = new mongoose.Schema({
  
  twitter: {
    id: {
      type: Number,
      unique: true
    },
    token: String,
    username: String
  },
  
  location: String
  
});


// Export
module.exports = mongoose.model('User', UserSchema);