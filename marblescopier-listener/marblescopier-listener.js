// Chalk for colored text output
const chalk = require('chalk');
// HTTP & websocket to let browser hook into us
const http = require('http');
const webSocketServer = require('websocket').server;

require('../settings.js')

process.title = "Marbles Race Result Paste Listener"
console.log('Marblescoper paste data listener')
console.log('Ctrl + C to quit')
console.log('Awaiting automatically pasted data...\n\n')

// Setup CLI to accept pasted input
const readline = require('readline');
const cli = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

cli.on('close', function() {
	console.log('\nExiting...');
	process.exit(0);
});

var dataBuffer = []
var currentResults = ""
var currentResultsReady = false
var wsConnections = []


function sendData() {
	// Only send if we have a full dataset ready to go
	if (currentResultsReady) {
		wsConnections.forEach(function(connection){
			connection.sendUTF(JSON.stringify({rawResults: currentResults}));
			console.log(chalk.green('[ Data sent to web browser session ]'))
		});
	}
}

// Handler for each line of input to the CLI window
cli.on('line', (input) => {
	// We got a blank line - that was the end of the data output so we should process it
	if(input == ""){
		// Make sure we got data and not just some extraneous presses of the enter key
		if(dataBuffer.length>0){
			console.log(chalk.green('[ End of race data detected, processing ]'))

			// Update for Marbles Nov 2022 data format change
			parsedDataBuffer = []
			dataBuffer.forEach(line => parsedDataBuffer.push(line.split("\t")[0]))

			currentResults = parsedDataBuffer.join('\n')

			// Clear the buffer
			dataBuffer = []

			// Set flag that we have a complete dataset ready to be picked up by the browser
			currentResultsReady = true

			// Send data to any connections
			sendData()

		}
	}
	else{
		// Add the data to the buffer until we have the full result list
		dataBuffer.push(input)
	}
})

// Setup HTTP server to listen for browser data requests
const httpServer = http.createServer();

const wsServer = new webSocketServer({
	httpServer: httpServer
})

// 'request' event is a connection request
wsServer.on('request', function(request) {
	console.log(chalk.green('[ Web Browser connected ]'))

	// Accept the connection to us
	const connection = request.accept(null, request.origin);
	
	// Add connection to our list so we can send data to it later
	wsConnections.push(connection);

	// Remove connection from list once it closes
	connection.on('close', function() {
		wsConnections.splice(wsConnections.indexOf(connection), 1);
		console.log(chalk.red('[ Web Browser disconnected ]'))
	})

	// Handle incoming message
	connection.on('message', function incoming(data) {
		// Only handle UTF-8 (i.e. non-binary) messages
		if(data.type != 'utf8') return;
		
		try{
			var parsedData = JSON.parse(data.utf8Data)
		}
		catch(e){
			console.error(chalk.red(`Invalid JSON payload from Websocket: ${data.utf8Data}`))
			return
		}

		// Wait for browser app to acknowledge receipt of the data before wiping the data from memory
		if (parsedData.messageType=="dataACK"){
			currentResultsReady = false
			currentResults = ""
			console.log(chalk.green('[ Web Browser acklowledged data transfer ]'))
		}
	});

	// Send the new connection any pending data
	sendData()

});


// Start web server
httpServer.listen(config.databroker.websocketPort,'127.0.0.1');
