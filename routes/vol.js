var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');


router.get('/*', function(req, res, next){

	//志愿者活动相关流程
	fun.actChk(req.session.userid, function(SRing, EDUing){
		var flow = {
			SRing: SRing,
			EDUing: EDUing
		};
		req.flash('flow'); //flash不能覆盖，需要取出原flash
		req.flash('flow', flow);
		next();
	});
});

//申请成为志愿者
router.get('/volRep', fun.logChk);
router.get('/volRep', function(req, res, next){
	if(req.session.role <= 2.3 && req.session.role >= 2){
		//已经申请则前往申请详情界面，审核失败重新申请需先初始化role=2.4
		return res.redirect('volRepSta');
	}else if(req.session.role < 2){
		return res.redirect('back');
	}
	//role=2.4允许申请
	next();
});
router.get('/volRep', function(req, res, next){

	var menu = {title: '申请成为志愿者',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

    res.render('vol/volRep', { menu: menu
                              });
});

router.post('/volRep', fun.logChk);
router.post('/volRep', function(req, res, next){
	if(req.session.role <= 2.3 && req.session.role >= 2){
		//已经申请则前往申请详情界面，审核失败重新申请需先初始化role=2.4
		return res.redirect('volRepSta');
	}else if(req.session.role < 2){
		return res.redirect('back');
	}
	//role=2.4时允许申请
	next();
});
router.post('/volRep', function(req, res, next){
	switch (req.body.operate){
		case "申请":
		var cmd = "update User set Role=2.2, Tar_Role=2.2, Vol_Msg='"+req.body.vol_msg+"' where User_Id="+req.session.userid;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		req.flash("suc", "待审核，您的志愿者申请正在等待审核人员审核。完成审核后，系统将发邮件告知审核结果，请及时登录本系统进行查看！");
      		//更新session，传入的session为引用
      		fun.updateSession(req.session, function(){
      			return res.redirect('volRepSta');
      		});
      	});
		break;

		case "取消":
		return res.redirect("/index");
		break;
	}
});


//志愿者申请状态
router.get('/volRepSta', fun.logChk);
router.get('/volRepSta', function(req, res, next){
	if(req.session.role == 2.4){
		//未申请则前往申请界面，审核失败重新申请需先初始化role=2.4
		return res.redirect('volRep');
	}else if(req.session.role <= 2){
		return res.redirect('back');
	}
	//role=[2.1, 2.3]
	next();
});
router.get('/volRepSta', function(req, res, next){

	if (req.session.role == 2.2) {
		req.flash('war', '待审核，您的志愿者申请正在等待工作人员审核');
		var menu = {title: '志愿者申请状态',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

        var cmd = "select DD_Value from DD where DD_Key='Train_Msg'";
        query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		res.render('vol/volRepSta', { 	menu: menu,
                              				Train_Msg: results[0]['DD_Value']});
      	});

	}else if (req.session.role == 2.1) {
		req.flash('suc', '审核通过，请择时前往参加国家自然保护区教育培训');
		var menu = {title: '志愿者申请状态',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

        var cmd = "select DD_Value from DD where DD_Key='Train_Msg'";
        query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		res.render('vol/volRepSta', { 	menu: menu,
                              				Train_Msg: results[0]['DD_Value']});
      	});

	}else if(req.session.role == 2.3){
		req.flash('err', '审核未通过，抱歉您未通过志愿者审核');

		var menu = {title: '志愿者申请状态',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

  		var cmd = "select Vol_Msg from User where User_Id="+req.session.userid;
        query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		res.render('vol/volRepSta', { 	menu: menu,
                              				Vol_Msg: results[0]['Vol_Msg']});
      	});
	}else{
		console.error('出现了异常的志愿者状态，Role='+req.session.role);
		return res.redirect('back');
	}

	
});

router.post('/volRepSta', fun.logChk);
router.post('/volRepSta', function(req, res, next){
	if(req.session.role > 2.3){
		return res.redirect('volRep');
	}else if(req.session.role <= 2){
		return res.redirect('back');
	}
	//role=2.4时允许申请
	next();
});
router.post('/volRepSta', function(req, res, next){
	
	//重新申请前需还原用户角色值
	var cmd = "update User set Role=2.4, Tar_Role=2.4 where User_Id="+req.session.userid;
	query(cmd, function(error, results){
  		if (error) {console.log(cmd + error)};
  		fun.updateSession(req.session, function(){
  			return res.redirect('volRep');
  		})
  	});
		
});


