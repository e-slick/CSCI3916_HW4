var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//require('dotenv').config({ path: '.env' });

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology : true } );
mongoose.set('useCreateIndex', true);


var MovieSchema = new Schema({
    title: {type: String, required: true},
    year_released: {type: String, required: true},
    genre: {type: String, required: true},
    actor_name: {type: Array, required: true},
    character_name: {type: Array, required: true},
    ID: {type: Number, required: true},
    movie_URL: {type: String, required: false}
});


// return the model
module.exports = mongoose.model('Movie', MovieSchema);