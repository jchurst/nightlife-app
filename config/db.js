const mongoose = require('mongoose');
const db_connect_uri = process.env.MONGOLAB_URI;

mongoose.connect(db_connect_uri);
