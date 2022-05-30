const sizeOf = require('image-size');
const { ImgurClient } = require('imgur');
const resHandle = require('../service/resHandle');

async function uploadImage(req, res, next) {
    console.log(req.files);
    if(!req.files.length) {
        return resHandle.appError(400, '未上傳檔案', next);
    }
    const dimensions = sizeOf(req.files[0].buffer); // 附加檔案的內容目前以buffer方式儲存
    if(dimensions.width  !== dimensions.height) {
        return resHandle.appError(400, '圖片尺寸不符合1:1', next);
    }
    const clinetUpload = new ImgurClient({
        clientId: process.env.IMGUR_CLIENT_ID,
        clientSecret: process.env.IMGUR_CLIENT_SECRET,
        refreshToken: process.env.IMGUR_REFRESH_TOKEN,
    })
    const response = await clinetUpload.upload({
        image: req.files[0].buffer.toString('base64'), // imgur套件上傳時，只接受base64格式，故先做轉換
        type: 'base64',
        album: process.env.IMGUR_ALBUM_ID,
    });
    console.log(response);
    let payload = {imgUrl: response.data.link};
    if(payload.imgUrl) {
        resHandle.success(res, payload);
    }
    else {
        resHandle.appError(500, '圖片上傳處理異常，請連繫管理者', next);
    }
}

module.exports = {
    uploadImage: resHandle.handleErrorAsync(uploadImage)
};