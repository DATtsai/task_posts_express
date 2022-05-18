// 打包非同步預先定義回傳錯誤處理
function handleErrorAsync(func) { // 寫法1
    return function (req, res, next) {
        func(req, res, next)
            .catch(error => next(error));
    }
}

// function handleErrorAsync(func) { // 寫法2
//     return async (req, res, next) => {
//         try{
//             await func(req, res, next);
//         }
//         catch(error) {
//             next(error);
//         }
//     }
// }

function success(res, payload) {
    res.status(200).send({
        status: 'success',
        payload
    })
} 

function appError(httpStatus, errMessage, next) {
    const error = new Error(errMessage);
    error.statusCode = httpStatus;
    error.isOperational = true;
    next(error);
}

function resErrorDev(res, error) { // development環境回傳錯誤格式處理
    console.log('非預期程式錯誤(dev)', error); // 記log
    res.status(error.statusCode).send({
        status: 'fail',
        message: error.message,
        error: error,
        stack: error.stack
    });
}

function resErrorProd(res, error) { // production環境回傳錯誤格式處理
    if(error.isOperational) {
        res.status(error.statusCode).send({
            status: 'fail',
            message: error.message
        });
    }
    else {
        console.log('非預期程式錯誤(prod)', error); // 記log
        res.status(500).send({
            status: 'fail',
            message: '伺服器錯誤，請連繫系統管理員'
        });
    }
}

module.exports = { handleErrorAsync, success, appError, resErrorDev, resErrorProd }