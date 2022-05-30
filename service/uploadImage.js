const path = require('path');
const multer = require('multer');

const upload = multer({ // 將合法檔案附加到req.files上
    limits: {
        fileSize: 2*1024*1024 // 圖片大小限制
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase(); // 取得副檔案
        if(!(['.jpg', '.jpeg', '.png'].includes(ext))) {
            cb(new Error('檔案格式錯誤：僅接受jpg, jpeg, png之格式'))
        }
        cb(null, true); // 將檔案附加於req.files後往下傳
    }
}).any(); // any指任何檔案類型

module.exports = upload;