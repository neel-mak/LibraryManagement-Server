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
               $lte: dueDateRange,
               $gt: new Date()
           }
            //due date which is less than currentDate + 5
        }
    })
    .then((checkouts)=>{
        if(checkouts){
            winston.info("checkouts found...",checkouts.length);
            if(checkouts.length > 0){
                winston.info("Checkouts found. Processing them...");
                /* checkouts.forEach(checkout => {
                    eventEmitter.emit('processCheckout',checkout);    
                }); */
            }
        }
    })

}

let processCheckout = (checkoutInfo) =>{
    if(!!!checkoutInfo.lastAlertSentOn || checkoutInfo.alertCount === 0){
        winston.info("No alerts sent yet for checkout..",checkoutInfo.id);
    }
    else if(checkoutInfo.lastAlertSentOn && checkoutInfo.alertCount > 0){
        winston.info("Alerts have been sent for this checkout..");
        let d = new Date();
        d.setDate(lastAlertSentOn);
        //checkoutInfo.lastAlertSentOn
        if(alertCount >= 5){
            winston.info("Five alerts sent already. no need to send any more.");
            return;
        }
        
    }
}


eventEmitter.on('processCheckout', processCheckout);

exports.start =  start;