//志愿者申请列表
router.get('/volAudList', fun.logChk);
router.get('/volAudList', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}

	//role=[0,1]
	next();
});
router.get('/volAudList', function(req, res, next){
	
	var range, title;
	if(req.query.range == "aud"){
		//待审核
		range = " Role=2.2";
		title = "待审核志愿者列表";
	}else if(req.query.range == "tra"){
		//待培训
		range = " Role=2.1";
		title = "待培训志愿者列表";
	}else{
		range = " Role>=2 and Role<=2.3 ";
		title = "全部志愿者列表";
	}

	var pagesize = settings.pagesize;
	var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
	console.log("页码："+page);
	
	var cmd = "select COUNT(*) from User where"+range;
	query(cmd, function(error, results){
	if(error){console.log(error);}
	var total = results[0]["COUNT(*)"];
	console.log("total records: " + total);
	console.log("total pages: " + Math.ceil(total / pagesize));

	//确保page大于0小于总页码
	page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
	page = (page > 0) ? page : 1;

	cmd = "select User_Id, Name, Sex, Mobile, Role, date_format(Nearest_Time,'%Y-%m-%d %H:%i') as Nearest_Time "
			+"from User where"+range+" limit "+((page-1)*pagesize)+","+pagesize;
	query(cmd, function(error, results){
	if (error) {console.log(cmd + "查询用户失败" + error);}
	if(results.length == 0){req.flash('war', '暂无信息');}
	var menu = {title: title,
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	res.render('vol/volAudList', { menu: menu,
	                  page: page,
	                  totalPage: Math.ceil(total / pagesize),
	                  isFirstPage: page == 1,
	                  isLastPage: ((page - 1) * pagesize + results.length) == total,
	                  rows: results});
	});
	});

});



//志愿者申请审核
router.get('/volAud', fun.logChk);
router.get('/volAud', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volAud', function(req, res, next){

	var menu = {title: '审核志愿者申请',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	var cmd = "select * from User where User_Id="+req.query.user_id;
	query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		if(results.length == 0){
      			return res.redirect('back');
      		}

      		res.render('vol/volAud', {menu: menu,
      								row: results[0]});
    });

});

router.post('/volAud', fun.logChk);
router.post('/volAud', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volAud', function(req, res, next){
	switch(req.body.operate){
		case "通过":
		var cmd = "update User set Role=2.1, Tar_Role=2.1 where User_Id="+req.query.user_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		fun.updateSession(req.session, function(){
      			fun.send_Mail_By_UserId(req.query.user_id, "经审核，您的志愿者申请已被批准，请及时登录本系统进行查看，并在保护区指定的场所，进行一次“国家自然保护区教育培训”。完成培训后，您可申请参加志愿者活动！", function(){});
      			req.flash('suc', '已通过用户志愿信息审核');
      			return res.redirect('back');
      		});
      	});
		break;

		case "不通过":
		var cmd = "update User set Role=2.3, Tar_Role=2.3, Vol_Msg='"+req.body.vol_msg+"' where User_Id="+req.query.user_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		fun.updateSession(req.session, function(){
      			fun.send_Mail_By_UserId(req.query.user_id, "经审核，您的志愿者申请已被退回，请及时登录本系统进行查看！", function(){});
      			req.flash('suc', '已拒绝用户志愿信息审核');
      			return res.redirect('back');
      		});
      	});
		break;
		case "返回":
		return res.redirect('volAudList');
		break;
	}
	
});


//志愿者参加培训确认
router.get('/volTrain', fun.logChk);
router.get('/volTrain', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volTrain', function(req, res, next){

	var menu = {title: '志愿者培训确认',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	var cmd = "select User_Id, Name from User where User_Id="+req.query.user_id;
	query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		if(results.length == 0){
      			return res.redirect('back');
      		}

      		res.render('vol/volTrain', {menu: menu,
      								row: results[0]});
    });

});

router.post('/volTrain', fun.logChk);
router.post('/volTrain', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volTrain', function(req, res, next){

	switch(req.body.operate){
		case "确认通过":
		var cmd = "update User set Role=2.0, Tar_Role=2.0 where User_Id="+req.query.user_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		fun.updateSession(req.session, function(){
      			fun.send_Mail_By_UserId(req.query.user_id, "您已完成“国家自然保护区教育培训”，您可自由申请参加各类志愿者活动！");
      			req.flash('suc', '已确认用户完成培训，当前用户已具备参加志愿者活动的资格');
      			return res.redirect('back');
      		});
      	});
		break;

		case "返回":
		return res.redirect('volAudList');
		break;
	}

});


