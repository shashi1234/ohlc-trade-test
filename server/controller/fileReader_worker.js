/**
 * Worker Thread to read trades.json file line byline and pass to FSM for further computation of OHLC packets.
 * @requires worker_threads - Module which provides the communication channel via MessageChannel 
 * parentPort - to communicate with parent thread
 * @requires fs - module is used read the json file stream
 * @requires readline - module is being utilized t read the json data line by line
 */

const { MessageChannel, parentPort } = require('worker_threads');
const readline = require('readline');
const fs = require('fs');
const { port1: socketWorkerPort, port2: fileRederPort } = new MessageChannel();

let fsm_worker;

/**
 * Pass the fileRederPort to main thread to establish the message channel between fsm_worker thread
 */
parentPort.postMessage({
    port: fileRederPort
}, [fileRederPort]);

/**
 * Listener to listen the 'message' event from socket_worker thread to accept 
 * and pass the port to fsm_worker thread to establish the communication channel.
 */
parentPort.on('message', value => {    
    if(value.port) {
        fsm_worker = value.port;
    }
})

/**
 * @async
 * @function readDataFromJSONFile
 * @param {object} subscription - subcription data
 * @return {Promise<object>} trades json data line by line
 * @description Reads the Trades data input (line by line from JSON), 
 * and sends the packet to the FSM (Finite-State-Machine) thread.
 */
async function readDataFromJSONFile (subscription) {
    const stream = fs.createReadStream('./assets/trades.json');
    const readInterface = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
    })
    return new Promise(resolve => {
        stream.once('error', _ => resolve(null));        
        readInterface.on('line', line => {
            setTimeout(() => {
                processTradeByLine(subscription, JSON.parse(line))
            }, 200);
        });
        readInterface.on('close', () => console.log('close'));
    });
}

/**
 * @function processTradeByLine
 * @param {object} input - subscription data
 * @param {object} data - trades packet data (line by line)
 * @description receive data from readDataFromJSONFile, filter for symbol and pass the data for processing.
 */
const processTradeByLine = (subscription, data) => {    
    if(subscription.symbol == data.sym) {
        let messageData = {
            subscription: subscription,
            data: data
        }        
        fsm_worker.postMessage(messageData);
    }
}

/**
 * Event listenr to receive subcription data from socket_worker thread and pass for reading trades data from file.
 */

socketWorkerPort.on('message', subscription => {    
    readDataFromJSONFile(subscription);
})