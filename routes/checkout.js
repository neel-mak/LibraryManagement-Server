


const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const Book = models.Book;
const Waitlist = models.Waitlist;
const Checkout = models.Checkout;
const winston = require('winston');
const moment = require('moment-timezone');
const crypto = require('crypto');
const config = require('../config/config');
const utils = require('../utils/util');
const mailer = require('../utils/email');
const Op = Sequelize.Op;
const _ = require('underscore');

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
        //TODO: Check if user has already checked out the same book and not returned yet.
        winston.info("Now checking if user has already checked out the same book and not returned yet...");
        Checkout.findOne({
            where:{
                patronId: req.body.patronId,
                bookId: {
                    $in: req.body.bookIds
                },
                isReturned: false
            }
        })
        .then((ck)=>{
            if(ck){
                winston.info("You have already checked out the same book. Please return the book first!");
                return res.json({
                    success: false,
                    message: 'You have already checked out one of the books in your cart. Please return the book first!'
                });
            }
        
            winston.info("Now checking user's total checkouts...");
            if(user.checkedoutBooks && user.checkedoutBooks.length == 9){
                //first check: How many books user has checkedout till now? >9 return 
                winston.info("Already checked out 9 books..",req.body.email);
                return res.json({
                    success: false,
                    message: 'You have already checked out 9 books!'
                });
            }
            if(user.checkedoutBooks && (user.checkedoutBooks.length + req.body.bookIds.length) > 9){
                //if totalcheckedout + new >9 return
                winston.info("total checked out books will be greater than 9",req.body.email);
                return res.json({
                    success: false,
                    message: 'You can only check out 9 books!'
                });
            }

            
            // select * from users where created_at ::date
            // = (select DATE 'today')
            //second check: How many books today? >=3 return
            winston.info("Now checking today's total checkouts...");
            let today = moment().format("YYYY-MM-DD");
            models.sequelize.query("SELECT * FROM checkouts WHERE checkout_date :: date = '"+today+ "' ::date AND patron_id ="+req.body.patronId,{ type: models.sequelize.QueryTypes.SELECT})
            .then((checkouts) => {
                // Results will be an empty array and metadata will contain the number of affected rows.
                winston.info("checkouts...",checkouts);
                if(checkouts && (checkouts.length == 3) || (checkouts.length + req.body.bookIds.length > 3)){
                    winston.info("You can only check out 3 books per day!");
                    return res.json({
                        success: false,
                        message: 'You can only check out 3 books per day!'
                    });
                }

                winston.info("Now checking if book is available");

                //select no of copies where id in ()
                // third check Number of copies of books == 0? return 
                Book.findAll({
                    where:{
                        id:{
                            $in : req.body.bookIds
                        }
                    }
                })
                .then((books) => {
                    let unavailableBook = null;
                    if(books){
                        for(let i=0;i<books.length;i++){
                            if(books[i].numAvailableCopies == 0){
                                //winston.info("Book unavailable",books[i]);
                                unavailableBook = books[i];
                                break;
                            }
                        }
                        
                        if(unavailableBook){
                            winston.info("Book with title "+unavailableBook.title+" is unavailable!");
                            return res.json({
                                success: false,
                                message: "Book with title "+unavailableBook.title+" is unavailable!"
                            });
                        }
                        //decrement the numAvailableCopies for each book
                        Book.update(
                            { numAvailableCopies: models.sequelize.literal('num_available_copies -1') },
                            { where: { 
                                id: {
                                    $in: req.body.bookIds
                                }
                                } 
                            }
                        )
                            .then((result) =>{
                            // handleResult(result)
                                winston.info("no of records updated:",result[0]);
                                //make entry into checkout table
                                Book.findAll({
                                    where:{
                                        id:{
                                            $in: req.body.bookIds
                                        }
                                    }
                                })
                                .then((books)=>{
                                    let transactionArray = [];
                                    books.forEach(book => {
                                        let dueDate = moment().add(global.timeOffset,'minutes');
                                        dueDate = dueDate.add(30,'days').toDate();
                                        //dueDate.setDate(dueDate.getDate() + 30);
                                        let childTransaction ={
                                            bookId:book.id,
                                            patronId:req.body.patronId,
                                            checkoutDate: moment().add(global.timeOffset,'minutes').toDate(),
                                            dueDate: dueDate,//moment(new Date()).add(30,'days').format(""),
                                            renewCount: 0,
                                            currentFine: 0,
                                            isReturned: false
                                        }
                                        transactionArray.push(childTransaction);
                                    });
                                    Checkout.bulkCreate(transactionArray)
                                    .then(()=>{
                                        //add these books to user table's checkedOutBooks array;
                                        User.findOne({
                                            where:{
                                                email: req.body.email
                                            }
                                        })
                                        .then(user=>{
                                            winston.info(user.checkedoutBooks);
                                            if(!!!user.checkedoutBooks)
                                                user.checkedoutBooks = [];
                                            user.checkedoutBooks.push.apply(user.checkedoutBooks,req.body.bookIds);
                                            user.save();

                                            //send mail with transcation details.
                                            let checkoutInfo = sendCheckoutMail(books,transactionArray,user);
                                            checkoutInfo.forEach(c => {
                                                c.checkoutDate = moment(c.checkoutDate).format("MMMM Do YYYY");
                                                c.dueDate = moment(c.dueDate).format("MMMM Do YYYY");
                                            });
                                            return res.json({
                                                success: true,
                                                message: "Successful transaction", //TODO: change the message. send the mail
                                                data: checkoutInfo
                                            });
                                        })
                                    })
                                })

                            })
                            
                            .catch(err =>
                                winston.info(err)
                            )

                    }
                })

                
            // winston.info("metadata...",metadata)
                
            })
            })
    })
    
});


