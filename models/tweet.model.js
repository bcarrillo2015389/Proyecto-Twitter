'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    date:String,
    description:String
});

module.exports = mongoose.model('tweets', tweetSchema);