'use strict'
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var moment = require('moment');

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');


function commands(req, res){
    var params = req.body.command.split(' ');
    var command = params[0].toUpperCase();

    switch(command){
        case 'ADD_TWEET':
            addTweet(req, res, params);
            break;

        case 'DELETE_TWEET':
            deleteTweet(req, res, params);
            break;
        
        case 'EDIT_TWEET':
            editTweet(req, res, params);
            break;

        case 'VIEW_TWEETS':
            viewTweets(req, res, params);
            break;
        
        case 'FOLLOW':
            follow(req, res, params);
            break;

        case 'UNFOLLOW':
            unfollow(req, res, params);
            break;
        
        case 'PROFILE':
            profile(req, res, params);
            break;

        case 'LOGIN':
            login(req, res, params);
            break;

        case 'REGISTER':
            register(req, res, params);
            break;

        default:
            res.send({message:'Comando no válido.'});
            break;
    }
}

function addTweet(req, res, params){

    params.shift();
    var text = params.join(' ').trim();

    if(text.length>0){
        if(text.length<=280){
            var tweet = new Tweet();

            /*FECHA */
            var momentDate = moment().format('LL').split('');
            tweet.date =  momentDate.join('');

            tweet.description = text;

            User.findByIdAndUpdate(req.user.sub, {$push:{tweets:tweet}}, {new:true}, (err, userUpdated)=>{
                if(err){
                    res.status(500).send({message:'Error general.'});
                }else if(userUpdated){

                    res.send({message:'Tweet registrado.', 
                            user:userUpdated.username,
                            tweet:tweet});
                }else{
                    res.status(418).send({message:'Tweet no agregado.'});
                }
            });
        }else{
            res.send({message:'El tweet sobrepasa la capacidad máxima de 280 caracteres.'});
        }
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function deleteTweet(req, res, params){

    if((params.length == 2) && (params[0] !='' && params[1] !='')){
        User.findOne({'_id': req.user.sub, 'tweets._id':params[1]},(err, userFind)=>{
            if(err){
                res.status(500).send({message:'Error general, revise el ID ingresado.'});
            }else if(userFind){
                var tweet = userFind.tweets.find(element => element._id == params[1]);

                User.findByIdAndUpdate(req.user.sub, {$pull:{tweets:{_id:params[1]}}}, {new:true},(err, userUpdated)=>{
                    if(err){
                        res.status(500).send({message:'Error general.'});
                    }else if(userUpdated){

                        res.send({message:'Tweet eliminado.', 
                        user:userUpdated.username,
                        tweetDeleted:tweet});
                    }else{
                        res.status(418).send({message:'Tweet no eliminado.'});
                    }
                });
            }else{
                res.status(404).send({message:'Tweet no encontrado en los registros del usuario.'});
            }
        });
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function editTweet(req, res, params){
    params.shift();
    
    if((params.length >= 2) && (params[0] !='')){
        User.findOne({'_id':req.user.sub, 'tweets._id':params[0]}, (err, userFind)=>{
            if(err){
                res.status(500).send({message:'Error general, revise el ID ingresado.'});

            }else if(userFind){
                let idTweet = params[0];
                params.shift();
                var text = params.join(' ').trim();

                if(text.length>0){
                    if(text.length<=280){
    
                        var tweetSaved = userFind.tweets.find(element => element._id==idTweet);
                        var momentDate = moment().format('LL').split('');
                        var date =  momentDate.join('');

                        User.findOneAndUpdate({'_id':req.user.sub, 'tweets._id':idTweet},
                        {'tweets.$.date': date,
                        'tweets.$.description':text || tweetSaved.description},{new:true},
                        (err, userUpdated)=>{
                            if(err){
                                res.status(500).send({message:'Error general.'});
                            }else if(userUpdated){
                                var tweet = userUpdated.tweets.find(element => element._id == idTweet);
                                
                                res.send({message:'Tweet actualizado.', 
                                user:userUpdated.username,
                                tweetUpdated:tweet});
                            }else{
                                res.status(418).send({message:'No se pudo actualizar el tweet.'});
                            }
                        });
                    }else{
                        res.send({message:'El tweet sobrepasa la capacidad máxima de 280 caracteres.'});
                    }
                }else{
                    res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
                }
            }else{
                res.status(404).send({message:'Tweet no encontrado en los registros del usuario.'});
            }
        });
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function viewTweets(req, res, params){

    if((params.length == 2) && (params[0] !='' && params[1] !='')){
        User.findOne({'username':params[1]},(err, userFind)=>{
            if(err){
                res.status(500).send({message:'Error general.'});
            }else if(userFind){

                if(userFind.tweets.length>0){
                    res.send({message:'Tweets del usuario.', 
                    username:userFind.username,
                    tweets:userFind.tweets});
                }else{
                    res.send({message:'Este usuario aún no cuenta con tweets publicados.'});
                }

            }else{
                res.status(404).send({message:'Usuario no encontrado.'});
            }
        });
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function follow(req, res, params){

    if((params.length == 2) && (params[0] !='' && params[1] !='')){
        if(params[1] == req.user.username){
            res.status(403).send({message:'No puede seguirse a si mismo.'});
        }else{
            User.findOne({'username':params[1]}, (err, userFind)=>{
                if(err){
                    res.status(500).send({message:'Error general.'});
                }else if(userFind){

                    User.findOne({'_id':req.user.sub, 'following':userFind._id},(err, find)=>{
                        if(err){
                            res.status(500).send({message:'Error general.'});
                        }else if(find){
                            res.status(404).send({message:'Usuario ya seguido.'});
                        }else{

                            User.findByIdAndUpdate(req.user.sub, {$push:{following:userFind._id}}, {new:true}, (err, userUpdated)=>{
                                if(err){
                                    res.status(500).send({message:'Error general'});
                                }else if(userUpdated){

                                    /*Actualizar seguidores del otro usuario*/
                                    User.findByIdAndUpdate(userFind._id, {$push:{followers:req.user.sub}},{new:true},(err, userOk)=>{
                                        if(err){
                                            res.status(500).send({message:'Error general'});
                                        }else if(userOk){
                                            res.send({message:'Usuario agregado a seguidos.', username:userFind.username});
                                        }else{
                                            res.status(418).send({message:'Usuario no agregado a seguidores.'});
                                        }
                                    });

                                }else{
                                    res.status(418).send({message:'Usuario no agregado a seguidos.'});
                                }
                            });
                        }
                    });
                }else{
                    res.status(404).send({message:'Usuario inexistente.'});
                }
            });
        }
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function unfollow(req, res, params){

    if((params.length == 2) && (params[0] !='' && params[1] !='')){
        if(params[1] == req.user.username){
            res.status(403).send({message:'No puede dejar de seguirse a sí mismo.'});
        }else{

            User.findOne({username:params[1]}, (err, userFind)=>{
                if(err){
                    res.status(500).send({message:'Error general.'});
                }else if(userFind){

                    User.findOne({'_id':req.user.sub, 'following':userFind._id},(err, find)=>{
                        if(err){
                            res.status(500).send({message:'Error general.'});
                        }else if(find){

                            User.findOneAndUpdate({_id:req.user.sub}, {$pull:{following:userFind._id}}, {new:true}, (err, userUpdated)=>{
                                if(err){
                                    res.status(500).send({message:'Error general.'});
                                }else if(userUpdated){
                                    
                                    /*Actualizar seguidores del otro usuario*/
                                    User.findByIdAndUpdate(userFind._id, {$pull:{followers:req.user.sub}},{new:true},(err, userOk)=>{
                                        if(err){
                                            res.status(500).send({message:'Error general.'});
                                        }else if(userOk){
                                            res.send({message:'Usuario dejado de seguir.', username:userFind.username});
                                        }else{
                                            res.status(418).send({message:'Usuario no eliminado de seguidores.'});
                                        }
                                    });

                                }else{
                                    res.status(418).send({message:'Usuario no eliminado de seguidos.'});
                                }
                            });
                        }else{
                            res.status(404).send({message:'No sigues a este usuario.'});
                        }
                    });
                }else{
                    res.status(404).send({message:'Usuario inexistente.'});
                }
            });
        }
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function profile(req, res, params){

    if((params.length == 2) && (params[0] !='' && params[1] !='')){
        User.findOne({'username':params[1]}, (err, userFind)=>{
            if(err){
                res.status(500).send({message:'Error general.'});
            }else if(userFind){
                res.send({message:'Perfil', 
                name: userFind.name,
                email: userFind.email,
                username: userFind.username,
                tweets: userFind.tweets,
                following: userFind.following,
                followers: userFind.followers});
            }else{
                res.status(404).send({message:'Perfil no encontrado.'});
            }
        }).populate({path:'following', select: 'username'}).populate({path:'followers', select: 'username'});
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function login(req, res, params){

    if((params.length == 3) && (params[0] !='' && params[1] !='' && params[2] !='')){
        User.findOne({$or:[
            {username:params[1]},
            {email:params[1]}]},(err, userFind)=>{
                if(err){
                    res.status(500).send({message:'Error general.'});
                }else if(userFind){

                    bcrypt.compare(params[2], userFind.password, (err,passwordOk)=>{
                        if(err){
                            res.status(500).send({message:'Error al comparar.'});
                        }else if(passwordOk){
                            res.send({message:'Bienvenido a Twitter en NodeJS.', 
                                    name:userFind.name,
                                    token:jwt.createToken(userFind)});
                        }else{
                            res.status(404).send({message:'Datos de usuario incorrectos.'});
                        }
                    })
                }else{
                    res.status(404).send({message:'Datos de usuario incorrectos.'});
                }
            });
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

function register(req, res, params){
    var user = new User();

    if((params.length == 5) && (params[0] !='' && params[1] !='' && params[2] !='' && params[3] !='' && params[4] !='')){
        User.findOne({$or:[
            {email:params[2]},
            {username:params[3]}]},(err, userFind)=>{
                if(err){
                    res. status(500).send({message:'Error general, inténtelo más tarde.'});
                }else if(userFind){
                    res.send({message:'Nombre de usuario o email ya utilizado.'});
                }else{
                    user.name = params[1];
                    user.email = params[2]
                    user.username = params[3];
                    
                    bcrypt.hash(params[4], null, null, (err, passwordHash)=>{
                        if(err){
                            res.status(500).send({message:'Error al encriptar la contraseña.'});
                        }else if(passwordHash){
                            user.password = passwordHash;
                        }else{
                            res.status(418).send({message:'Error inesperado.'});
                        }
                    });

                    user.save((err, userSaved)=>{
                        if(err){
                            res.status(500).send({message:'Error general al guardar usuario.'});
                        }else if(userSaved){
                            res.send({message:'Usuario registrado con éxito.', user:userSaved});
                        }else{
                            res.status(404).send({message:'Usuario no guardado.'});
                        }
                    });

                }
        });
    }else{
        res.send({message:'Ingrese los datos necesarios según la estructura del comando.'});
    }
}

module.exports = {
    commands
}