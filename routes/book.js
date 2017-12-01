const express = require('express');

const router = express.Router();
const Sequelize = require('sequelize');
const models = require('../models/index');
const Book = models.Book;
const winston = require('winston');
const config = require('../config/config');
const utils = require('../utils/util');
const Op = Sequelize.Op;
const async = require('async');
const _ = require('lodash');
const Checkout = models.Checkout;

router.post('/add', (req, res) => {

  winston.info("Came to add book route");

  if (!req.body.author || !req.body.title || !req.body.numOfCopies || !req.body.createdBy) {
    winston.info("Author / Title / Num of Copies / CreatedBy not present");
    return res.json({success: false, message: 'Please enter bookId,author,title, numOfCopies, createdBy'});
  }

  let book = {
    author: req.body.author,
    title: req.body.title,
    numOfCopies: req.body.numOfCopies,
    callNumber: (req.body.callNumber || null),
    publisher: (req.body.publisher || null),
    yearOfPublication: (req.body.yearOfPublication || null),
    locationInLibrary: (req.body.locationInLibrary || null),
    currentStatus: (req.body.currentStatus || "Available"),
    keywords: (req.body.keywords || []),
    coverageImage: (req.body.coverageImage || null),
    createdBy: (req.body.createdBy || null),
    updatedBy: (req.body.updatedBy || null),
    numAvailableCopies: (req.body.numAvailableCopies || req.body.numOfCopies),
    isbn: (req.body.isbn || [])
  }

  winston.info("Inserting book...");
  Book.create(book).then((book) => {
    if (book) {
      winston.info("Book Inserted..", book.id);
      return res.json({success: true, message: 'Successfully Inserted!', data: book});

    }
  })
});

router.post('/search', (req, res) => {
  winston.info("Came to search book");
  let book = {};

  if (!req.body.searchType) {
    winston.info("Search type not provided");
    return res.json({success: false, message: 'Please provide a searchType: byTitle / byISBN / byKeywords'});
  }

  if (!req.body.searchParameters) {
    winston.info("Search parameters empty");
    return res.json({
      success: false,
      message: 'Please provide search parameter for given searchType : ' + req.body.searchType
    });
  }

  winston.info("search by", req.body.searchType);
  switch (req.body.searchType) {

    case "byTitle":

      book.title = req.body.searchParameters.title;

      Book.findAll({
        where: {
          title: book.title
        }
      }).then((books) => {
        if (books && books.length > 0) {
          winston.info("book(s) found", book);
          return res.json({success: true, message: "book(s) found", data: books});
        } else {
          winston.info("book not found");
          return res.json({success: true, message: "book not found", data: null})
        }
      });
      break;

    case "byISBN":

      book.isbn = req.body.searchParameters.isbn;

      Book.findOne({
        where: {
          isbn: {
            $contains: [book.isbn]
          }
        }
      }).then((book) => {
        if (book) {
          return res.json({success: true, message: "book found", data: book});
        } else {
          winston.info("book not found");
          return res.json({success: true, message: "book not found", data: null})
        }
      });
      break;

    case "byKeywords":
      book.keywords = req.body.searchParameters.keywords;

      Book.findAll({
        where: {
          keywords: {
            $contains: [book.keywords]
          }
        }
      }).then((books) => {
        if (books && books.length > 0) {
          winston.info("book(s) found", book);
          return res.json({success: true, message: "book(s) found", data: books});
        } else {
          winston.info("book not found");
          return res.json({success: true, message: "book not found", data: null})
        }
      });
      break;

    case "byMultipleKeywords":
      book.keywords = req.body.searchParameters.keywords;
      //Initialize the array to be returned
      var finalResults = [];

      //Function for Each keyword search
      var findBooksByKeyword = function(singleKeyword, doneCallback) {

        //Search for one iteration object of the provided array
        Book.findAll({
          where: {
            keywords: {
              $contains: [singleKeyword]
            }
          }
        }).then((books) => {
          if (books && books.length > 0) {
            winston.info(books.length + " book(s) found for keyword :" + singleKeyword);

            books.forEach((book) => {
              var exists = _.find(finalResults, function(result) {
                return result.id == book.id;
              })
              if (!exists)
                finalResults.push(book)
              else
                winston.info(book + "found twice");
              }
            );
          } else {
            winston.info("search returned no results for keyword :" + singleKeyword);
          }
          return doneCallback(null, books);
        });
      }

      //Map over the provided array and perform database search for each and add to finalResults
      async.map(book.keywords, findBooksByKeyword, function(err, results) {

        //Once Everything is done...
        if (finalResults.length > 0) {
          return res.json({success: true, message: "Following books found", data: finalResults});
        } else {
          return res.json({success: false, message: "No books found", data: finalResults});
        }

      });
      break;
    case "byUpdater":
      book.updatedBy = req.body.searchParameters.updatedBy;

      Book.findAll({
        where: {
          updatedBy: book.updatedBy
        }
      }).then((books) => {
        if (books && books.length > 0) {
          winston.info("book(s) found", book);
          return res.json({success: true, message: "book(s) found", data: books});
        } else {
          winston.info("book not found");
          return res.json({success: true, message: "book not found", data: null})
        }
      });
      break;

    case "byCreator":
      book.createdBy = req.body.searchParameters.createdBy;

      Book.findAll({
        where: {
          createdBy: book.createdBy
        }
      }).then((books) => {
        if (books && books.length > 0) {
          winston.info("book(s) found", book);
          return res.json({success: true, message: "book(s) found", data: books});
        } else {
          winston.info("book not found");
          return res.json({success: true, message: "book not found", data: null})
        }
      });
      break;

    default:
      return res.json({success: false, message: "Search by provided type/parameter not supported"});

  }
});

