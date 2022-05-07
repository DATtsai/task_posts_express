function success(res, payload) {
    res.status(200).send({
        status: 'success',
        payload
    })
} 

function error400(res, error) {
    res.status(400).send({
        status: 'fail',
        message: error
    })
}

function error500(res, error) {
    res.status(500).send({
        status: 'fail',
        message: error
    })
}

module.exports = { success, error400, error500 }