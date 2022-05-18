function uncaughtException(error) {
    console.log('Uncaught Exception!');
    console.log(error);
    // console.log(error.name);
    // console.log(error.message);
    // console.log(error.stack);
    process.exit(1);
}

function unhandledRejection(error, promise) {
    console.log('未處理到的rejection:\n ', promise, '\nMessage:\n ', error);
}

module.exports = { uncaughtException, unhandledRejection };