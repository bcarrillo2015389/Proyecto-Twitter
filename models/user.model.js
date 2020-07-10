'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name:String,
    email:String,
    username:String,
    password:String,
    tweets: [{
        date:String,
        description:String
    }],
    following: [{type: Schema.Types.ObjectId, ref:'user'}],
    followers: [{type: Schema.Types.ObjectId, ref:'user'}]
});

module.exports = mongoose.model('user', userSchema);