var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {

    var Hold = sequelize.define('Hold', {
        bookId: {type: Sequelize.STRING, field: 'book_id'},
        patronId: {type: Sequelize.INTEGER, field: 'patron_id'},
        startDate: {type: Sequelize.DATE, field: 'start_date'},
        endDate: {type: Sequelize.DATE, field: 'end_date'},
        isActive: {type: Sequelize.BOOLEAN, field: 'is_active'}
    },{
        tableName: 'holds',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
        

    return Hold;

};
