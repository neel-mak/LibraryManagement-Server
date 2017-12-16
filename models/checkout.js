//TODO: replace with actual model


var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {

    var Checkout = sequelize.define('Checkout', {
        bookId: {type: Sequelize.STRING, field: 'book_id'},
        patronId: {type: Sequelize.INTEGER, field: 'patron_id'},
        checkoutDate: {type: Sequelize.DATE, field: 'checkout_date'},
        dueDate: {type: Sequelize.DATE, field: 'due_date'},
        renewCount:{type: Sequelize.INTEGER, field: 'renew_count'},
        currentFine: {type: Sequelize.INTEGER, field: 'current_fine'},
        isReturned: {type: Sequelize.BOOLEAN, field: 'is_returned'},
        alertCount: {type: Sequelize.INTEGER, field: 'alert_count'},
        lastAlertSentOn: {type: Sequelize.INTEGER, field: 'last_alert_sent_on'}
    },{
        tableName: 'checkouts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
        

    return Checkout;

};
