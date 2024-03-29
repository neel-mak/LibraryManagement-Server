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
const ISBNParser = require('isbn').ISBN;
const ISBNLookup = require('node-isbn');
const moment = require('moment-timezone');
const Hold = models.Hold;
const User = models.User;
router.post('/add', (req, res) => {

  winston.info("Came to add book route");

  if (!req.body.author || !req.body.title || !req.body.numOfCopies || !req.body.createdBy || !req.body.publisher) {
    winston.info("Author / Title / Num of Copies / CreatedBy not present");
    return res.json({success: false, message: 'Please enter bookId,author,title, numOfCopies, createdBy, Publisher'});
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
      lowerCaseTitle = book.title.toLowerCase();

      Book.findAll({
        where: {
          title: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('title')), 'LIKE', '%' + lowerCaseTitle + '%')
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
      case "byId":

        book.id = req.body.searchParameters.id;

        Book.findOne({
          where: {
            id: book.id
            }
          }).then((book) => {
          if (book) {
            return res.json({success: true, message: "book found", data: book});
          } else {
            winston.info("book not found");
            return res.json({success: false, message: "book not found", data: null})
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
          return res.json({success: false, message: "book not found", data: null})
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
          return res.json({success: false, message: "book not found", data: null})
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
          return res.json({success: false, message: "book not found", data: null})
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
      updatedBook.keywords = req.body.keywords || dbBook.keywords;
      updatedBook.callNumber = req.body.callNumber || dbBook.callNumber;
      updatedBook.publisher = req.body.publisher || dbBook.publisher;
      updatedBook.yearOfPublication = req.body.yearOfPublication || dbBook.yearOfPublication;


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

      if(updatedBook.numAvailableCopies < 0)
      {
        res.json({success:false, message: "Invalid quantity update, some books already checkedout"});
      } else {
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

      }) }
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
            res.json({success: true, message: "Book deleted"})
          })
        }
      }
      });

    });


router.post('/lookupISBN',(req,res)=> {
  winston.info("came to isbn");
  if(!req.body.isbn) {
    res.json({success:false,message:"ISBN not provided"});
  } else {
    winston.info("parsing isbn");
    var isbnValue = ISBNParser.parse(req.body.isbn);
    winston.info("done parsing");
    if(!isbnValue) {
      res.json({success:false,message:"Not a valid ISBN format, supported formats: 10a,10b,13a,13b"});
    }
    else {
      winston.info(isbnValue.asIsbn10());
      ISBNLookup.resolve(isbnValue.asIsbn10(),(err,book)=> {
        if(err)
        {
          winston.info(err);
          res.json({success:false,message:"book not found"});
        } else {
          foundBook = Book.build({
            title : book.title,
            author : book.authors[0],
            publisher : book.publisher,
            isbn: [isbnValue.asIsbn10()]
          });

          res.json({success : true, message: "Book found", data: foundBook});
        }
      });

    }
  }
});

router.get('/all',(req,res) => {
  Book.findAll({
    attributes: ['id','author','title','callNumber','publisher','locationInLibrary','numOfCopies','numAvailableCopies','currentStatus','keywords','coverageImage','isbn']
  }).
  then((books) => {
    if(books)
    res.json({success:true,message:"All books",data:books});
    else res.json({success:false,message:"No books found"});
  })
})

