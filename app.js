var express = require("express");
var app = express();
var db = require("./models/db.js");
var formidable = require("formidable");
var ObjectId = require("mongodb").ObjectID;
//控制器
var router = require("./controller");
var session = require("express-session");

//使用session
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

//设置模板引擎
app.set("view engine", "ejs");

//路由中间件，静态页面
app.use(express.static("./public"));
app.use(express.static("./uploads"));
app.use("/avatar", express.static("./avatar"));

//首页,显示文件夹
app.get("/", router.showIndex);
//留言页面
app.get("/comment", function(req, res) {
	res.render("comment",{
		"login" : req.session.login ? true : false,
		"username": req.session.username ? req.session.username : "",
		"active": "留言"
	});
});
//相册页，显示文件夹内的图片
app.get("/:albumName", router.showAlbum);
//显示注册页面
app.get("/regist", router.showRegist);
//执行注册
app.post("/doregist", router.doregist);
//显示登陆页面
app.get("/login", router.showLogin);
//执行登陆
app.post("/dologin", router.dologin);
//更改密码页面
app.get("/change_password", router.change_password);
//进行改密
app.post("/changePassword", router.changePassword);

//删除图片信息
app.post("/deletePicture", function(req, res, next) {
	var form = new formidable.IncomingForm();   
	form.parse(req, function (err, fields) {	
		// console.log(fields);
		// console.log(fields.picture_name);
		var name = fields.picture_name.replace(/\s+/g,""); 
		if(fields.picture_name) {			
			console.log(fields.picture_name);
			console.log(name);
			//有传送数据则删除全部留言
			db.deleteOne("picture_management", {"picture_name": name}, function(err, result) {
				if(err) {
					console.log(err);
				}else {
					console.log("数据已成功删除！");
				}
			});
		}
		else {
			next();
			return;
		}
	});
});
//显示上传页面
app.get("/up", router.showUp);
app.post("/up", router.doPost);
//提交留言信息到数据库
app.post("/submit", function (req, res, next) {
	if(!req.session.login) {
		res.end("非法闯入，这个页面要求登陆！");
		return;
	}
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields) {
        //写入数据库
        db.insertOne("message_board", {
            "observer" : fields.observer,
            "observer_comment" : fields.observer_comment,
            "time" : new Date()
        }, function (err, result) {
            if(err){
            	// console.log("1");
                res.send({"result":-1}); //-1是给Ajax看的
                return;
            }
            res.json({"result":1});
        });
    });
});

//读取所有留言，供Ajax使用
app.get("/message", function(req, res, next) {
	db.find("message_board", {}, {"sort":{"time":-1}}, function (err, result) {
		res.json({"result": result});
	});
});

//删除留言信息
/*app.get("/delete", function(req, res) {
	var id = req.query.id;
	db.deleteMany("picture_system", {}, function(err, result) {
		res.redirect("comment");
	});
});*/

//删除所有留言信息
app.post("/delete", function(req, res, next) {
	if(!req.session.login) {
		res.end("非法闯入，这个页面要求登陆！");
		return;
	}
	var form = new formidable.IncomingForm();   //新建一个表单控件
	form.parse(req, function (err, fields) {	//通过req从前端页面拿到数据存放在fields里，然后通过
		// console.log(fields);					//回调函数，打印出fields数据，
		if(fields.delete == 'true') {			//判断数据是否存在或值相等
			// console.log("shanshanshan");
			//有传送数据则删除全部留言			//数据存在则删数据，不存在流下下一个路由
			db.dropCollection("message_board", function(err, result) {
				if(err){
					console.log(err);
				}
				res.render("comment");
			});
		}
		else {
			next();
			return;
		}
	});
});

//退出登陆
app.get("/exit", function(req, res, next) {
	req.session.login = false;
	req.session.username = "";
	res.send("1");	
});



//404页面
app.use(function(req, res) {
	res.render("err",{
		"login" : req.session.login ? true : false,
		"username": req.session.username ? req.session.username : ""
	});
});

app.listen(3000);