//志愿者信息修改
router.get('/volEdit', fun.logChk);
router.get('/volEdit', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volEdit', function(req, res, next){

	var menu = {title: '修改志愿者状态',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	var cmd = "select User_Id, Name from User where User_Id="+req.query.user_id;
	query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		if(results.length == 0){
      			return res.redirect('back');
      		}

      		res.render('vol/volEdit', {menu: menu,
      								row: results[0]});
    });
});

router.post('/volEdit', fun.logChk);
router.post('/volEdit', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volEdit', function(req, res, next){

	switch(req.body.operate){
		case "保存":
		var cmd = "update User set Role="+req.body.vol_sta+", Tar_Role=" + req.body.vol_sta + " where User_Id="+req.query.user_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		fun.updateSession(req.session, function(){
      			req.flash('suc', '已更新用户志愿者状态');

      			if(req.body.vol_sta == 2.4){
      				fun.send_Mail_By_UserId(req.query.user_id, "抱歉，您已被工作人员撤销天目山志愿者身份。", function(){});
      			}else if (req.body.vol_sta == 2.1) {
      				fun.send_Mail_By_UserId(req.query.user_id, "抱歉，您已被工作人员暂停天目山志愿者身份，重新参加国家自然保护区教育培训后可重新获得志愿者身份。", function(){});
      			}

      			return res.redirect('back');
      		});
      	});
		break;

		case "取消":
		return res.redirect('volAudList');
		break;
	}

});


//发布志愿者活动
router.get('/volActPub', fun.logChk);
router.get('/volActPub', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volActPub', function(req, res, next){

	var menu = {title: '发布宣传教育活动(志愿者需求)',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

            var start_datetime = fun.splitDatetime('');
      		var end_datetime = fun.splitDatetime('');

      		res.render('vol/volActPub', {menu: menu,
      									start_datetime: start_datetime,
                                  		end_datetime: end_datetime
                              			});
});

router.post('/volActPub', fun.logChk);
router.post('/volActPub', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volActPub', function(req, res, next){

	var start_datetime = fun.joinDatetime(req.body.start_year, req.body.start_month, req.body.start_day, req.body.start_hour, req.body.start_minute);
	var end_datetime = fun.joinDatetime(req.body.end_year, req.body.end_month, req.body.end_day, req.body.end_hour, req.body.end_minute);


	switch(req.body.operate){
		case "发布":

		var cmd = "insert into VolAct (Publisher_Id, Title, Start_Time, End_Time, Place, Dema_Vol, Vol_Rsct, Det) value ("+
										+req.session.userid+", '"+req.body.title+"', '"+start_datetime+"', '"+end_datetime+"', '"
										+req.body.place+"', "+req.body.dema_vol+", '"+req.body.vol_rsct+"', '"+req.body.det+"')";
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		req.flash('suc', '宣传教育活动发布成功');
      		res.redirect('volActList');
      	});
		break;

		case "取消":
		return res.redirect('volActList');
		break;
	}

});


//志愿活动列表
router.get('/volActList', fun.logChk);
router.get('/volActList', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}

	//role=[0,1]
	next();
});
router.get('/volActList', function(req, res, next){
	
	var pagesize = settings.pagesize;
	var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
	console.log("页码："+page);
	
	var cmd = "select COUNT(*) from VolAct";
	query(cmd, function(error, results){
		if(error){console.log(error);}
		var total = results[0]["COUNT(*)"];
		console.log("total records: " + total);
		console.log("total pages: " + Math.ceil(total / pagesize));

		//确保page大于0小于总页码
		page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
		page = (page > 0) ? page : 1;

		cmd = "select Vol_Act_Id, Title, Dema_Vol, date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, date_format(now(),'%Y-%m-%d %H:%i') as Now from VolAct"
				+" order by Vol_Act_Id DESC limit "+((page-1)*pagesize)+","+pagesize;
		query(cmd, function(error, results){
			if (error) {console.log(cmd + error);}
			if(results.length == 0){req.flash('war', '暂无信息');}

			for (var i = 0; i < results.length; i++) {
				var now = (new Date(results[i]['Now'])).getTime();
				var end_time = (new Date(results[i]['End_Time'])).getTime();
				console.log(now, end_time);
				if(now > end_time){
					results[i]['Start_Time'] = "已结束";
				}
			};

			var menu = {title: '志愿者活动列表',
			        username: req.session.username,
			        userrole: req.session.role,
			        flow: req.flash('flow')[0],
			        count: req.flash('countMsg')[0],
			        suc: req.flash('suc').toString(),
			        war: req.flash('war').toString(),
			        err: req.flash('err').toString()
			        };

			res.render('vol/volActList', { menu: menu,
			              page: page,
			              totalPage: Math.ceil(total / pagesize),
			              isFirstPage: page == 1,
			              isLastPage: page == Math.ceil(total / pagesize),
			              rows: results});
		});
	});

});



