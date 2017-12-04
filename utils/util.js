//TODO: replace with actual utility files
const uuidv1 = require('uuid/v1');
const express = require('express');
const winston = require('winston');
const moment = require('moment');
const mailer = require('./email');

let generateVerificationCode = () => {
    let length = 5;
    var chars = "1234567890";
    var code = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        code += chars.charAt(i);
    }
    return code;
}

let generateUUID = () => {
    return uuidv1();
}

let sendBookAvailableMail = (book,user,hold) =>{
    

    let mailOptions = {};
    mailOptions.subject = "Book with title "+book.title+" available for checkout";
    let mailText = ["Hi,","\nThe following book has become available and put on hold for you. :\n"];
    mailText.push("----------------------------------------");
    
    mailText.push((1) +". "+ book.title + " by "+book.author);
    mailText.push("Hold expires on: "+moment(hold.endDate).format("MMMM Do YYYY"));
    
        
        //add more details as required
    
    mailText.push("----------------------------------------");
    mailText.push("Thank you,");
    mailText.push("Team MyLib");
    mailText = mailText.join("\n");
    mailOptions.text = mailText;
    winston.info("mail text..",mailOptions.text);
    mailer.sendMail(user,mailOptions);
    
}

exports.generateUUID = generateUUID;

exports.generateVerificationCode = generateVerificationCode;

exports.sendBookAvailableMail = sendBookAvailableMail;