router.post('/addToWaitlist',(req, res) => {
    winston.info("req.body..",req.body);
    
    if (!!!req.body.email || !!!req.body.bookId) {
        winston.info("userId/BookId not present");
        return res.json({
            success: false,
            message: 'Please submit userId/BookId'
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
        Waitlist.findOne({
            where:{
                bookId: req.body.bookId
            }
        }).
        then((waitlist)=>{
            if(!!!waitlist){
                winston.info("Waitlist does not exist for this book yet");
                let waitlistObj = {
                    bookId: req.body.bookId,
                    patronList: [
                        {
                            patronId: req.body.patronId,
                            waitlistDate: moment().add(global.timeOffset,'minutes').toDate(),//new Date(),
                            waiting: true
                        }
                    ]
                };
                Waitlist.create(waitlistObj).
                then((waitlist)=>{
                    if(waitlist){
                        if(!!!user.waitListBookIds || user.waitListBookIds === null){
                            user.waitListBookIds = [];
                        }
                        user.waitListBookIds.push(req.body.bookId);
                        user.save()
                        .then((u)=>{
                            if(u){
                                winston.info("waitlist entry created...");
                                return res.json({
                                    success: true,
                                    message: 'You have been added to the waitlist!'
                                });
                            }
                        });
                        
                    }
                    else{
                        winston.info("something went wrong");
                        return res.json({
                            success: false,
                            message: 'Please try again!'
                        });
                    }
                })
            }
            else{
                //waitlist exists
                winston.info("Waitlist already exists for this book",waitlist.get({plain:true}));

                let patronListArr = waitlist.get('patronList');
                
                let u = _.find(patronListArr,(p)=>{
                    return p.patronId == req.body.patronId
                });
                
                if(u){
                    winston.info("You are already on the waitlist for this book");
                    return res.json({
                        success: false,
                        message: 'You are already on the waitlist for this book'
                    });
                }

                patronListArr.push(
                    {
                        patronId: req.body.patronId,
                        waitlistDate: moment().add(global.timeOffset,'minutes').toDate(),//new Date(),
                        waiting: true
                    }
                );
                waitlist.set('patronList',null);
                waitlist.set('patronList',patronListArr);

                waitlist.save().
                then((w)=>{
                    if(w){
                        winston.info("waitlist entry created...",w.get({plain:true}));
                        if(!!!user.waitListBookIds || user.waitListBookIds === null){
                            user.waitListBookIds = [];
                        }
                        user.waitListBookIds.push(req.body.bookId);
                        user.save()
                        .then((u)=>{
                            if(u){
                                winston.info("waitlist entry created in user...");
                            }
                        });
                    }
                });
                winston.info("waitlist entry created...");
                return res.json({
                    success: true,
                    message: 'You have been added to the waitlist!'
                });
            }
        })
    });
});

//renew book

router.post('/renew',(req, res) =>{
    winston.info("req.body..",req.body);
    
        if (!!!req.body.email || !!!req.body.bookId || !!!req.body.patronId) {
            winston.info("userId/BookId not present");
            return res.json({
                success: false,
                message: 'Please submit userId/BookId'
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

            winston.info("Now checking renew count for the book...");

            Checkout.findOne({
                where:{
                    patronId: req.body.patronId,
                    bookId: req.body.bookId,
                    isReturned: false
                }
            })
            .then((c)=>{
                if(!!!c){
                    return res.json({
                        success: false,
                        message: 'Checkout record not found'
                    });
                }
                if(c.renewCount && c.renewCount >=2){
                    winston.info("You can renew a book only twice!");
                    return res.json({
                        success: false,
                        message: 'You can renew a book only twice!'
                    });
                }
                winston.info("Now checking if any waitlist exists for the book...");

                Waitlist.findOne({
                    where:{
                        bookId:req.body.bookId
                    }
                })
                .then((w) =>{
                    if(w && w.patronList && w.patronList.length > 0){
                        winston.info("Waitlist exists for this book, can not renwew");
                        return res.json({
                            success: false,
                            message: 'You can not renew this book as there is a waitlist for it'
                        });
                    }
                    winston.info("Now renewing...");
                    if(!!!c.renewCount)
                        c.renewCount = 0;
                    c.renewCount++;
                    let dueDate = c.get('dueDate');
                    winston.info("Old due date...",dueDate);
                    dueDate.setDate(dueDate.getDate() + 30);
                    winston.info("renewed due date...",dueDate);
                    c.set('dueDate',null);
                    c.set('dueDate',dueDate);
                    c.save()
                    .then((checkout)=>{
                        if(checkout){
                            winston.info("Book renewed!");
                            return res.json({
                                success: true,
                                message: 'Book successfully renewed!'
                            });
                        }
                    });
                })

            })
        });
});

let sendCheckoutMail = (booksArr, transactionArray, user) =>{
    

    let mailOptions = {};
    mailOptions.subject = "Your recent checkout details";
    let mailText = ["Hi,","\nBelow is your recent checkout information:\n"];
    mailText.push("----------------------------------------");
    for(let i=0;i<booksArr.length;i++){
        mailText.push((i+1) +". "+ booksArr[i].title + " by "+booksArr[i].author+"\n");
        mailText.push("Checkout time: "+moment(transactionArray[i].checkoutDate).tz("America/Los_Angeles").format("MMMM Do YYYY, h:mm a"));
        mailText.push("Due date: "+moment(transactionArray[i].dueDate).tz("America/Los_Angeles").format("MMMM Do YYYY") +"\n");
        transactionArray[i].book = booksArr[i];
        //add more details as required
    }
    mailText.push("----------------------------------------");
    mailText.push("Thank you,");
    mailText.push("Team SNAPLibrary");
    mailText = mailText.join("\n");
    mailOptions.text = mailText;
    winston.info("mail text..",mailOptions.text);
    mailer.sendMail(user,mailOptions);
    return transactionArray;
}

module.exports = router;