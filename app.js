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

let r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
let usersCounter = 0;

io.on('connection', (socket) => {
  usersCounter += 1;
  let socketId = socket.id;
  let clientIp = socket.request.connection.remoteAddress.match(r)[0];
  let avatarUrl = `https://avatars.dicebear.com/api/male/${clientIp}.svg`;
  let lastMessage = Date.now();
  let sHeaders = socket.handshake.headers;
  console.log('[%s:%s] CONNECT', sHeaders['x-forwarded-for'], sHeaders['x-forwarded-port']);
  console.log('a user connected ' + socketId + ' - ' + clientIp);
  socket.broadcast.emit('chat message', 'User ' + clientIp + ' joined chat! Users in chat: ' + usersCounter);
  socket.on('disconnect', () => {
    usersCounter -= 1;
    socket.broadcast.emit('chat message', 'User ' + clientIp + ' left chat! Users in chat: ' + usersCounter);
    console.log('user disconnected ' + socketId + ' - ' + clientIp);
  });
  socket.on('chat message', (msg) => {
    if(Date.now() - lastMessage < 300) {
      socket.emit('chat message', 'You are messaging too fast! Keep calm.');
    } else {
      lastMessage = Date.now();
      io.emit('chat message', `<img src="${avatarUrl}" style="max-width: 30px;">` + clientIp + ': ' + msg.replace(/(<([^>]+)>)/gi, ""));
    }
  });
});

server.listen(8880, () => {
  console.log('listening on *:8880');
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
