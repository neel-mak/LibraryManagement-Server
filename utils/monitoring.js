const cronJob = require('cron').CronJob;
const winston  = require('winston');
const Sequelize = require('sequelize');
const models = require('../models/index');
const moment = require('moment');
const config = require('../config/config');
const utils = require('../utils/util');
const mailer = require('../utils/email');
const Op = Sequelize.Op;
const _ = require('underscore');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const User = models.User;
const Book = models.Book;
const Waitlist = models.Waitlist;
const Checkout = models.Checkout;

//A job to check due date...
const dueDateMonitor = new cronJob("* * * * *", function() {
        //cron expression: min hour * * *
        console.log("Due dates monitoring job start: " + new Date());
        dueDateCheck();
    }, null, false);
//A job to check holds

const holdMonitor = new cronJob("* * * * *", function() {
    //cron expression: min hour * * *
    console.log("Holds monitoring job start: " + new Date());
    //updateRecallRecordsJob();
}, null, false);


let start = ()=>{
    winston.info("Starting monitors....");
    dueDateMonitor.start();
    holdMonitor.start();
}


let dueDateCheck = () => {
    let dueDateRange = new Date();
    dueDateRange = dueDateRange.setDate(dueDateRange.getDate() + 5);
    winston.info("dueDateRange...",dueDateRange);
    Checkout.findAll({
        where:{
           isReturned: false,
           dueDate: {
               $lte: moment(dueDateRange).format(),
               $gt: moment().format()
           }
            //due date which is less than currentDate + 5
        }
    })
    .then((checkouts)=>{
        if(checkouts){
            winston.info("checkouts found...",checkouts.length);
            if(checkouts.length > 0){
                winston.info("Checkouts found. Processing them...");
                checkouts.forEach(checkout => {
                    eventEmitter.emit('processCheckout',checkout);    
                });
            }
        }
    })

}

let processCheckout = (checkoutInfo) =>{
    if(!!!checkoutInfo.lastAlertSentOn || checkoutInfo.alertCount === 0){
        winston.info("No alerts sent yet for checkout..",checkoutInfo.id);
        checkoutInfo.alertCount = 0;
        //checkoutInfo.lastAlertSentOn = new Date();
    }
    
        winston.info("Alerts have been sent for this checkout..");
        let d = new Date();
        d.setDate(checkoutInfo.lastAlertSentOn);
        //checkoutInfo.lastAlertSentOn
        if(checkoutInfo.lastAlertSentOn && d.getDay === new Date().getDay){
            winston.info("Alert for today aleady sent..");
            return;
        }
        if(checkoutInfo.alertCount &&  checkoutInfo.alertCount>= 5){
            winston.info("Five alerts sent already. No need to send any more.");
            return;
        }

        winston.info("Send alert for today...");
        
        checkoutInfo.alertCount++;
        checkoutInfo.set('alertCount',checkoutInfo.alertCount);
        checkoutInfo.set('lastAlertSentOn',null);
        checkoutInfo.set('lastAlertSentOn',new Date());
        checkoutInfo.save();
        sendDueDateWarningMail(checkoutInfo);
    
}


let sendDueDateWarningMail = (checkoutInfo) => {
    let mailOptions = {};
    mailOptions.subject = "Book due notice";
    let mailText = ["Hi,","\nBelow book is due in "+(5-checkoutInfo.alertCount+1) +" day(s):\n"];
    mailText.push("----------------------------------------");
    Book.findOne({
        where:{
            id: checkoutInfo.bookId
        }
    })
    .then((book)=>{
        mailText.push(book.title + " by "+book.author+"\n");
        mailText.push("Due date: "+moment(checkoutInfo.dueDate).format("MMMM DD YYYY")+"\n");
        mailText.push("----------------------------------------");
        mailText.push("Thank you,");
        mailText.push("Team SNAPLibrary");
        mailText = mailText.join("\n");
        mailOptions.text = mailText;
        winston.info("mail text..",mailOptions.text);
        User.findOne({
            where:{
                id: checkoutInfo.patronId
            }
        })
        .then((user)=>{
            mailer.sendMail(user,mailOptions);
        })
       
    });

}


eventEmitter.on('processCheckout', processCheckout);

exports.start =  start;

