## 1 使用Express-generator初始化项目
```
npm install express-generator -g
express --view=ejs articleM     // --view=ejs指定模板引擎是ejs
cd articleM
npm install
pnm start   //nodemon ./bin/www
```

## 2 详解express-generator脚手架
+ package.json:项目信息的描述文件
    + script属性里面可以配置npm的快捷命令
        + npm run 命令名称
    + cookie-parser:用于解析cookie会话数据
    + morgan:是一个日志工具
    + serve-favicon:用于设置网站的favicon
        + npm i serve-favicon -S
    + body-parser用于解析http请求体重的body数据
        + req.query 只能解析get请求的查询字符串
        + req.body 能解析post请求主体的信息
    + express-session:记录服务端用户的简单信息
        + 安装：npm i express-session -S

## 3 数据库集合结构
+ 在项目根目录里面新建db文件夹
    + npm i mongoose -S
    + 用于存放数据库连接和集合结构
    + connect.js:数据库连接文件
    + userModel.js:用户集合文件
    + articleModel.js:文章集合文件
> connect.js
```js
// 引入模块
const mongoose = require("mongoose");
// 连接数据库
mongoose.connect("mongodb://127.0.0.1/project",{})

var db = mongoose.connection;

db.on("error", function(){
    console.log("数据库连接错误")
})
db.once("open", function(){
    console.log("数据库连接成功")
})
```

> userModel.js
```js
const mongoose = require("mongoose");
let userSchema = mongoose.Schema({
    username:String,
    password:String,
    createTimne:Number
})
let userModel = mongoose.model("users",userSchema);

module.exports = userModel;
```

> articleModel.js
```js
const mongoose = require("mongoose");

let articleSchema = mongoose.Schema({
    title:String,
    content:String,
    createTime:Number,
    username:String
})

let articleModel = mongoose.model("articles",articleSchema);

module.exports = articleModel;
```

## 4 public目录和views目录结构改造
+ public
    + 包含stylesheets,images,javascripts等静态资源;
+ views
    + 所有html文件放入(除了error.ejs以外)
    + 后缀名改为ejs
    + 提取相同部分，利用include引入
        + <%-include("head",{})%>
        + <%-include("bar",{})%>
    + 改造css,js,img的连接地址，以public为根目录

## 5 路由说明
路由|功能|请求方式|入参|返回值|说明
:-|:-|:-|:-|:-|:-
/|编译index.ejs模板|get|page,size|返回index页面|无
/regist|编译regist.ejs模板|get|无|返回regist页面|无
/login|编译login.ejs模板|get|无|返回login页面|无
/write|编译write.ejs模板|get|id|返回write页面|登录后访问，有id是编辑，无id是新增页
/detail|编译detail.ejs模板|get|id|返回detail页面|无
/users/regist|注册业务|post|username，password，password2|重定向到/login，失败重定向到/regist
/users/login|登录业务|post|username,password|重定向|登录成功重定向到/,失败重定向到/login
/users/logout|退出登录业务|get|无|重定向|退出登录后重定向到/login
/articles/write|文章修改和新增业务|post|title,content,username,id|重定向|有id是修改业务，无id是新增业务，成功重定向/,失败重定向/write
/articles/delete|文章删除业务|get|id|重定向|失败成功都重定向到/
/articles/upload|文件上传业务|post|file|json|{err:0,msg:'图片路径'}

> 注意：除了/login和/regist以外，其他路由都需要登录以后才能访问

## 6 app.js
```js

const session = require("express-session");

// 配置session
app.use(session({
    secret: "sz2022xsy",
    resave:false,
    saveUinitialized:true,
    cookie:{
        maxAge:1000*60*60 //指定session的有效时长，单位是毫秒值
    }
}))

// 连接数据库
var db = require("./db/connect");

```

## 7 模板子路由
> routes/index.js

```js
const express = require("express");
let router = express.Router();

// 首页路由
router.get("/",(req,res)=>{
    res.render("index",{})
})

// 注册页路由
router.get("/regist",(req,res)=>{
    res.render("regist",{})
})

// 登录页路由
router.get("/login",(req,res)=>{
    res.render("login",{})
})

// 写文章、编辑文章页路由
router.get("/write",(req,res)=>{
    res.render("write",{})
})

// 详情页路由
router.get("/detail",(req,res)=>{
    res.render("detail",{})
}) 

module.exports = router;
```
> 注意：
+ 在这里把页面子路由完成以后，更新模板里面的'页面'链接:主要是超链接a的href属性
+ 更新app.js里面关于模板页的子路由配置，添加代码如下：
```js
 var indexRouter = require('./routes/index');//导入模板子路由
 app.use('/', indexRouter);//配置模板子路由
```

