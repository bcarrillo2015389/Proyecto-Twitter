'use strict'

var express = require('express');
var userController = require('../controllers/user.controller');
var md_auth = require('../middlewares/authenticated');

//RUTA
var api = express.Router();
api.post('/commands', md_auth.ensureAuth, userController.commands);

module.exports = api;