//TODO: replace with actual model


var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {

    var Recall = sequelize.define('Recall', {
        RecallID: {type: Sequelize.INTEGER, field: 'recall_id'},
        RecallNumber: {type: Sequelize.STRING, field: 'recall_number'},
        RecallDate: {type: Sequelize.DATE, field: 'recall_date'},
        Description: {type: Sequelize.STRING, field: 'description'},
        URL:{type: Sequelize.STRING, field: 'url'},
        Title: {type: Sequelize.STRING, field: 'title'},
        ConsumerContact: {type: Sequelize.STRING, field: 'consumer_contact'},
        LastPublishDate: {type: Sequelize.DATE, field: 'last_publish_date'},
        Products: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'products'},
        Inconjunctions: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'inconjunctions'},
        Images: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'images'},
        Injuries: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'injuries'},
        Manufacturers: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'manufacturers'},
        ManufacturerCountries: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'manufacturer_countries'},
        ProductUPCs: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'product_upcs'},
        Hazards: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'hazards'},
        Remedies: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'remedies'},
        Retailers: {type: Sequelize.ARRAY(Sequelize.JSON), field: 'retailers'},
    },{
        tableName: 'recalls',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return Recall;
};