//发布志愿者活动
router.get('/volActDet', fun.logChk);
router.get('/volActDet', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.vol_act_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volActDet', function(req, res, next){

	var menu = {title: '宣传教育活动详情',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

    var cmd = "select Title, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time,date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time, Place, Dema_Vol, Vol_Rsct, Det "
    		+"from VolAct where Vol_Act_Id="+req.query.vol_act_id;
    query(cmd, function(error, results){
      	if (error) {console.log(cmd + error)};
		res.render('vol/volActDet', {menu: menu,
									row: results[0]});

    });
    
});

router.post('/volActDet', fun.logChk);
router.post('/volActDet', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.vol_act_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volActDet', function(req, res, next){

	switch(req.body.operate){
		case "审核志愿者":
      	res.redirect('volActAudList?vol_act_id='+req.query.vol_act_id);
		break;

		case "删除活动":
		var now = (new Date()).getTime();
		var end_time = (new Date(req.body.end_time+":00")).getTime();
		// if(now > end_time){
		// 	req.flash('err', '当前活动已结束，无法撤销');
		// 	return res.redirect('volActDet');
		// }

		var cmd = "delete from VolActRep where Vol_Act_Id="+req.query.vol_act_id;
    	query(cmd, function(error, results){
	      	if (error) {console.log(cmd + error)};
		});

		var cmd = "delete from VolAct where Vol_Act_Id="+req.query.vol_act_id;
    	query(cmd, function(error, results){
	      	if (error) {console.log(cmd + error)};
			req.flash('suc', '已删除选定的活动');
			return res.redirect('volActList');
		});
		
		break;

		case "返回":
		return res.redirect('volActList');
		break;
	}
});



//审核申报当前宣传教育活动的志愿者
router.get('/volActAudList', fun.logChk);
router.get('/volActAudList', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.vol_act_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volActAudList', function(req, res, next){

	var pagesize = settings.pagesize;
	var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
	console.log("页码："+page);
	
	var cmd = "select COUNT(*) from VolActRep where Vol_Act_Id="+req.query.vol_act_id;
	query(cmd, function(error, results){
		if(error){console.log(error);}
		var total = results[0]["COUNT(*)"];
		console.log("total records: " + total);
		console.log("total pages: " + Math.ceil(total / pagesize));

		//确保page大于0小于总页码
		page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
		page = (page > 0) ? page : 1;
		var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

		cmd = "select v.*, u.Name, u.User_Id, u.Mobile, u.Email from VolActRep v left join User u on v.User_Id=u.User_Id where v.Vol_Act_Id="+req.query.vol_act_id;
		query(cmd, function(error, results){
			if (error) {console.log(cmd + error);}
			if (results.length == 0) {
      			req.flash('war', '暂无志愿者申报参加当前活动  ');
      		}

			var menu = {title: '宣传教育活动志愿者申报列表',
			        username: req.session.username,
			        userrole: req.session.role,
			        flow: req.flash('flow')[0],
			        count: req.flash('countMsg')[0],
			        suc: req.flash('suc').toString(),
			        war: req.flash('war').toString(),
			        err: req.flash('err').toString()
			        };

			res.render('vol/volActAudList', { menu: menu,
			              page: page,
			              totalPage: totalPage,
			              isFirstPage: page == 1,
			              isLastPage: page == totalPage,
			              rows: results});
		});
	});

});



