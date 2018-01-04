//这个模块封装了所有对数据库的常用操作

var MongoClient = require('mongodb').MongoClient;
var settings = require('../settings.js');

//连接数据库，将其封装成为内部函数
function _connectDB(callback) {
	//读取数据库URL
	var url = settings.dburl;

	//连接数据库
	MongoClient.connect(url, function(err, db) {
		if(err) {
			callback(err, null);
		}
		callback(err, db);
	});
}


//插入数据库
exports.insertOne = function(collectionName, json, callback) {
	_connectDB(function (err, db) {
		db.collection(collectionName).insertOne(json, function(err, results) {
			callback(err, results);
			db.close();
		});
	});
};



//删除单条数据
exports.deleteOne = function (collectionName, json, callback) {
	_connectDB(function (err, db) {
		db.collection(collectionName).remove(json, function(err, results) {
			callback(err, results);
			db.close();
		});
	});
};



//删除集合
exports.dropCollection = function(collectionName, callback) {
	_connectDB(function(err, db) {
		db.dropCollection(collectionName, function(err, result) {
			// console.log("集合已被删除");
			db.close();
		});
	});
};





//修改
exports.updateMany = function(collectionName, json1, json2, callback) {
	_connectDB(function(err, db) {
		db.collection(collectionName).updateMany(json1, json2, function(err, results) {
			callback(err,results);
			db.close();
		});
	});
};


//获取数据库全部信息条数
exports.getAllCount = function(collectionName, callback) {
	_connectDB(function(err, db) {
		db.collection(collectionName).count({}).then(function(count) {
			callback(count);
			db.close();
		});
	});
};

//查找数据，args是个对象，如{"sort":{"shijian":-1},"pageamount":20,"page":page} //即参数C
exports.find = function(collectionName, json, C, D) {
	var result = [];
	//参数个数判断
	if(arguments.length == 3) {
		//如果参数个数为3，则args没传进来，参数C为回掉函数
		var callback = C;
		//应该省略的条数
		var skipnumber = 0;
		//数目限制
		var limit = 0;
	}else if (arguments.length == 4) {
		var callback = D;
		var args = C;
		//应该省略的条数
		var skipnumber = args.pageamount * args.page || 0;
		//数目限制
		var limit = args.pageamount || 0;
		//排序方式
		var sort = args.sort || {};
	}else {
		throw new Error("参数传递错误，find函数的参数必须是3个或者4个。");
		return;
	}

	//连接数据库，查找数据
	_connectDB(function(err, db) {
		var cursor = db.collection(collectionName).find(json).skip(skipnumber).limit(limit).sort(sort);
		cursor.each(function(err, doc) {
			if(err) {
				callback(err, null);
				db.close();
				return;
			}
			if(doc != null) {
				result.push(doc);
			}else {
				callback(null, result);
				db.close();
			}
		});
	});

};
