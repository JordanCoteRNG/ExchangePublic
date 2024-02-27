let createError = require('http-errors');
let express = require('express');
let path = require('path');
let flash = require("connect-flash");
let cookieParser = require('cookie-parser');
const session = require('express-session');
let logger = require('morgan');
let database = require("./middleware/database");
const users = require("./models/user");


let indexRouter = require('./routes/index');
let loginRouter = require('./routes/login');
let registerRouter = require('./routes/register');
let homeRouter = require('./routes/home');
let logoutRouter = require("./routes/logout");
let profileRouter = require("./routes/profile");
let transferRouter = require("./routes/transfer");
let buyRouter = require("./routes/buy");
let buyCryptoRouter = require("./routes/buyCrypto");
let sellRouter = require("./routes/sell");
let MFAConfiguratorRouter = require("./routes/MFAConfigurator");
let secretSetupRouter = require("./routes/secretSetup");
let MFACheckRouter = require("./routes/MFACheck");

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'cryptomancer',
  saveUninitialized: true,
  resave: true
}));

app.use(flash());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/home', homeRouter);
app.use('/logout', logoutRouter);
app.use('/profile', profileRouter);
app.use('/transfer', transferRouter);
app.use('/buy', buyRouter);
app.use('/buyCrypto', buyCryptoRouter);
app.use('/sell', sellRouter);
app.use('/setupMFA', MFAConfiguratorRouter);
app.use('/secretSetup', secretSetupRouter);
app.use('/checkMFA', MFACheckRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

database.connect();

global.btcBankPrivateKey = "";
global.btcBankPublicKey = "";
global.ethBankPrivateKey = "";
global.ethBankPublicKey = "";

module.exports = app;
