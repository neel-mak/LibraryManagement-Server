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

exports.sendVerificationCode = sendVerificationCode;