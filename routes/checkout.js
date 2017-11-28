


const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const User = models.User;
const Book = models.Book;
const Checkout = models.Checkout;
const winston = require('winston');
const crypto = require('crypto');
const config = require('../config/config');
const utils = require('../utils/util');
const mailer = require('../utils/email');


router.post('/checkout', (req, res) => {

    if (!req.body.userId || !req.body.bookIds || req.body.bookIds.length == 0) {
        winston.info("userId/BookIds not present");
        return res.json({
            success: false,
            message: 'Please submit userId/BookIds'
        });
    }
    
    //first check: How many books user has checkedout till now? >9 return
    //second check: How many books today? >=3 return
    // third check Number of copies of books == 0? return 
    
    winston.info("finding user..",req.body.email);

});


module.exports = router;