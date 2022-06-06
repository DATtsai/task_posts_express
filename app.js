const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const uploadRouter = require('./routes/upload');

const {uncaughtException, unhandledRejection} = require('./service/processHandle');
const {resErrorDev, resErrorProd} = require('./service/resHandle');

process.on('uncaughtException', uncaughtException); // 程式crash的錯誤處理，紀錄錯誤後關閉process

const connectMongoDB = require('./connection/mongoDb');
connectMongoDB();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/upload', uploadRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // next(createError(404));
  res.status(404).send({status: 'fail', message: '404頁面，找不到該路由'});
});

// error handler
app.use(function(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  // development環境
  if(process.env.NODE_ENV === 'dev') { 
    return resErrorDev(res, err);
  }
  // prodcution環境
  // 特定錯誤類型，可重新定義預期錯誤資訊
  if(err.name === 'ValidationError') {
    err.message = '欄位填寫錯誤，請重新檢查必填與格式！'
    err.isOperational = true;
    return resErrorProd(res, err);
  }
  if(err.statusCode === 401) { // auth未通過錯誤
    err.isOperational = true;
    return resErrorProd(res, err);
  }
  return resErrorProd(res, err);
});

process.on('unhandledRejection', unhandledRejection); // 補抓程式中所有Promise錯誤但未被處理到的catch

module.exports = app;