## 8 用户子路由
> routes/users.js
```js
const express = require('express');
let router = express.Router();
let userModel = require('../db/userModel')

/*
注册接口
    + 业务接口说明:注册业务
    + 请求方式:post请求
    + 入参:username,password,password2
    + 返回值:重定向,注册成功重定向到/login,失败重定向到/regist 
*/
router.post('/regist',(req,res,next)=>{
    // console.log(req.body);
    let {username,password,password2} = req.body;//解构赋值
    // 数据校验工作，在这里完成
    // 查询是否存在这个用户
    userModel.find({username}).then(docs=>{
        if(docs.length > 0){
            res.send('用户已存在')
            // 重定向
            // res.redirect('/regist')
        }else{
            // 用户不存在，开始注册
            let createTimne = Date.now();
            // 插入数据
            userModel.insertMany({
                username,
                password,
                createTimne
            }).then(docs=>{
                res.send('注册成功')
            }).catch(err=>{
                res.send('注册失败')
            })
        }
    })
});

/*
登录接口
    + 业务接口说明:登录业务
    + 请求方式:post请求
    + 入参:username,password
    + 返回值:重定向,注册成功重定向到/,失败重定向到/login
*/
router.post('/login',(req,res,next)=>{
    // 接收post数据
    let {username,password} = req.body;
    // 操作数据库
    userModel.find({username,password})
    .then(docs=>{
        if(docs.length > 0){
            // res.send('登录成功');
            // 登录成功以后，在服务端使用session记录用户信息
            req.session.username = username;
            req.session.isLogin = true;
            // console.log(req.session);
            res.redirect('/');
        }else{
            // res.send('用户名或密码错误')
            res.redirect('/login');
        }
    })
    .catch(function(){
        // res.send('登录失败');
        res.redirect('/login');
    })
});

/*
退出登录接口
    + 业务接口说明:退出登录业务
    + 请求方式:get请求
    + 入参:无
    + 返回值:重定向到/login
*/
router.get('/logout',(req,res,next)=>{
    // console.log(req.session);
    req.session.username = null;
    req.session.isLogin = false;
    // console.log(req.session);
    // res.send('退出登录成功');
    res.redirect("/login");
});

module.exports = router;
```

>注意：
+ 在这里把用户子路由完成以后，更新模板里面的用户业务链接
    + bar.js 里面 <a href="/users/logout">退出</a>
+ 更新app.js里面关于用户子路由配置，添加代码如下
```js
var usersRouter = require('./routes/users');//导入用户子路由
app.use('/users', usersRouter);//配置用户子路由
```

## 9 文章子路由
> routes/article.js
```js
const express = require("express");
const {findById} = require('../db/articleModel');
const fs = require('fs');
const path = require('path');
let router = express.Router();
var multiparty = require('multiparty');//处理文件上传
let articleModel = require('../db/articleModel');
/* 
文章修改和新增接口
    + 业务接口说明:文章修改和新增业务,登陆后才能访问
    + 请求方式:post请求
    + 入参:title,content,username,id
    + 返回值:重定向,有id是修改业务,无id是新增业务,成功重定向/,失败重定向/write
*/
router.post('/write',(req,res,next)=>{
    // 接收post数据
    let {title,content,username,id} = req.body;
    // 当前时间
    let createTime = Date.now();
    if(id){
        // 修改文章
        id = new Object(id);
        articleModel.updateOne({_id:id},{
            title,
            content,
            createTime,
            username
        }).then(data=>{
            res.send('文章修改成功')
            // res.redirect('/');
        }).catch(err=>{
            res.send('文章修改失败')
            // res.redirect('/write');
        })
    }else{
        // 新增文章
        // 插入数据库
        articleModel.insertMany({
            username,
            title,
            content,
            createTime
        }).then(data=>{
            res.send('文章写入成功')
            // res.redirect('/');
        }).catch(err=>{
            res.send('文章写入失败')
            // res.redirect('/write');
        })
    }
})

/* 
文章删除接口
    + 业务接口说明:文章删除业务
    + 请求方式:get请求
    + 入参:id
    + 返回值:成功失败都重定向到/
*/
router.get('/delete',(req,res,next)=>{
    let id = req.query.id;
    id = new Object(id);
    // 删除
    articleModel.deleteOne({_id:id})
    .then(data=>{
        // res.send('文章删除成功');
        res.redirect('/');
    }).catch(err=>{
        // res.send('文章删除失败');
        res.redirect('/');
    })
})

/* 
图片上传接口
    + 业务接口说明:图片上传业务
    + 请求方式:post请求(在postman里面使用body下的form-data)
    + 入参:file,使用的富文本编辑插件xheditor里面上传图片文件的name是filedata
    + 返回值:json格式，例如:{err:0,msg:'图片路径'}
    
*/
router.post('/upload',(req,res,next)=>{
    // 每次访问该接口，都新建一个form对象来解析文件数据
    var form = new multiparty.Form();
    form.parse(req,(err,field,files)=>{
        if(err){
            console.log('文件上传失败');
        }else{
            // console.log('----field----');
            // console.log(field);
            var file = files.filedata[0];
            // console.log('----file----');
            // console.log(file);
            // 读取流
            var read = fs.createReadStream(file.path);
            // 写入流
            var write = fs.createWriteStream(path.join(__dirname,"..",'public/imgs/',file.originalFilename));
            // 通过管道流，图片写入指定目录
            read.pipe(write);
            write.on('close',function(){
                console.log('图片上传完成');
                res.send({
                    err:0,
                    msg:'/imgs/' + file.originalFilename
                })
            })

        }
    })
})



module.exports = router;
```

