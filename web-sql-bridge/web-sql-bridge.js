// Chalk for colored text output
const chalk = require('chalk');
const path = require('path');

// https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
// Packages for HTTP API (Express)
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// MySQL Database Driver
const mysql = require('mysql');



require('../settings.js');

process.title = "Marbles Web SQL Bridge";
console.log('Marbles Web SQL Bridge');


// Setup CLI to accept input/output
const readline = require('readline');
const { connection } = require('websocket');
const cli = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});


// Check if we have MySQL DB backend enabled
function mysqlEnabled(){
	return config.mysqldatabase.enabled
}



// Trigger process exit on Ctrl + C
cli.on('close', function() {
	console.log('\nExiting...');

	// Close any pending databse connections/queries
	if(mysqlEnabled())
		dbPool.end();

	process.exit(0);
});


console.log('Ctrl + C to quit\n\n');

if(mysqlEnabled()){
	console.log('Setting up database connection...');

	var mysqlConnectionParams = {
		connectionLimit	: 1,
		host			: config.mysqldatabase.host,
		user			: config.mysqldatabase.username,
		password		: config.mysqldatabase.password,
		database		: config.mysqldatabase.dbname
	}

	if(config.mysqldatabase.sslEncryption){
		mysqlConnectionParams['ssl'] = config.mysqldatabase.sslOptions
	}

	var dbPool = mysql.createPool(mysqlConnectionParams);

	// connection event - new connection completed to database host
	dbPool.on('connection', function(dbCon){
		console.log(chalk.green(`Connected to database ${config.mysqldatabase.host}/${config.mysqldatabase.dbname} as ID ${dbCon.threadId}.`));
	});

	// enqueue event - waiting for free connection to execute query
	dbPool.on('enqueue', function(){
		console.log(chalk.yellow('Waiting for available database connection.'));
	});

	
	function mysqlQueryErrorLogger(err){
		console.error(chalk.red(`Error on MySQL database: ${err.code} ${err.sqlMessage}`));
	}


	// Verify database connection will work before trying to use it and start rest of app
	console.log('Testing database connection...');

	dbPool.getConnection(function(err,dbCon){
		if(err){
			console.error(chalk.red(`Error connecting to MySQL database ${config.mysqldatabase.host}/${config.mysqldatabase.dbname}:`));
			console.error(chalk.red(`${err.code}: ${err.sqlMessage}`));
			cli.close();
		}
		else{
			dbCon.release();
		}
	});
}


// Set default content-type if its not explcitly set for a request
function defaultContentTypeMiddleware (req, res, next) {
	req.headers['content-type'] = req.headers['content-type'] || 'application/json';
	next();
}

app.use(defaultContentTypeMiddleware);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// HTTP Routes (Endpoints) for our API
// ====================================================================

var router = express.Router();		// create an instantiation of the express router


// Add middleware for all requests
router.use(function(req, res, next) {
	// Log details of every API request - may want to turn this down with debug flag if too noisy
	console.log("[%s] %s %s %s", new Date().toUTCString(), req.ip, req.method, req.originalUrl);
	next();
});

// Default ednpoint to verify that the API is up and running
router.get("/", function(req, res) {
	res.json({ message: "200 OK :D" });
});


// Maps Endpoint

router.route("/maps")
	.get(function(req, res) {

		if(mysqlEnabled()){
			var sql = "SELECT mapName, mapID FROM maps ORDER BY mapName DESC";
			
			var sqlQuery = dbPool.query(sql, function (error, results, fields) {
				if (error){
					mysqlQueryErrorLogger(error);
					res.status(500).json({'error': error.code, 'errorFull': `${error.code} (${error.errno}): ${error.sqlMessage}`, 'errorDescription': error.sqlMessage, 'sqlErrorNum': error.errno})
				}
				
				res.json(results);
			  });
		}
	});


// REGISTER OUR ROUTES -------------
// everything will be prefixed with /api
app.use("/api", router);
// We must serve the HTML page from web server due to CORS limitations (won't be able to call API)
app.use("/",express.static(path.join(__dirname, "../webui"),{index: "postgame-winner-info.html"}))
// Really hacky gross exposing settings.js remapped to the root to get legacy code working
// probably do something more elegant down the line during refactor
app.use("/settings.js",express.static(path.join(__dirname, "../settings.js")))



// START THE SERVER
// ====================================================================

app.listen(config.mysqldatabase.apiPort, '127.0.0.1');
console.log(chalk.green(`HTTP API Server started on port ${config.mysqldatabase.apiPort}`));
