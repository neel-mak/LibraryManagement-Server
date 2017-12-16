const nodemailer = require('nodemailer');
const config = require('../config/config');
const winston = require('winston');
const MAIL_SERVICE = config.mail.mailService;
const ADMIN_USER = config.mail.user;
const PASSWORD = config.mail.password;

const transporter = nodemailer.createTransport({
    service: MAIL_SERVICE,
    auth: {
      user: ADMIN_USER,
      pass: PASSWORD
    }
  });
  
  
  

let sendMail = (user,mailOptions)=>{


    //Set below two options of the mailOptions object from the calling method
    // subject: 'Sending Email using Node.js',
    // text: ''
    winston.info("emailoptions..",mailOptions);
    if(!!!mailOptions)
        return;

    mailOptions.from = ADMIN_USER;
    mailOptions.to = user.email;

    winston.info("sending email to user..",user.email);
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          winston.info("Error while sending email",error,user.email);
        } else {
          console.log('Email sent to user: ',user.email, info.response);
        }
      });
}


exports.sendMail = sendMail;

  