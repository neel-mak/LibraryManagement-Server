const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const Book = models.Book;
const winston = require('winston');
const config = require('../config/config');
const utils = require('../utils/util');


router.post('/add', (req, res) => {

        winston.info("Came to add book route");
    
        if (!req.body.author || !req.body.title || !req.body.numOfCopies) {
            winston.info("Author / Title / Num of Copies not present");
            return res.json({
                success: false,
                message: 'Please enter bookId,author,title and numOfCopies'
            });
        }
           
        let book = {
            bookId: utils.generateUUID(),
            author : req.body.author,
            title : req.body.title, 
            numOfCopies : req.body.numOfCopies,
            callNumber : (req.body.callNumber || null),
            publisher : (req.body.publisher || null),
            yearOfPublication : (req.body.yearOfPublication || null),
            locationInLibrary : (req.body.locationInLibrary || null),
            currentStatus : (req.body.currentStatus || "Available"),
            keywords : (req.body.keywords || []),
            coverageImage : (req.body.coverageImage || null),
            createdBy : (req.body.createdBy || null),
            updatedBy : (req.body.updatedBy || null),
            numAvailableCopies : (req.body.numAvailableCopies || req.body.numOfCopies),
            isbn : (req.body.isbn || [])
        }
        
                winston.info("Inserting book...");
                Book.create(book)
                .then((book)=>{
                    if(book){
                        winston.info("Book Inserted..",book.bookId);
                        return res.json({
                            success: true,
                            message: 'Successfully Inserted!',
                            data:book
                        });
    
                    }
                })
    });
    
    module.exports = router;