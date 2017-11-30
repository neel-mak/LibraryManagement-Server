


const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const Book = models.Book;
const Checkout = models.Checkout;
const winston = require('winston');
const moment = require('moment');
const crypto = require('crypto');
const config = require('../config/config');
const utils = require('../utils/util');
const mailer = require('../utils/email');
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
        models.sequelize.query("SELECT * FROM checkouts WHERE checkout_date :: date = '"+today+ "' ::date",{ type: models.sequelize.QueryTypes.SELECT})
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
                                    let dueDate = new Date();
                                    dueDate.setDate(dueDate.getDate() + 30);
                                    let childTransaction ={
                                        bookId:book.id,
                                        patronId:req.body.patronId,
                                        checkoutDate: new Date(),
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
    
});


let sendCheckoutMail = (booksArr, transactionArray, user) =>{
    

    let mailOptions = {};
    mailOptions.subject = "Your recent checkout details";
    let mailText = ["Hi,","\nBelow is your recent checkout information:\n"];
    mailText.push("----------------------------------------");
    for(let i=0;i<booksArr.length;i++){
        mailText.push((i+1) +". "+ booksArr[i].title + " by "+booksArr[i].author+"\n");
        mailText.push("Checkout time: "+moment(transactionArray[i].checkoutDate).format("MMMM Do YYYY, h:mm a"));
        mailText.push("Due date: "+moment(transactionArray[i].dueDate).format("MMMM Do YYYY") +"\n");
        transactionArray[i].book = booksArr[i];
        //add more details as required
    }
    mailText.push("----------------------------------------");
    mailText.push("Thank you,");
    mailText.push("Team MyLib");
    mailText = mailText.join("\n");
    mailOptions.text = mailText;
    winston.info("mail text..",mailOptions.text);
    mailer.sendMail(user,mailOptions);
    return transactionArray;
}

module.exports = router;