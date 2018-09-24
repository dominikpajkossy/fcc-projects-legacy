'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollSchema = new Schema({
    
	pollname : String,
	voteoptionnames : [{
		name : String,
		votes : Number
	}]
})

module.exports = mongoose.model('Poll', PollSchema);