//宣传教育活动报名页面 for用户
router.get('/volActRep', fun.logChk);
router.get('/volActRep', function(req, res, next){
	if(!req.query.vol_act_id){
		return res.redirect('back');
	}

	if (req.session.role < 2) {
		return res.redirect('volActDet?vol_act_id='+req.query.vol_act_id);
	}

	if(req.session.role > 2){
		return res.redirect('back');
	} 

	var cmd = "select count(*) from VolActRep where User_Id="+req.session.userid+" and Vol_Act_Id="+req.query.vol_act_id;
	query(cmd, function(error, results){
      	if (error) {console.log(cmd + error)};
      	if(results[0]['count(*)'] != 0){
      		//改用户已申报当前志愿者活动
      		return res.redirect('volActSta?vol_act_id='+req.query.vol_act_id);
      	}else{
      		//[2]
			next();
      	}
    });
});
router.get('/volActRep', function(req, res, next){

	var menu = {title: '志愿者活动报名',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	var cmd = "select Vol_Act_Id, Title, Dema_Vol, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time, Place, Vol_Rsct, Det from VolAct where Vol_Act_Id="+req.query.vol_act_id;
	query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      		if(results.length == 0){
      			req.flash('war', '非法的URL参数');
      		}

      		res.render('vol/volActRep', {menu: menu,
      								rows: results});
    });
});

router.post('/volActRep', fun.logChk);
router.post('/volActRep', function(req, res, next){
	if(req.session.role != 2){
		return res.redirect('back');
	}else if(!req.query.vol_act_id){
		return res.redirect('back');
	}
	//[2]
	next();
});
router.post('/volActRep', function(req, res, next){

	switch(req.body.operate){
		case "报名":

		var cmd = "insert VolActRep (Vol_Act_Id, User_Id, Vol_Sta, Vol_Msg) value ("
					+req.query.vol_act_id+", "+req.session.userid+", 3, '"+req.body.vol_msg+"')";
		query(cmd, function(error, results){
			if (error) {console.log(cmd + error)};
			req.flash('suc', '待审核，您的志愿者申请正在等待工作人员审核。完成审核后，系统将发邮件告知审核结果，请及时登录本系统进行查看！');
			res.redirect('volActRep');
		});
		break;

		case "取消":
		res.redirect("/index");
		break;
	}
});


//志愿活动申请审核
router.get('/volActAud', fun.logChk);
router.get('/volActAud', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id || !req.query.vol_act_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.get('/volActAud', function(req, res, next){

	var menu = {title: '审核宣传教育活动志愿者申请',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

	var cmd = "select User.*, VolActRep.Vol_Sta, VolActRep.Vol_Msg, VolActRep.Vol_Act_Id from VolActRep left join User on VolActRep.User_Id=User.User_Id where VolActRep.User_Id="+req.query.user_id+" and VolActRep.Vol_Act_Id="+req.query.vol_act_id;
	query(cmd, function(error, results){
      		if (error) {console.error(cmd + error)};
      		if(results.length == 0){
      			console.error('发现异常');
      			return res.redirect('back');
      		}else{
      			res.render('vol/volActAud', {menu: menu,
      								row: results[0]});
      		}
    });

});

router.post('/volActAud', fun.logChk);
router.post('/volActAud', function(req, res, next){
	if(req.session.role >= 2){
		return res.redirect('back');
	}else if(!req.query.user_id || !req.query.vol_act_id){
		return res.redirect('back');
	}
	//role=[0,1]
	next();
});
router.post('/volActAud', function(req, res, next){
	switch(req.body.operate){
		case "通过":
		var cmd = "update VolActRep set Vol_Sta=2 where User_Id="+req.query.user_id+" and VolActRep.Vol_Act_Id="+req.query.vol_act_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      			req.flash('suc', '已通过用户志愿信息审核');
      			fun.send_Mail_By_UserId(req.query.user_id, "经审核，您的志愿者活动申请已被批准，请及时登录本系统进行查看，并按照活动要求，准时参加本次活动！", function(){});
      			return res.redirect('volActAud');
      	});
		break;

		case "不通过":
		var cmd = "update VolActRep set Vol_Sta=4, Vol_Msg='"+req.body.vol_msg+"' where User_Id="+req.query.user_id+" and VolActRep.Vol_Act_Id="+req.query.vol_act_id;
		query(cmd, function(error, results){
      		if (error) {console.log(cmd + error)};
      			req.flash('suc', '已拒绝用户志愿信息审核');
      			fun.send_Mail_By_UserId(req.query.user_id, "经审核，您的志愿者活动申请已被退回，具体原因，请及时登录本系统进行查看！", function(){});
      			return res.redirect('volActAud');
      	});
		break;

		case "返回":
		return res.redirect('volActAudList?vol_act_id='+req.query.vol_act_id);
		break;
	}
	
});


