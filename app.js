var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);
var indexRouter = require('./routes/index');

var usersRouter = require('./routes/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

io.on('connection', (socket) => {
  let socketId = socket.id;
  let clientIp = socket.request.connection.remoteAddress;
  console.log('a user connected ' + socketId + ' - ' + clientIp);
  io.on('connection', (socket) => {
    socket.broadcast.emit('chat message', 'Hello, ' + clientIp + '!');
  });
  socket.on('disconnect', () => {
    console.log('user disconnected ' + socketId + ' - ' + clientIp);
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', clientIp + ': ' + msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
