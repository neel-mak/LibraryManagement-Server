


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
   // winston.info("models..",models.sequelize);
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
                    bookId:{
                        [Op.in] : req.body.bookIds
                    }
                }
            })
            .then((books) => {
                let unavailableBook = null;
                if(books){
                    books.forEach(book => {
                        if(book.numAvailableCopies == 0){
                            winston.info("Book unavailable",book);
                            unavailableBook = book;
                            break;
                        }
                    });
                    if(unavailableBook){
                        winston.info("Book with title "+unavailableBook.title+" is unavailable!");
                        return res.json({
                            success: false,
                            message: "Book with title "+unavailableBook.title+" is unavailable!"
                        });
                    }
                }
            })

            
           // winston.info("metadata...",metadata)
            
          })
        
    })
    
    
    
    
    
    
    

});


module.exports = router;