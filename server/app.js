/**
 * Module dependencies.
 * @requires express - Web application framework
 * @requires http
 * @requires startWorkerThreads - Module to create the worker threads
 * @requires appmetrics-dash - Check the performance metrics from application.
 */

const express = require('express');
const http = require('http');
const config = require('./config');
const app = express();
const startWorkerThreads = require('./service/worker-communication');
var dash = require('appmetrics-dash').attach()

app.get('/', (req, res) => {    
    res.send("Welcome to Analytical server to compute OHLC time series based on trades input dataset");    
})

/**
 * 
 * @function handleError
 * @param {Object} error Object with error code
 * @description Event listner fot HTTP server 'error' event
 */

function handleError(error) {
    if (error.syscall !== 'listen') {
      console.log(error.code + ' not equal listen');
      throw error;
    }        

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.log('3000 :elavated privileges required');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.log('3000 :port is already in use.');
        process.exit(1);
        break;
      default:
        console.log(error.code + ':some unknown error occured');
        throw error;
    }
}

/**
 * @function handleListeningEvent
 * @description Event listener for HTTP server 'listening' event.
 */
function handleListeningEvent() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
  startWorkerThreads();
}

/**
 * @description Create http server and listen on port no. 3000
 */

const server = http.createServer(app);
server.listen(config.port);
server.on('error', handleError);
server.on('listening', handleListeningEvent);