//宣传教育活动展示页面 for用户
router.get('/volAct', fun.logChk);
router.get('/volAct', function(req, res, next){
	// console.log("==="+req.flash('flow'));
	// if(req.session.role != 2){
	// 	return res.redirect('back');
	// }
	//[]
	next();
});
router.get('/volAct', function(req, res, next){


	var cmd = "select Vol_Act_Id, Title, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, Place, Vol_Rsct, Det "
				+"from VolAct where Start_Time > now() order by Start_Time DESC";
	query(cmd, function(error, results){
  		if (error) {console.log(cmd + error)};
  		if(results.length == 0){
  			req.flash('war', '暂无相关宣传教育活动');
  		}

		var menu = {title: '志愿者活动',
	                username: req.session.username,
	                userrole: req.session.role,
	                flow: req.flash('flow')[0],
	                count: req.flash('countMsg')[0],
	                suc: req.flash('suc').toString(),
	                war: req.flash('war').toString(),
	                err: req.flash('err').toString()
	                };  		

	    res.render('vol/volAct', {menu: menu,
  								rows: results});
    });
});


//宣传教育活动报名状态 for用户
router.get('/volActSta', fun.logChk);
router.get('/volActSta', function(req, res, next){
	if(req.session.role != 2){
		return res.redirect('back');
	}else if(!req.query.vol_act_id){
		return res.redirect('back');
	}
	next();
});
router.get('/volActSta', function(req, res, next){

    var cmd = "select VolActRep.*, VolAct.Title, VolAct.Vol_Rsct, VolAct.Place, "
    		+"date_format(VolAct.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
    		+"date_format(VolAct.End_Time,'%Y-%m-%d %H:%i') as End_Time "
    		+"from VolActRep left join VolAct on VolActRep.Vol_Act_Id=VolAct.Vol_Act_Id "
    		+" where VolActRep.User_Id="+req.session.userid+" and VolActRep.Vol_Act_Id="+req.query.vol_act_id;
    query(cmd, function(error, results){
		if (error) {console.log(cmd + error)};
		if (results.length == 0) {res.redirect('back');};

		if (results[0]['Vol_Sta'] == 3) {
			req.flash('war', '待审核，您的志愿者申请正在等待工作人员审核。完成审核后，系统将发邮件告知审核结果，请及时登录本系统进行查看！');
		}else if (results[0]['Vol_Sta'] == 2) {
			req.flash('suc', '审核通过，请在约定时间前往参加志愿者活动');
		}else if(results[0]['Vol_Sta']){
			req.flash('err', '审核未通过，抱歉您未通过该活动志愿者审核');
		}

		var menu = {title: '志愿者活动申请状态',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

		res.render('vol/volActSta', {menu: menu,
								row: results[0]
										});

	});

	
});


//用户申报的志愿者活动列表
router.get('/volActRepList', fun.logChk);
router.get('/volActRepList', function(req, res, next){
	if(req.session.role != 2){
		return res.redirect('back');
	}
	//role=[2]
	next();
});
router.get('/volActRepList', function(req, res, next){

	var pagesize = settings.pagesize;
	var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
	console.log("页码："+page);
	
	var cmd = "select COUNT(*) from VolActRep where User_Id="+req.session.userid;
	query(cmd, function(error, results){
		if(error){console.log(error);}
		var total = results[0]["COUNT(*)"];
		console.log("total records: " + total);
		console.log("total pages: " + Math.ceil(total / pagesize));

		//确保page大于0小于总页码
		page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
		page = (page > 0) ? page : 1;
		var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

		cmd = "select date_format(VolAct.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, VolAct.Title, VolActRep.* from VolActRep left join VolAct on VolActRep.Vol_Act_Id=VolAct.Vol_Act_Id where User_Id="+req.session.userid
				+" order by VolAct.Start_Time DESC limit "+((page-1)*pagesize)+","+pagesize;
		
		query(cmd, function(error, results){
			if (error) {console.log(cmd + error);}
			if (results.length == 0) {
      			req.flash('war', '暂无申报参加任何活动');
      		}

			var menu = {title: '宣传教育活动志愿者申报列表',
			        username: req.session.username,
			        userrole: req.session.role,
			        flow: req.flash('flow')[0],
			        count: req.flash('countMsg')[0],
			        suc: req.flash('suc').toString(),
			        war: req.flash('war').toString(),
			        err: req.flash('err').toString()
			        };


			res.render('vol/volActRepList', { menu: menu,
			              page: page,
			              totalPage: totalPage,
			              isFirstPage: page == 1,
			              isLastPage: page == totalPage,
			              rows: results});
		});
	});

});

//#######################
//export
module.exports = router;