>注意：
+ 在文章路由里面需要接收表单上传的文件，body-parser不擅长，我们使用multiparty模块
    + npm install multiparty
+ 在这里把文章子路由完成以后，更新模板里面的用户业务链接
    + index.ejs 里面 <a href="/articles/delete">删除</a>
+ 更新app.js里面关于用户子路由配置，添加代码如下
```js
    var articlesRouter = require('./routes/articles');//导入文章子路由
    app.use('/articles',articlesRouter);//配置文章子路由
```

## 10 使用postman测试所有接口


## 11 模板子路由-首页路由(/)
> 注意：
+ page和size需要设置默认值
+ sort表示排序
+ skip表示跳过
+ limit表示选取前几条数据
+ 需要在查询到的分页记录里面，给每个数据添加一个createTimeZH字段，里面是格式化好的时间
+ npm i moment -S
+ 在打印的时候是无法打印的
```js
const articleModel = require('../db/articleModel');
const moment = require('moment');
// 首页路由
router.get("/",(req,res)=>{
    // console.log(req.query);
    // 数据类型是number
    let page = parseInt(req.query.page || 1);//如果page没有传，默认是第一页
    let size = parseInt(req.query.size || 5);//如果size没有传，默认一页显示5条文章
    let username = req.session.username;
    // 第一步：查询文章总页数并计算总页数
    articleModel.find().count().then(total=>{
        // console.log(total);//total就是文章的总条数
        // 获取总页数
        var pages = Math.ceil(total/size);
        // 第二步：分页查询
        // page = 2&size = 5
        // 6-10;
        articleModel.find().sort({'createTime':-1}).skip((page-1)*size).limit(size)
        .then(docs=>{
            // console.log(docs);//docs不是传统意义的js数组，要使用slice()方法把它转换成js数组
            var arr = docs.slice();
            // console.log(typeof arr);
            for(var i = 0; i < arr.length; i++){
                // 原有的文档的字段值最好不要修改
                // 添加一个新的字段，来表示格式化的时间；
                arr[i].createTimeZH = moment(arr[i].createTime).format('YYYY-MM-DD HH:mm:ss')
            }
            // console.log(arr);
            res.render('index',{
                data:{
                    list:arr,
                    total:pages,
                    username
                }
            })
        })
        .catch(err=>{
            res.redirect('/');
        })
    })

})
```

## 12 完成模板-index.ejs
```js
<body>
    <%-include('bar',{username:data.username})%>

    <div class="list">

        <%data.list.map((ele,idx)=>{%>
          <div class="row">
            <span><%=(idx+1)%>></span>
            <span><%=ele.username%></span>
            <span><a href="/detail?id=<%=ele._id%>"><%=ele.title%></a></span>
            <span><%=ele.createTimeZH%></span>
            <span>
              <a href="/write?id=<%=ele._id%>">编辑</a>
              <a href="/articles/delete?id=<%=ele._id%>">删除</a>
            </span>
          </div>
        <%})%>

      <div class="pages">
          <%for(let i = 1; i < data.total; i ++){%>
            <a href="/?page=<%=i%>"><%=i%></a>
          <%}%>
      </div>

    </div>
  </body>
  ```

## 13 完成模板-login.ejs
```js
<form method="post" action="/users/login">
```

## 14 完成模板-regist.ejs
```js
<form method="post" action="users/regist">
```


## 15 模板子路由-写文章路由(/write)
```js
// 写文章、编辑文章页路由
router.get("/write",(req,res)=>{
    // 获取文章id
    var id = req.query.id;
    if(id){
        // 编辑
        id = new Object(id);
        // 用id查询
        articleModel.findById(id)
        .then(doc=>{
            console.log(doc)
            res.render('write',{doc,username:req.session.username})
        })
        .catch(err=>{
            res.redirect('/')
        })
    }else{
        // 新增
        var doc = {
            _id:"",
            username:req.session.username,
            title:"",
            content:""
        }
        res.render("write",{doc,username:req.session.username})
    }
    
})

```



