var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
require('dotenv').config({ path: '.env' });

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology : true } );
mongoose.set('useCreateIndex', true);


var ReviewSchema = new Schema({
    name: {type: String, required: true},
    review: {type: String, required: true},
    rating: {type: Number, required: true},
    ID: {type: Number, required: true}
});

module.exports = mongoose.model('Review', ReviewSchema);