const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const winston = require('winston');
const mailer = require('./email');

let sendVerificationCode = (code,email) => {
    User.update({
        verificationCode: code
    },
    {   
        where: {
            email: email
        }
    })
    .then((u)=>{
       //console.log("inside then",email,u);
        if(u !== null){
            winston.info("verification code updated for user..",email);
            let mailOptions = {
                "subject":"Verification code for sign up",
                "text": "Your verification code is: "+code
            };
            mailer.sendMail({email:email},mailOptions);
            
        }
    });
}

let verify = (code,email,cb) => {

    User.findOne({
        where: {email: email}
    }).
    then((user)=>{
        if(user.verificationCode === code){
            winston.info("code matches");
            user.isVerified = true;
            user.save();
            cb.success(user);
        }
        else{
            winston.info("code does not match");
            cb.failure();
        }

    })
}


exports.sendVerificationCode = sendVerificationCode;
exports.verify = verify;