//TODO: replace with actual model


var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs-then');

module.exports = function(sequelize, DataTypes) {

    var User = sequelize.define('User', {
        email: {type: Sequelize.STRING, field: 'email'},
        password: {type: Sequelize.STRING, field: 'password'},
        universityId: {type: Sequelize.STRING, field: 'university_id'},
        userType: {type: Sequelize.STRING, field: 'user_type'},
        verificationCode:{type: Sequelize.STRING, field: 'verification_code'},
        isVerified: {type: Sequelize.BOOLEAN, field: 'is_verified'},
        checkedoutBooks:{type: Sequelize.ARRAY(Sequelize.STRING), field:'checkedout_books'},
        waitListBookIds:{type: Sequelize.ARRAY(Sequelize.INTEGER), field:'wait_list_bookids'}
    },{
        tableName: 'users',
        timestamps: true, 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        instanceMethods: {
            comparePassword: function(password, done) {
              console.log('inside comparePassword...');
              return bcrypt.compare(password, this.password).then(function(valid){
                return done(valid);
              });
            }
          }
    });
        
    User.beforeCreate(hashPasswordHook);
    User.beforeUpdate(hashPasswordHook);

    return User;

};

var hashPasswordHook = function(user, options) {
    if (!user.changed('password')) return;
    return bcrypt.hash(user.get('password'), 10).then(function (hash) {
      user.password = hash;
    });
  };
  