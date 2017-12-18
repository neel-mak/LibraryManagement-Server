


const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const Book = models.Book;
const Checkout = models.Checkout;
const Waitlist = models.Waitlist;
const Hold = models.Hold;
const winston = require('winston');
const moment = require('moment');
const _ = require('underscore');
const crypto = require('crypto');
const config = require('../config/config');
const utils = require('../utils/util');
const mailer = require('../utils/email');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const eventReceivers = require('../utils/event-receivers');
const Op = Sequelize.Op;


router.post('/', (req, res) => {
    winston.info("req.body..",req.body);

    if (!req.body.email || !req.body.bookIds || req.body.bookIds.length == 0) {
        winston.info("userId/BookIds not present");
        return res.json({
            success: false,
            message: 'Please submit userId/BookIds'
        });
    }
    winston.info("finding user..",req.body.email);
    User.findOne({
        where: {email: req.body.email}
    }).
    then((user)=>{
        if(!!!user){
            winston.info("user not present..",req.body.email);
            return res.json({
                success: false,
                message: 'User not present'
            });
        }
        winston.info("Now finding books to return");

        //steps
        //1. Iterate through the book ids
        Book.update(
            { //2. increment available count
                numAvailableCopies: models.sequelize.literal('num_available_copies +1') 
            },
            {
                where: {
                    id:{
                        $in: req.body.bookIds
                    }
            }
        })
        .then((updatedRecords) => {
            if(updatedRecords){
                //3. Set isreturned = true for all those books in checkout
                Checkout.findAll({
                    where:{
                        patronId:req.body.patronId,
                        isReturned:false,
                        bookId:{
                            $in: req.body.bookIds
                        }
                    }
                }).
                then((checkouts)=>{
                    if(checkouts){

                        /* checkouts = checkouts.map( (r) => ( r.toJSON() ) );
                        winston.info("checkouts found..",checkouts); */
                        winston.info("Updating isReturned and current fine...");
                        checkouts.forEach(c => {
                            c.isReturned = true;
                            c.currentFine = calculateFine(c); //4. calculate and update fine
                            c.save();
                        });
                       //TODO: remove books from user.checkedoutBooks
                       let checkedoutBooks = user.get("checkedoutBooks");
                       
                       req.body.bookIds.forEach(bookId => {
                           checkedoutBooks.splice( checkedoutBooks.indexOf(bookId), 1 );
                       });
                       
                       winston.info("Updated checkedoutbooks array...",checkedoutBooks);
                       user.set("checkedoutBooks",null);
                       user.set("checkedoutBooks",checkedoutBooks);
                       user.save().then((u)=>{
                           if(u && u!==null){
                               winston.info("User updated...",u.get({plain:true}));
                           }
                       })
                        //5. send mail
                        Book.findAll({
                            where:{
                                id:{
                                    $in: req.body.bookIds
                                }
                            }
                        })
                        .then((books)=>{
                            books = books.map( (r) => ( r.toJSON() ) );
                            checkouts = checkouts.map( (r) => ( r.toJSON() ) );
                            //5. send mail
                            let returnInfo = sendBookReturnMail(checkouts,books,user);
                            
                            books.forEach(b => {
                                eventEmitter.emit('bookAvailable',b);    
                            });
                            
                            return res.json({
                                success: true,
                                message: "Successful transaction", //TODO: change the message. 
                                data:returnInfo
                            });
                        });
                    }
                })
            }
        })
        //future: check waitlist. If user present, insert hold. decrement the count.emit event bookavailable
    })
    
});


let sendBookReturnMail = (checkouts,books,user) =>{
    
    checkouts = _.map(checkouts,(c) => {
        let book = _.find(books,{id:c.bookId});
        c.book = book;
        return c;
    });
    winston.info(checkouts);

    let mailOptions = {};
    mailOptions.subject = "Your recent return details";
    let mailText = ["Hi,","\nBelow is your recent book(s) return information:\n"];
    mailText.push("----------------------------------------");
    for(let i=0;i<checkouts.length;i++){
        mailText.push((i+1) +". "+ checkouts[i].book.title + " by "+checkouts[i].book.author);
        mailText.push("Checkout time: "+moment(checkouts[i].checkoutDate).tz('America/Los_Angeles').format("MMMM Do YYYY, h:mm a"));
        mailText.push("Due date: "+moment(checkouts[i].dueDate).tz('America/Los_Angeles').format("MMMM Do YYYY"));
        mailText.push("Return date: "+moment().add(global.timeOffset,"minutes").tz('America/Los_Angeles').format("MMMM Do YYYY, h:mm a"));
        mailText.push("Total fine: $"+checkouts[i].currentFine+"\n\n\n");
        
        //add more details as required
    }
    mailText.push("----------------------------------------");
    mailText.push("Thank you,");
    mailText.push("Team MyLib");
    mailText = mailText.join("\n");
    mailOptions.text = mailText;
    winston.info("mail text..",mailOptions.text);
    mailer.sendMail(user,mailOptions);
    let returnInfo = checkouts;
    return returnInfo;
    
}

let calculateFine = (checkoutInfo) => {
    let today = moment().add(global.timeOffset,"minutes").toDate();
    let dueDate = checkoutInfo.dueDate;
    let hours = (today - dueDate) / 36e5;
    winston.info("Hours late",hours);
    let totalFine = 0;
    if(hours > 0){
        totalFine = Math.ceil(hours/24) * config.finePerDay;
    }
    winston.info("totalFine",totalFine);
    return totalFine;
}



let sendBookAvailableMail = (book,user,hold) =>{
    

    let mailOptions = {};
    mailOptions.subject = "Book with title "+book.title+" available for checkout";
    let mailText = ["Hi,","\nThe following book has become available and put on hold for you. :\n"];
    mailText.push("----------------------------------------");
    
    mailText.push((1) +". "+ book.title + " by "+book.author);
    mailText.push("Hold expires on: "+moment(hold.endDate).tz('America/Los_Angeles').format("MMMM Do YYYY"));
    
        
        //add more details as required
    
    mailText.push("----------------------------------------");
    mailText.push("Thank you,");
    mailText.push("Team MyLib");
    mailText = mailText.join("\n");
    mailOptions.text = mailText;
    winston.info("mail text..",mailOptions.text);
    mailer.sendMail(user,mailOptions);
    
}


eventEmitter.on('bookAvailable', eventReceivers.onBookAvailable);

module.exports = router;