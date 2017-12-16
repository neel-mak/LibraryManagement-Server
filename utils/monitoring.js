const cronJob = require('cron').CronJob;
const winston  = require('winston');
const Sequelize = require('sequelize');
const models = require('../models/index');
const moment = require('moment-timezone');
const config = require('../config/config');
const utils = require('../utils/util');
const eventReceivers = require('../utils/event-receivers');
const mailer = require('../utils/email');
const Op = Sequelize.Op;
const _ = require('underscore');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const User = models.User;
const Book = models.Book;
const Hold = models.Hold;
const Waitlist = models.Waitlist;
const Checkout = models.Checkout;

//A job to check due date...
const dueDateMonitor = new cronJob("* * * * *", function() {
        //cron expression: min hour * * *
        console.log("Due dates monitoring job start: " + moment().add(global.timeOffset,"minutes").toDate());
        checkDueDate();
    }, null, false);
//A job to check holds

const holdMonitor = new cronJob("* * * * *", function() {
    //cron expression: min hour * * *
    console.log("Holds monitoring job start: " + moment().add(global.timeOffset,"minutes").toDate());
    checkHolds();
}, null, false);


let start = ()=>{
    winston.info("Starting monitors....");
    dueDateMonitor.start();
    holdMonitor.start();
}


let checkDueDate = () => {
    let dueDateRange = new Date();
    dueDateRange = dueDateRange.setDate(dueDateRange.getDate() + 5);
    winston.info("dueDateRange...",dueDateRange);
    Checkout.findAll({
        where:{
           isReturned: false,
           dueDate: {
               $lte: moment(dueDateRange).add('minutes',global.timeOffset).toDate(),
               $gt: moment().add('minutes',global.timeOffset).toDate()
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
        /* let d = new Date();
        d.setDate(checkoutInfo.lastAlertSentOn); */
        
        winston.info("Alert sent on..",moment(checkoutInfo.lastAlertSentOn).format("DDMM"));
        let lastAlertSentOn = moment(checkoutInfo.lastAlertSentOn);
        //checkoutInfo.lastAlertSentOn
        if(checkoutInfo.lastAlertSentOn!== null && lastAlertSentOn.diff(moment().add('minutes',global.timeOffset),'hours' > 0)){
            winston.info("Alert for today aleady sent..",lastAlertSentOn);
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
        checkoutInfo.set('lastAlertSentOn',moment(new Date()).format());
        checkoutInfo.save();
        sendDueDateWarningMail(checkoutInfo);
    
}

let checkHolds = () => {
    
    Hold.findAll({
        where:{
            isActive: true
        }
    })
    .then((holds) => {
        if(holds && holds.length > 0){
            winston.info("Active holds found...",holds.length);
            holds.forEach(hold => {
                eventEmitter.emit('processHold',hold);    
            });
        }
        else{
            winston.info("No Active holds found...");
        }
    })
        
}

let processHold = (holdInfo) =>{
    winston.info("Process hold event received",holdInfo.get({plain:true}));
    
    let endDate =moment(holdInfo.endDate).format("DD");
    //winston.info("Hold end date...",endDate);
    //winston.info("Hold end date moment...",moment(holdInfo.endDate));
    if(endDate <= moment().format("DD")){
        winston.info("Hold expired...",holdInfo.id);
        holdInfo.set('isActive',false);
        holdInfo.save()
        .then((h)=>{
            winston.info("Hold updated...",holdInfo.id);
            Book.findOne({
                where:{
                    id: holdInfo.bookId
                }
            })
            .then((book)=>{
                if(book){
                    eventEmitter.emit('bookAvailable',book);            
                }
            })
        });
    } 
    
}


let sendDueDateWarningMail = (checkoutInfo) => {
    let mailOptions = {};
    mailOptions.subject = "Book due notice";
    let remainingDays = moment(checkoutInfo.dueDate).diff(moment().add('minutes',global.timeOffset),'days');
    let mailText = ["Hi,","\nBelow book is due in "+remainingDays +" day(s):\n"];
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

eventEmitter.on('processHold', processHold);

eventEmitter.on('bookAvailable', eventReceivers.onBookAvailable);

exports.start =  start;

