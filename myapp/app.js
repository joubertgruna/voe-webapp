var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require('express-fileupload');


var indexRouter = require('./routes/index');
var webSiteRouter = require('./routes/webSite');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Configuração do middleware para o upload de arquivos
app.use(fileUpload());
// Serve o diretório 'uploads' de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'routes', 'uploads')));

app.use('/admin', indexRouter);
app.use('/', webSiteRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// Captura 404 e encaminha para o manipulador de erro
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Manipulador de erros
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
  });
});



// error handler
app.use(function(err, req, res, next) {
  console.error(err); // Adicionando esta linha para imprimir o erro no console
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
