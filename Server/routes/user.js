
const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const winston = require('winston');
const crypto = require('crypto');
const config = require('../config/config');
const sendVerificationCode = require('../utils/user').sendVerificationCode;
const utils = require('../utils/util');


router.post('/register', function(req, res) {

    if (!req.body.email || !req.body.password || !req.body.universityId) {
        winston.info("Email/password/universityId not present");
        return res.json({
            success: false,
            message: 'Please enter email and password'
        });
    }
    
    

    let userType = (req.body.email).substr((req.body.email).indexOf('@')+1,(req.body.email).length) === "sjsu.edu" ? "librarian" : "patron";

    
    winston.info("finding user..",req.body.email);
    User.findOne({
        where: {email: req.body.email}
    }).
    then((user) => {
        if(user){
           winston.info("user already exists",user.email);
        }
        else{
            winston.info("User does not exist..");
            let user = {
                email: req.body.email,
                password: req.body.password,
                universityId: req.body.universityId,
                isVerified: false,
                userType: userType
            }
            User.create(user)
            .then((u)=>{
                if(u){
                    winston.info("User registered..",u.email);
                    let verificationCode = utils.generateVerificationCode();
                    sendVerificationCode(verificationCode,u.email);
                    return res.json({
                        success: true,
                        message: 'Successfully registered!',
                        data:u
                    });

                }
            })
        }
    });



});



module.exports = router;