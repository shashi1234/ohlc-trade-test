/**
 * Finite State Machine (FSM)
 * Worker Thread to compute OHLC based on json input 
 * @requires worker_threads - Module which provides the communication channel via MessageChannel 
 * parentPort - to communicate with parent thread
 */

const { MessageChannel, parentPort } = require('worker_threads');
const { port1: fileReaderPort, port2: fsmPort } = new MessageChannel();

let socket_worker;
/**
 * @global 
 * @description holds the OHLC data with bar_chart data on close
 */
let tradesArray = []

/**
 * Pass the fsmPort to main thread to establish the message channel between socket_worker thread
 */
parentPort.postMessage({
    port: fsmPort,
}, [fsmPort]);

/**
 * Listener to listen the 'message' event from fsm_thread worker thread to accept 
 * and pass the port to fileReader_thread worker to establish the communication channel.
 */
parentPort.on('message', value => {
    if (value.port) {
        socket_worker = value.port;
    }
});

/**
 * @function processDataAndReturn
 * @param {object} value - trades data packet
 * @description Accepts the trades data packet and computes the OHLC packets 
 * based on 15 second time interval. Ability to send response on close or on every trade
 * Sends the OHLC packets to socket_worker to emit the same towards client.
 */

const processDataAndReturn = (value) => {
    const { subscription, data } = value;    
    const { interval, everyTrade } = subscription;
    let tradeAvailable = false;    
    let chartObj = {
        "key":data.sym,
        "items":[],
        "startTime":0,
        "bar_value":1,
        "closingValue":0
    }    

    /**
     * Holds the trades subscription
     */
    tradesArray.forEach(element => {
        if(element.key == chartObj.key) { 
            tradeAvailable = true;
            return false;
        }
    });
    
    if(!tradeAvailable){ tradesArray.push(chartObj) }    

    tradesArray.forEach(element => {
        let ohlcPkt = {};        
        if(element.key == chartObj.key) {
            if(element.items.length == 0 ) {
                ohlcPkt = {
                    "event":"ohlc_notify",
                    "symbol":data.sym,
                    "bar_num":element.bar_value,
                    "o":data.P,
                    "h": data.P,
                    "l":data.P,
                    "c":0,
                    "volume":data.Q + element.closingValue,
                }
                element.startTime = data.TS2;
            }else {
                const diffTimeInterval = (data.TS2 - element.startTime ) / 1e+9;
                ohlcPkt = {
                    "event":"ohlc_notify",
                    "symbol":data.sym,
                    "bar_num":element.bar_value,
                    "o":element.items[0].o,
                    "h": data.P > element.items[element.items.length - 1].h ? data.P : element.items[element.items.length - 1].h,
                    "l": data.P < element.items[element.items.length - 1].l ? data.P : element.items[element.items.length - 1].l,
                    "c": (diffTimeInterval <= interval) ? 0 : data.P,
                    "volume": data.Q + element.items[element.items.length - 1].volume,
                }                
            }
        }
        
        element.items.push(ohlcPkt);
        if(((data.TS2 - element.startTime ) / 1e+9) > interval) {
            if(everyTrade) {                 
                socket_worker.postMessage(ohlcPkt)
            }else {
                socket_worker.postMessage(element)
            }
            element.closingValue = ohlcPkt.volume;
            element.items = [];
            element.bar_value++;
        }else if(everyTrade) {
            socket_worker.postMessage(ohlcPkt);
        }
        return;
    });
}

/**
 * Event to listen message / data comming from fileReader_thread
 */

fileReaderPort.on('message', data => {    
    processDataAndReturn(data);
});