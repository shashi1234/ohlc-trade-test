/**
 * @requires path: Module provides utilities to work with file & directory paths
 * @requires worker_threads: Module provides capability use threads to execute Javascript in parallel
 */

const path = require('path');
const { Worker: CreateWorkerThread } = require('worker_threads');

/**
 * @exports startWorkerThreads
 * @description Purpose is to create 3 worker threads to handle cpu intensive tasks in parallel 
 * keeping main thread fee for other operations to perform.
 */

module.exports = startWorkerThreads = () => {

    /**
     * Creates following worker threads
     * fileReader_thread
     * fsm_thread
     * socketConn_thread
     */

    const fileReader_thread = new CreateWorkerThread(path.join(__dirname, '../controller/fileReader_worker.js'));
    const fsm_thread = new CreateWorkerThread(path.join(__dirname, '../controller/fsm_worker.js'));
    const socketConn_thread = new CreateWorkerThread(path.join(__dirname, '../controller/socket_worker.js'));
    
    /**
     * Listener to listen the 'message' event from fileReader worker thread to accept 
     * and pass the port to socket worker thread to establish the communication channel.
     */

    fileReader_thread.on('message', data => {
        socketConn_thread.postMessage({
            port: data.port
        }, [data.port])
    })

    /**
     * Listener to listen the 'message' event from fsm_thread worker thread to accept 
     * and pass the port to fileReader_thread worker to establish the communication channel.
     */

    fsm_thread.on('message', data => {
        fileReader_thread.postMessage({
            port: data.port
        }, [data.port])
    })

    /**
     * Listener to listen the 'message' event from socketConn_thread worker thread to accept 
     * and pass the port to fsm_thread worker to establish the communication channel.
     */

    socketConn_thread.on('message', data => {
        fsm_thread.postMessage({
            port: data.port
        }, [data.port])
    })    
}