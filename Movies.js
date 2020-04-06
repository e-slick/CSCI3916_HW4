var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//TODO: Review https://mongoosejs.com/docs/validation.html

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true} );
mongoose.set('useCreateIndex', true);

// movie schema
var MovieSchema = new Schema({
    title: {type: String, required: true},
    releaseDate: {type: String, required: true},
    genre: {type: String, required: true},
    actorName: {type: Array, required: true},
    charName: {type: Array, required: true}
});

var Movie = mongoose.model('Movies', MovieSchema);
module.exports  = Movie;