router.post('/update', (req, res) => {
  let book = {};
  winston.info("Came to add update route");

  if (!req.body.id || !req.body.author || !req.body.title || !req.body.numOfCopies || !req.body.updatedBy) {
    winston.info("Mandatory parameters for updated not provided");
    return res.json({success: false, message: 'Please enter id,author,title, numOfCopies, updatedBy'});
  }

  book.id = req.body.id;

  Book.findOne({
    where: {
      id: book.id
    }
  }).then((dbBook) => {
    if(!dbBook) {
      return res.json({success: false, message: 'Book with provided id not found'});
    }
    else {
      let updatedBook = {};
      updatedBook.id = book.id;
      updatedBook.author = req.body.author;
      updatedBook.title = req.body.title;
      updatedBook.numOfCopies = req.body.numOfCopies;
      updatedBook.createdBy = dbBook.createdBy;
      updatedBook.updatedBy = req.body.updatedBy;
      updatedBook.locationInLibrary = req.body.locationInLibrary || dbBook.locationInLibrary;

      //Check for Updation in quantity
      if (req.body.numOfCopies != dbBook.numOfCopies) {
        updatedBook.numOfCopies = req.body.numOfCopies;
        //update the numOfAvailableCopies with the delta
        updatedBook.numAvailableCopies = req.body.numOfCopies != null
          ? dbBook.numAvailableCopies + (req.body.numOfCopies - dbBook.numOfCopies)
          : dbBook.numAvailableCopies;
        if (updatedBook.numAvailableCopies == 0)
          updatedBook.currentStatus = "Not Available";
        }
      updatedBook.isbn = req.body.isbn || dbBook.isbn;

      Book.update(updatedBook, {
        where: {
          id: book.id
        }
      }).then((updatedDbBook) => {
        if (!updatedDbBook) {
          return res.json({success: false, message: 'Something went wrong, could not update book with provided id'});
        } else {
          Book.findOne({
            where: {
              id: book.id
            }
          }).then((dbBook) => {
            if (dbBook) {
              return res.json({success: true, message: 'Book updated!', data: dbBook});
            } else {
              res.json({success: false, message: 'Something went wrong, could not update book with provided id'});
            }
          });
        }

      })
    }
  });
});

router.post('/delete', (req,res) =>{
  winston.info("came to delete");
   if (!req.body.id) {
    winston.info("Please provide book id");
    return res.json({success: false, message: 'Please enter id'});
  }
    Book.findOne({
      where: { id:req.body.id } 
    }).
    then((book)=> {
      winston.info("After searching");
        if(!book) {
          res.json({success:false, message: "Book with given id not found"});
        } else {
        //check if the book is checkedout or is valid for deletion
        if(book.numAvailableCopies != book.numOfCopies) {

                winston.info("Book not retured yet:"+book.numAvailableCopies+ " : "+book.numOfCopies);
                res.json({success: false, message: "Books cannot be deleted while checkedout by a patron"});
        } else {
          Book.destroy({
            where: {id:book.id}
          }).then ((response)=> {
            res.json({status: true, message: "Book deleted"})
          })
        }
      }
      });
    
    });


module.exports = router;