## 16 完成模板-write.ejs
```js
write.ejs 里面
<body>

  <%-include("bar",{username:username})%>

  <div class="article">
    <form method="post" action="/articles/write">
      <%# POST请求不能使用query字符串的方式传值%>
      <%# 我们使用input隐藏域传值%>
      <input type="hidden" name="id" value="<%=doc._id%>">
      <input type="hidden" name="username" value="<%=doc.username%>">
      <input type="text" name="title" placeholder="<%=doc.title%>" value="<%=doc.title%>">
      <textarea name="content" class="xheditor"><%=doc.content%></textarea>
      <%if(doc._id){%>
        <input type="submit" value="修改">
      <%}else{%>
        <input type="submit" value="发布">
      <%}%>
      
      
    </form>
  </div>

  <script type="text/javascript" src="/xheditor/jquery/jquery-1.4.4.min.js"></script>
  <script type="text/javascript" src="/xheditor/xheditor-1.2.2.min.js"></script>
  <script type="text/javascript" src="/xheditor/xheditor_lang/zh-cn.js"></script>
  <script>
    $('.xheditor').xheditor({
      tools:'full',
      skin:'default',
      upImgUrl:'/articles/upload',
      html5Upload:false,
      upMultiple:1
    })
  </script>
</body>
```


## 17 模板子路由-详情页路由(/detail)
```js
// 详情页路由
router.get("/detail",(req,res)=>{
    var id = req.query.id;
    // 用id查询
    articleModel.findById(id)
    .then(doc=>{
        doc.createTimeZH = moment(doc.createTime).format('YYYY-MM-DD HH-mm-ss');
        res.render("detail",{
            doc,
            username:req.session.username
        })
    })
    .catch(err=>{
        res.send(err);
    })
    
}) 

module.exports = router;
```

## 18 完成模板-detail.ejs
```html
<body>

  <%-include("bar",{username:username})%>
  

  <div class="detail">
    <div class="title"><%=doc.title%></div>
    <div class='desc'>
      <span>作者：张三</span>
      <span>发布时间：<%=doc.createTimeZH%></span>
    </div>
    <div class="content"><%=doc.content%></div>
  </div>

</body>
```


## 19 优化
### 19.1 用户登录拦截
```js
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
```

### 19.2 设置编辑/删除权限
> 只有文章的作者和用户名相同的时候，才显示编译和删除按钮
```html
<span>
<%if(ele.username == data.username){%>
    <a href="/write?id=<%=ele._id%>">编辑</a>
    <a href="/articles/delete?id=<%=ele._id%>">删除</a>
<%}%>
              
</span>
```

### 19.3 用户密码加密
+ 登录注册优化
    + 对数据库的密码进行加密
    + npm i bcrypt -S
    + 通过明文产生密文
        + var bcrypt = require('bcrypt')
        + 密码密文 = bcrypt.hashSync(密码明文，加盐的字符串的长度)；
        + 把密码存入数据库
    + 检测密文是否由指定明文产生
        + bcrypt.compareSync(指定明文，密码密文)
        + 结果为true表示密文是指定明文产生的
        + 结果为false表示密文不是指定明文产生的

> /users/regist 注册业务路由
```js
router.post('/regist',(req,res,next)=>{
    // console.log(req.body);
    // 接收post数据
    let {username,password,password2} = req.body;//解构赋值
    // 密码不直接存入数据库，先加密，再存入数据库
    password = bcrypt.hashSync(password, 10);
    // 数据校验工作，在这里完成
    // 查询是否存在这个用户
    userModel.find({username}).then(docs=>{
        if(docs.length > 0){
            // res.send('用户已存在')
            // 重定向
            res.redirect('/regist')
        }else{
            // 用户不存在，开始注册
            let createTimne = Date.now();
            // 插入数据
            userModel.insertMany({
                username,
                password,
                createTimne
            }).then(docs=>{
                // res.send('注册成功')
                res.redirect('/login')
            }).catch(err=>{
                // res.send('注册失败')
                res.redirect('/regist')
            })
        }
    })
});
```


> /users/login 登录业务路由
```js
router.post('/login',(req,res,next)=>{
    // 接收post数据
    let {username,password} = req.body;
    // 操作数据库
    userModel.find({username})
    .then(docs=>{
        if(docs.length > 0){
            // 说明有这个用户产生
            // 检验数据库里面的密文是否由你输入的明文密码产生
            var result = bcrypt.compareSync(password,docs[0].password)
            if(result){
                // 登录成功以后，在服务端使用session记录用户信息
                req.session.username = username;
                req.session.isLogin = true;
                // console.log(req.session);
                // res.send('登录成功');
                res.redirect('/');
            }else{
                // res.send('密码错误')
                res.redirect('/login');
            }
            
        }else{
            // res.send('用户名不存在')
            res.redirect('/login');
        }
    })
    .catch(function(){
        // res.send('登录失败');
        res.redirect('/login');
    })
});
```