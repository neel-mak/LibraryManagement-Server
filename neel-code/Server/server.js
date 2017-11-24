// Include our packages in our main server file
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var port = 8081;


var config = require('./config/config')[env];

//TODO: uncomment this after adding DB details in config file
//var models = require('./models/index');
var winston  = require('winston');
require('winston-loggly');

/*winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true}); */

var express = require('express');
const expressJwt = require('express-jwt'); 

/* const isAuthenticated = require('./utils/auth-middleware'); */

app = express();

var bodyParser = require('body-parser');
var morgan = require('morgan');

var timeout = require('connect-timeout');


//var cronTab = require('./lib/cronTab');
//var cronJob = require('cron').CronJob;


process.on('unhandledRejection', function(e) {
  console.log(e.message, e.stack)
})



/* var unless = function(path, middleware) {
    return function(req, res, next) {
    	winston.info('path = ', req.path);
    	 var matched = path.filter(function(p){ return req.path.startsWith(p);});
        if (matched && matched.length > 0) {
            return next();
        } else {
            return middleware(req, res, next);
        }
    };
}; */

// if(config.cache && config.cache.type == 'Redis'){
// 	client = redis.createClient({
// 		host: config.cache.host,
// 		port: config.cache.port
// 	});
// }

app.use(timeout('1200s'));


app.use(function(req, res, next) {
				res.header("Access-Control-Allow-Origin", "*");
				res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");        
				res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
				res.header("Access-Control-Allow-Credentials", true);
				next();
		});


app.use(bodyParser.urlencoded({ limit: '100mb',extended: false }));
app.use(bodyParser.json({limit: '100mb'}));

app.use(morgan('combined'));

// Initialize passport for use
/* app.use(passport.initialize()); */

// Bring in defined Passport Strategy
/* require('./config/passport')(passport); */

/* app.use(unless(['/status','/v1/auth', '/v1/queries/'],expressJwt({secret : config.secret}))); */


// app.use(unless('/v1/auth',isAuthenticated));

app.get('/status', function(req,res){
	res.status(200);
	res.send('OK');
})

//app.use('/recalls', require('./routes/recalls'));



app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') { 
    res.status(401).send();
  }
});

const server  = app.listen(port);
server.timeout = 1200000;
winston.info('info','Your server is running in ' + app.get('env') + ' on port ' + port + '.');


//Sync Job running every hour
// const updateRecallsJob = new cronJob("* * * * *", function() {
//     //cron expression: min hour * * *
//     console.log("update recalls job start: " + new Date());
//     cronTab.updateRecallRecordsJob();
// }, null, false);

//updateRecallsJob.start();