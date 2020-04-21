/**
 * Worker Thread for extablishing socket connection on port 8000
 * @requires socket.io - Module to open a socket connection
 * @requires worker_threads - Module which provides the communication channel via MessageChannel 
 * parentPort - to communicate with parent thread
 */

const socketio = require('socket.io')(8000);
const { MessageChannel, parentPort } = require('worker_threads');
const { port1: fsmPort, port2: socketWorkerPort } = new MessageChannel();

/**
 * @global 
 * @description holds all the user subscriptions to serve request
 */
let userSubscriptions = [];
let file_reader;

/**
 * Pass the socketWorkerPort to main thread to establish the message channel between fsm_worker thread
 */
parentPort.postMessage({
    port: socketWorkerPort
}, [socketWorkerPort])

/**
 * listen to 'message' event from parent port with the port details of file_reader thread 
 * to send the subsription data for further processing
 */
parentPort.on('message', value => {    
    if(value.port) {
        file_reader = value.port;
    }
})

/**
 * @function handleUserSubscriptions
 * @param {object} subscription - user subscription data from client
 * @description persist the subscription data and pass the same to file_reader thread via postMessage
 */

const handleUserSubscriptions = (subscription) => {
    subscription['userFound'] = false;
    if(subscription.eventData.event.toLowerCase() == "subscribe") {                
        for(let userSubscription of userSubscriptions) {                    
            if(userSubscription.userData.userId == subscription.userData.userId && userSubscription.eventData.symbol == subscription.eventData.symbol) {
                subscription['userFound'] = true;
                break;
            }
        }
        if(!subscription['userFound']){
            userSubscriptions.push(subscription)
        }
        file_reader.postMessage(subscription.eventData);
    }
}

/**
 * @function emitResponseData
 * @param {object} subscriptionObject
 * @description function finds out the subscription available in userSubscriptions array or not
 */
const emitResponseData = (subscriptionObject) => {
    let flagUserFound = false;
    let foundUserDetails;
    
    for(let user of userSubscriptions) {
        const symbol = subscriptionObject.symbol || subscriptionObject.sym || subscriptionObject.key;
        if(user.eventData.symbol == symbol) {
            flagUserFound = true
            foundUserDetails = user.userData
            break;
        }
    }
    return {flagUserFound, foundUserDetails};
}

/**
 * @function startSocketServer
 * @description function to listen varion socket events and emit the response data 
 * received from fsm_thread to respective client
 */

startSocketServer = () => {    
    socketio.on('connection', (socket) => {        
        console.log('Connection established with Server');
        socket.emit('connected', 'Client connection established');
    
        socket.on('disconnect', () => console.log('Client Disconnected'));
    
        /**
         * Listen the userSubscription event from client.
         */
        socket.on('userSubscription', (subscription) => handleUserSubscriptions(subscription));

        /**
         * listener to receive message from fsm with computed OHLC result and emit the same to client
         */
        fsmPort.on('message', inputData => {            
            const { flagUserFound, foundUserDetails } = emitResponseData(inputData);
            if(flagUserFound) {
                socket.emit(foundUserDetails.userId, inputData);
            }
        });
    })
}

startSocketServer();