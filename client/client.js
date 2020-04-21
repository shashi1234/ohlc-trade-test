const socketConn = require('socket.io-client');
const socketClient = socketConn.connect('http://localhost:8000');
const fs = require('fs');
let count = 0;
let userDetails = { 
    "userName" :"Shashikant Kalaskar", 
    "userId":"S19091984"
}

let eventDetails = {
    "event": "subscribe",
    "symbol": "ADAEUR",
    "interval": 15,
    "userId":"S19091984",
    "everyTrade": true
}

let userSubscription = {
    userData: userDetails,
    eventData: eventDetails
}

const printCurrentTime = (message) => {
    var currentdate = new Date(); 
    var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();

    console.log(message + datetime);    
}

socketClient.on('connected', (message) => {
    console.log('Connection Establish with Server', message);
    socketClient.emit('userSubscription', userSubscription);
    printCurrentTime('Reauest Time ');
})

socketClient.on(userDetails.userId, data => {
    count++;
    if(count == 1) {
        printCurrentTime('Response received Time ');
    }
    console.log('OHLC Data: ', data);
})