const nodemailer = require('nodemailer');
const config = require('../config/config');
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

    if(!!!mailOptions)
        return;

    mailOptions.from = ADMIN_USER;
    
    var mailOptions = {
        from: ADMIN_USER,
        to: user.email,
    };


    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}


exports.sendMail = sendMail;

  