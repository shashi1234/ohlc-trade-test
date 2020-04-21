# ohlc-trade-test
# Trading App: Analytical server "OHLC" time series based on the 'Trades' input dataset

# System details
It has two parts
1. Server Application - Analytical Server to read trades json and generates time series OHLC packets
2. Client Application - Fires subscription event and prints response in console

# Server Application

Server application comprises of following components:

1. Main file (app.js)
    - Contains logic to start the HTTP server.
    - Requires 'worker-communication' service module which spawns the worker threads and establish the communication channel between them.
    - Requires the 'appmetrics-dash', which provides the ui for keeping track of following metrics:
    cpu, memory etc.
    - You can run following url in browser to see the metrics dashboard (Once the server is up and running)


There are 3 threads in the server application
# fileReader_worker 

Responsibility
Reads the Trades data input (line by line from JSON)
Sends the filtered packet which was subscribe by user to the fsm_worker - FSM (Finite-State-Machine) thread.

Functions in Worker_1:
1. readDataFromJSONFile()
    This Function is used to read the data from JSON file (line by line). After reading it passes the data to another function named processTradeByLine().
2. processTradeByLine()
    This function filters the data based on user subscription and send the filtered packet to fsm_worker(FSM).

Listen to 'message' event to get the data from socket_worker thread.

# fsm_worker: (FSM) computes OHLC packets based on time interval subscribed by client.

Responsibility
Compute and generate OHLC packets based on the subscription and interval subscribed

Functions in fsm_worker:
1. processDataAndReturn()
    This function is used to calculate the OHLC Packets based on subscription and interval.
    Support to process and send packets back on following subscription:
        - Send OHLC packet on every trade - everyTrade: true
        - Send OHLC packet on close - everyTrade: false

Listen to 'message' event to get the data from fileReader_worker thread.
    
# socket_worker: (WebsocketThread) Client subscriptions come here. Maintains user subscription, and publishes the BAR OHLC data as computed in real time.

Responsibility
Establishes the socket connection and implement event listeners to satisfy the client subscriptions coming here.
Send the OHLC packet back to client by emitting event specific to subscribed user. 

Functions in socket_worker:
1. startSocketServer()
    This method uses the socket-io communication to establish the communication between clients . It is having two methods one to subscribe (listen) the user subscription data from client and another is used to emit(transfer) the output to user(client).
2. handleUserSubscriptions()
    Responsible for handling and maintaining the user subscriptions.

userSubscription is an event to listen the client subscription request.
foundUserDetails.userId is an event to emit the response to specific client who subscribed.
  

2. Client Application

socket.io-client library is used to establish the communication with server.

Connection is established with Server
After successful connection with server, client subscribes the userSubscription event by emiting the subscription request to server.

userDetails.userId is an event listener to listen the response at client end.


## Getting Started

Following are the details on running application locally on MAC machine. 

### Environment Details - Needs following environment to be setup on machine to run the system

Note : You can skip these steps if you already have Node and npm installed on your system.
 
1) Install node and npm:

* [NodeJs](https://nodejs.org/en/) - How to install node?

2) Install git

* [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) - How to install Git?

 
### Installing/ Running locally

1) Create and enter into a folder where you want to clone the source code.

2) Fetch the source code from my github repo

```
>git remote add origin https://github.com/shashi1234/ohlc-trade-test.git
```

```
>git pull origin master
```

4) Install all the modules required to run the given application with following command(do the following step in client and server folder separately)

```
>npm install
```

5) Run the Server application by using following command(should be in server folder)

```
>npm start
```

5) Run the client application by using following command(should be client folder)

```
>node client.js
```

## Built With

* [NPM](https://www.npmjs.com/) - Most of the modules are used
* [Node](https://nodejs.org) - Node JS
* [SocketIO](https://socket.io) - Library for Socket communication
* [worker_threads] - Library for Workers in NodeJS

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
