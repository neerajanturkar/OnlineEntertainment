const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email:	{ type: String, require: true },
    name: { type : String},
    dob: { type: String },
    profiles: {type: [String]},
    preferedGeners:	{type: [String]}
});

const User = module.exports = mongoose.model('user', userSchema);