var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs-then');

module.exports = function(sequelize, DataTypes) {
    
        var Book = sequelize.define('Book', {
            bookId: {type: Sequelize.STRING, field: 'book_id'},
            author: {type: Sequelize.STRING, field: 'author'},
            title: {type: Sequelize.STRING, field: 'title'},
            callNumber: {type: Sequelize.STRING, field: 'call_number'},
            publisher:{type: Sequelize.STRING, field: 'publisher'},
            yearOfPublication: {type: Sequelize.STRING, field: 'year_of_publication'},
            locationInLibrary: {type: Sequelize.STRING, field:'location_in_library'},
            numOfCopies: {type: Sequelize.INTEGER, field:'num_of_copies'},
            currentStatus: {type: Sequelize.STRING, field:'current_status'},
            keywords: {type: Sequelize.ARRAY(Sequelize.TEXT),field: 'keywords'},
            coverageImage : {type:Sequelize.BLOB, field:'coverage_image'},
            createdBy: {type: Sequelize.STRING, field: 'created_by'},
            updatedBy: {type: Sequelize.STRING, field: 'updated_by'},
            numAvailableCopies: {type: Sequelize.STRING, field:'num_available_copies'},
            isbn: {type: Sequelize.ARRAY(Sequelize.TEXT), field: 'isbn'}
        },{
            tableName: 'books',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            instanceMethods: {
              }
        });
            
    
        return Book;
    
    };