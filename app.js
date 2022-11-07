var createError = require('http-errors');//处理http错误
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');//处理cookie的模块
var logger = require('morgan');//打印日志模块
var session = require('express-session');//session是服务端存储用户信息的模块

var indexRouter = require('./routes/index');//导入模板子路由
var usersRouter = require('./routes/users');//导入用户子路由
var articlesRouter = require('./routes/articles');//导入文章子路由


// 连接数据库
var db = require('./db/connect');
// favicon
var favicon = require('serve-favicon');

var app = express();

// favicon配置
app.use(favicon(path.join(__dirname,'public','favicon.ico')));

// view engine setup 配置ejs模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));//在开发环境下的日志文件
// 配置body-parser以后，就可以使用req.body解析post请求主体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 使用cookie-parser中间件就可以解析cookie
app.use(cookieParser());

// 配置服务端session
app.use(session({
  secret: 'sz2022xsy',
  resave:false,
  saveUinitialized:true,
  cookie:{
      maxAge:1000*60*60 //指定session的有效时长，单位是毫秒值
  }
}))

// 配置静态路由
app.use(express.static(path.join(__dirname, 'public')));

// 用户登录拦截
// (可以只拦截get请求的，post请求最后也要重定向到get方式去新页面)
app.get("*",(req,res,next)=>{
  let {username} = req.session;//获取用户名
  let url = req.path;
  // console.log(url + "----" + username);
  if(url != '/login' && url != '/regist'){
    // 如果不是登录和注册，需要有用户名(是登录状态)
    if(!username){
      // 用户未登录
      res.redirect('/login');
    }else{
      next();
    }
  }else{
    next();
  }
  
})


// 配置子路由
app.use('/', indexRouter);//配置模板子路由
app.use('/users', usersRouter);//配置用户子路由
app.use('/articles',articlesRouter);//配置文章子路由


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

module.exports = app;
