//TODO: replace with actual model


var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {

    var Waitlist = sequelize.define('Waitlist', {
        bookId: {type: Sequelize.STRING, field: 'book_id'},
        patronList: {type: Sequelize.ARRAY(Sequelize.JSONB), field: 'patron_list'},
    },{
        tableName: 'waitlists',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
        

    return Waitlist;

};
