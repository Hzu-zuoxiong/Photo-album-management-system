//引包
var file = require("../models/file.js");
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");
var sd = require("silly-datetime");
var $ = require("jquery");
var path = require("path");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");

//显示首页
exports.showIndex = function(req, res, next) {
	file.getAllAlbums(function(err, allAlbums) {
		if(err) {
			//移交到下一个路由中间件
			next();
			return;
		}
		res.render("index", {
			"albums" : allAlbums,
			"login" : req.session.login ? true : false,
			"username": req.session.username ? req.session.username : "",
			"active": "首页"
		});
	});
}

//相册页
exports.showAlbum = function(req, res, next) {
	//获取get请求上的albumName
	var albumName = req.params.albumName;
	// console.log(albumName);
	//想模板页面传送imagesArray数组
	file.getAllImagesByAlbumName(albumName, function(err, imagesArray) {
		if(err) {
			// console.log(err);
			next();
			return;
		}
		// console.log(imagesArray);
		res.render("albums", {
			"albumName" : albumName,
			"images" : imagesArray,
			"login" : req.session.login ? true : false,
			"username": req.session.username ? req.session.username : "",
			"active": "相册"
		});
	});
}

//显示上传
exports.showUp = function(req,res){
    file.getAllAlbums(function(err,albums){
        res.render("up",{
            albums : albums,
			"login" : req.session.login ? true : false,
			"username": req.session.username ? req.session.username : "",
			"active": "上传"
        });
    });
};

//上传图片
exports.doPost = function(req, res) {
	if(!req.session.login) {
		res.end("非法闯入，这个页面要求登陆！");
		return;
	}
	var form = new formidable.IncomingForm();

	form.uploadDir = path.normalize(__dirname + "/../tempup/");
	// console.log("form_befor");
	form.parse(req, function(err, fields,files, next) {
		// console.log(fields);
		// console.log(files);
		if(err) {
			next();
			return;
		}

		//判断文件尺寸
		var size = parseInt(files.picture.size);
		if(size > 5 * 1024 * 1024) {
			res.send("图片尺寸应该小于5M");
			fs.unlink(files.picture.path);
			return;
		}

		//时间戳
		var ttt = sd.format(new Date(), 'YYYYMMDDHHmmss');
		//5位随机数
		var ran = parseInt(Math.random() * 89999 + 10000);
		//文件格式
		var extname = path.extname(files.picture.name);

		var folder = fields.folder;
		var oldpath = files.picture.path;
		//重新定义图片路径，
		var newpath = path.normalize(__dirname + "/../uploads/" + folder + "/" + ttt + ran + extname);
		fs.rename(oldpath, newpath, function(err) {
			if(err){
				res.send("改名失败");
				return;
			}
			res.send("成功");
		});

        //写入数据库
        db.insertOne("picture_management", {
            "picture_name" : ttt + ran + extname,
            "picture_url" : newpath,
            "picture_size" : files.picture.size,
            "picture_upload_time": new Date(),
            "folder_name": fields.folder
        }, function (err, result) {
/*            if(err){
            	// console.log("1");
                res.send({"result":-1}); //-1是给Ajax看的
                return;
            }
            res.json({"result":1});*/
        });
	});
}


//显示注册页面
exports.showRegist = function(req, res, next) {
	res.render("regist", {
		"login" : req.session.login ? true : false,
		"username": req.session.username ? req.session.username : "",
		"active": "注册"
	});
}
//进行注册，并将用户名与密码存入数据库
exports.doregist = function(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var username = fields.username;
		var password = fields.password;
		// console.log(username + " " + password);
		//查找数据库中是否存在这个人
		db.find("users", {"username" : username}, function(err, result) {
			if(err) {
				//服务器错误
				res.send("-3");
				return;
			}
			if(result.length != 0){
				//用户名被占用
				res.send("-1");
				return;
			}
			//用户名不被占用，且服务器正常运行
			//用户密码进行md5加密
			password = md5(md5(password) + "xiong");

			//将用户名及密码插入数据库
			db.insertOne("users", {
				"username" : username,
				"password" : password
			},function(err, result) {
				if(err) {
					//服务器错误
					res.send("-3");
					return;
				}
				//注册成功，写入session
				req.session.login = "1";
				req.session.username = username;
				res.send("1");
			});
		});
	});
}

//显示登陆页面
exports.showLogin = function(req, res, next) {
	res.render("login", {
		"login" : req.session.login ? true : false,
		"username": req.session.username ? req.session.username : "",
		"active": "登陆"
	})
}

//执行登陆
exports.dologin = function(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var username = fields.username;
		var password = fields.password;
		password = md5(md5(password) + "xiong");

		//查询数据库看看是否存在此用户
		db.find("users", {"username": username}, function(err, result) {
			if(err) {
				res.send("-5");
				return;
			}
			// console.log(result);
			//没有这个人
			if(result.length == 0) {
				res.send("-1");
				return;
			}
			//存在此用户名，则进行密码匹配
			if(password == result[0].password) {
				req.session.login = "1";
				req.session.username = username;
				res.send("1");
				return;
			} else {
				//密码错误
				res.send("-2");
				return;
			}
		});
	});
}

//显示更改密码页面
exports.change_password = function(req, res, next) {
	//必须保证登陆
	if(!req.session.login) {
		res.end("非法闯入，这个页面要求登陆！");
		return;
	}
	res.render("change_password",{
		"login": true,
		"username": req.session.username,
		"active": "更换密码"
	});
}

//更改密码
exports.changePassword = function(req, res, next) {
	if(!req.session.login) {
		res.end("非法闯入，这个页面要求登陆！");
		return;
	}
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		// console.log(fields);
		var oldpassword = fields.oldpassword;
		var newpassword = fields.newpassword;
		var username = req.session.username;
		// console.log(username + "  " + oldpassword + "  " + newpassword);
		oldpassword = md5(md5(oldpassword) + "xiong");
		newpassword = md5(md5(newpassword) + "xiong");
		//查找此用户，判断旧密码是否输入正确
		db.find("users", {"username": username}, function(err, result) {
			if(oldpassword == result[0].password) {
				//密码更改
				// console.log("与数据库中的密码相同");
				db.updateMany("users", {"username": username}, {
					$set: {"password": newpassword}
				}, function(err, results) {
					if(err) {
						console.log(err);
						return;
					}
					res.send("1");
					return;
				});
			}else{
				//原密码输入错误
				res.send("-1");
				return;
			}
		});
	});
}