router.post('/myBooks',(req,res) => {
  if(!req.body.email || !req.body.patronId) {
    winston.info("userId/email not present");
    return res.json({
        success: false,
        message: 'Please submit patronId/BookIds'
    });
  }

  Checkout.findAll({
    where:{
      patronId:req.body.patronId,
      isReturned: false
    }
  })
  .then((checkouts)=>{
    if(checkouts){
      if(checkouts.length > 0){
        checkouts = checkouts.map( (r) => ( r.toJSON() ) );
        let bookIds = [];
        checkouts.forEach(c => {
          c.checkoutDate = moment(c.checkoutDate).format("MMMM Do YYYY");
          c.dueDate = moment(c.dueDate).format("MMMM Do YYYY");
          bookIds.push(c.bookId);
        });

        Book.findAll({
          where:{
            id:{
              $in: bookIds
            }
          }
        })
        .then((books)=>{
          winston.info("books..",books.length);
          if(books){
            let responseArr = _.map(checkouts,(c)=>{
              let book = _.find(books,{id:c.bookId});
              winston.info("Book..",book.title);
              c.book = book;
              return c;
            });
            winston.info("responseArr,,",responseArr)
            /* checkouts.forEach((c) => {
                let book = _.find(books,{id:c.bookId});
                 winston.info("Book..",book.title);
                c.book = book;
            }); */
            //winston.info("Book..",checkouts[0].book.title);
            return res.json({
                success: true,
                message:'Books found!',
                data: responseArr
            });
          }
          else{
              return res.json({
                success: true,
                data: [],
                message:"No books checkedout yet!"
            });
          }
        });

      }
      else{
        return res.json({
          success: true,
          data: [],
          message:"No books checkedout yet!"
        });
      }
    }
    else{
      return res.json({
        success: true,
        data: [],
        message:"No books checkedout yet!"
    });
    }
  })
});

router.post('/holds',(req,res) => {
  if(!req.body.email || !req.body.patronId) {
    winston.info("userId/email not present");
    return res.json({
        success: false,
        message: 'Please submit patronId/BookIds'
    });
  }

  Hold.findAll({
    where:{
      patronId:req.body.patronId,
      isActive: true
    }
  })
  .then((holds)=>{
    if(holds){
      if(holds.length > 0){
        holds = holds.map( (r) => ( r.toJSON() ) );
        let bookIds = [];
        holds.forEach(c => {
          c.startDate = moment(c.startDate).format("MMMM Do YYYY");
          c.endDate = moment(c.endDate).format("MMMM Do YYYY");
          bookIds.push(c.bookId);
        });

        Book.findAll({
          where:{
            id:{
              $in: bookIds
            }
          }
        })
        .then((books)=>{
          winston.info("books..",books.length);
          if(books){
            let responseArr = _.map(holds,(c)=>{
              let book = _.find(books,{id:c.bookId});
              winston.info("Book..",book.title);
              c.book = book;
              return c;
            });
            winston.info("responseArr,,",responseArr)
            /* checkouts.forEach((c) => {
                let book = _.find(books,{id:c.bookId});
                 winston.info("Book..",book.title);
                c.book = book;
            }); */
            //winston.info("Book..",checkouts[0].book.title);
            return res.json({
                success: true,
                message:'Holds found!',
                data: responseArr
            });
          }
          else{
              return res.json({
                success: true,
                data: [],
                message:"No books on hold for you!"
            });
          }
        });

      }
      else{
        return res.json({
          success: true,
          data: [],
          message:"No books on hold for you!"
        });
      }
    }
    else{
      return res.json({
        success: true,
        data: [],
        message:"No books on hold for you!"
    });
    }
  })
});

router.post('/waitlist',(req,res)=>{
  winston.info("waitlist requested...");
  if(!req.body.email || !req.body.patronId) {
    winston.info("userId/email not present");
    return res.json({
        success: false,
        message: 'Please submit patronId/BookIds'
    });
  }
  winston.info("finding user...");
  User.findOne({
    where:{
      id:req.body.patronId
    }
  })
  .then((user)=>{
    winston.info("finding user...");
    if(user){
      winston.info("finding user...",user.get({plain:true}));
      if(user.waitListBookIds && user.waitListBookIds.length  > 0){
        winston.info("user's waitlisted bookids...",user.waitListBookIds);
        Book.findAll({
          where:{
            id:{
              $in: user.waitListBookIds
            }
          }
        })
        .then((books)=>{
          winston.info("books..",books.length);
          if(books){
            return res.json({
                success: true,
                message:'Waitlisted books found!',
                data: books
            });
          }
          else{
              return res.json({
                success: true,
                data: [],
                message:"No waitlisted book found!"
            });
          }
        });

      }
      else{
        return res.json({
          success: true,
          data: [],
          message:"No waitlisted book found!"
        });
      }
    }
    else{
      return res.json({
        success: true,
        data: [],
        message:"No waitlisted book found!"
    });
    }
  })
  .catch((e)=>{
    winston.info("Error caught",e);
  });

});

module.exports = router;
