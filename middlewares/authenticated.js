'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = '1e09826a23ysasft'

exports.ensureAuth = (req, res, next)=>{
    if(req.body.command){
        var param = req.body.command.split(' ');
        var command = param[0].toUpperCase();

        if(command == 'LOGIN' || command == 'REGISTER'){
            next();
        }else if(command == 'ADD_TWEET' || command == 'DELETE_TWEET'|| command == 'EDIT_TWEET'|| command == 'VIEW_TWEETS' 
                || command == 'FOLLOW'|| command == 'UNFOLLOW'|| command == 'PROFILE'){
                    
            if(!req.headers.authorization){
                return res.status(403).send({message:'Peticion sin autenticacion.'});
            }else{
                var token = req.headers.authorization.replace(/['"]+/g, '');
                try{
                    var payload = jwt.decode(token, key);
                    if(payload.exp <= moment().unix()){
                        return res.status(401).send({message:'Token expirado'});
                    }
                }catch(ex){
                    return res.status(404).send({message:'Token no válido.'});
                }

                req.user = payload;
                next();
            }
        }else{
            return res.send({message:'Comando no válido.'});
        }
    }else{
        return res.send({message:'Debe utilizar el valor command para enviar su comando.'});
    }
}