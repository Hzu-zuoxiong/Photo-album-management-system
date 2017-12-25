//引入文件包
var fs = require("fs");

//获得所有相册的文件夹
//函数的callback中有两个参数，一个是err，另一个是存放所有文件夹名字的array
exports.getAllAlbums = function(callback) {
	fs.readdir("./uploads", function(err, files) {
		if(err) {
			callback("没有找到uploads文件", null);
			return;
		}
		var allAlbums = [];
		(function iterator(i) {
			//i=files.length时，遍历结束，获得文件夹名字的数组
			if(i == files.length) {
				callback(null, allAlbums);
				return;
			}
			fs.stat("./uploads/" + files[i], function(err, stats) {
				if(err) {
					callback("没有找到文件" + files[i], null);
					return;
				}
				if(stats.isDirectory()) {
					allAlbums.push(files[i]);
				}
				iterator(i + 1);
			});
		})(0);
	});
};

//通过文件名，得到所有图片
exports.getAllImagesByAlbumName = function (albumName, callback) {
	fs.readdir("./uploads/" + albumName, function(err, files) {
		if(err) {
			callback("没有找到uploads文件", null);
			return;
		}
		var allImages = [];

		(function iterator(i) {
			if(i == files.length) {
				// console.log("allImages");
				callback(null, allImages);
				return;
			}
			fs.stat("./uploads/" + albumName + "/" + files[i], function(err, stats) {
				if(err) {
					callback("找不到文件" + files[i], null);
					return;
				}
				if(stats.isFile()) {
					allImages.push(files[i]);
				}
				iterator(i + 1);
			});
		})(0);
	});
};