var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');
var images = require('images');


router.get('/*', function(req, res, next){

  //用户操作相关流程
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



//用户查看
router.get('/userDet', fun.logChk);
router.get('/userDet', function(req, res, next){
  if (!req.query.userid) {
    req.query.userid = req.session.userid;
  }else if(req.query.userid != req.session.userid && req.session.role >=2){
    //非管理员或审核员只能查看自己的信息
    return res.redirect("back");
  }
  next();
});
router.get('/userDet', function(req, res, next) {
  
  var cmd = "select User_Id, Name, Sex, Email, Mobile, ID_Card, Addr, Dep, Sec_Dep, "
            +"date_format(Reg_Time,'%Y年%m月%d日 %H点%I分') as Reg_Time, "
            +"date_format(Nearest_Time,'%Y年%m月%d日 %H点%I分') as Nearest_Time "
            +"from User "
            +"where User_Id="+req.query.userid;
  query(cmd, function(error, results){
    if(error){console.log(cmd + error);}
    if (results.length == 0) {console.log("未查找到用户");}

    var menu = {title: '个人信息',
        username: req.session.username,
        userrole: req.session.role,
        flow: req.flash('flow')[0],
        count: req.flash('countMsg')[0],
        suc: req.flash('suc').toString(),
        war: req.flash('war').toString(),
        err: req.flash('err').toString()
        };

    res.render("user/userDet", {menu: menu,
                            back: req.header('Referer') || '/',
                            row: results[0]});
  });
});


//用户编辑个人信息
router.get('/userEdit', fun.logChk);
router.get('/userEdit', function(req, res, next){

  //role=[0,2.4]
  next();
})
router.get('/userEdit', function(req, res, next) {

  var cmd = "select * from User where User_Id="+req.session.userid;
  query(cmd, function(error, results){
    if(error){console.log(cmd + error);}
    if (results.length == 0) {console.log("未查找到用户");}

    var menu = {title: '编辑个人信息',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

    res.render("user/userEdit", {menu: menu,
	                            row: results[0]});
  });
});

router.post('/userEdit', fun.logChk);
router.post('/userEdit', function(req, res, next){
  //role=[0,2.4]
  next();
})
router.post('/userEdit', function(req, res, next) {
  switch (req.body.operate){
    case "保存":
      var cmd = "update User set Name='"+req.body.username+
                 "', Sex="+req.body.gender+", Dep='"+req.body.dep+"', Sec_Dep='"+req.body.secdep+
                 "', Email='"+req.body.email+"', Mobile='"+req.body.mobile+"', ID_Card='"+req.body.ID_Card+
                 "', Addr='"+req.body.addr+"' where User_Id="+req.session.userid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        req.flash('suc', "已保存");
        return res.redirect('back');
      });

      if (req.body.newpwd) {
        console.log('重置密码');
        //重置密码和盐
        var salt = fun.randomString(8);
        console.log("rest id md5:"+md5.hex_md5(req.body.newpwd));
          cmd = "update User set Pwd='"+md5.hex_md5(salt + md5.hex_md5(req.body.newpwd))+"', Salt='"+salt
              +"' where User_Id="+req.session.userid;
           query(cmd, function(error, results){
           if (error) {console.log(cmd + error)}
        });
        };
    break;

    case "注销账户":

      //检查是否有申请任务

      var cmd = "delete from User where User_Id="+req.session.userid;
      query(cmd, function(error, results){
         if (error) {console.log(cmd + error)}
          return res.redirect("/logout");
       });

    break;

    case "取消":
      res.redirect("/index");
    break;

    default:
      console.log("未知的operate属性");
    break;
  }
});

//用户二维码
router.get('/qrCode', fun.logChk);
router.get('/qrCode', function(req, res, next) {

    var menu = {title: '用户二维码',
        username: req.session.username,
        userrole: req.session.role,
        flow: req.flash('flow')[0],
        count: req.flash('countMsg')[0],
        suc: req.flash('suc').toString(),
        war: req.flash('war').toString(),
        err: req.flash('err').toString()
        };

    var cmd = "select * from User where User_Id="+req.session.userid;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
      res.render("user/qrCode", {menu: menu,
                          Qr_Code: results[0]['Name']});
    });
});

//打印通行证
router.get('/passPrint', fun.logChk);
router.get('/passPrint', function(req, res, next){
  if (!req.query.srid || !req.query.act_type) {
    console.log("非法的URL");
    return null;
  }else if(req.query.act_type != 0 && req.query.act_type!=1){
    console.log("非法的参数");
    return null;
  }else{
    next();
  }
});
router.get('/passPrint', function(req, res, next){

  var menu = {title: '通行证打印'};

  var cmd = "select Name, Sex, Dep, Photo from User " 
          + "where User_Id="+req.session.userid;
  query(cmd, function(error, results){
    if(error){console.error(cmd+error);}

    var cmd2;
    if (req.query.act_type == 0) {
      cmd2 = "select SR_Title as Title, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time from SR where SR_Id="+req.query.srid;
    }else if(req.query.act_type == 1){
      cmd2 = "select EDU_Title as Title, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time from EDU where EDU_Id="+req.query.srid;
    }
    query(cmd2, function(error2, results2){
      if (error2) {console.error(error2 + cmd2);};

      res.render("user/passPrint", {menu: menu,
                                    Photo: results[0]['Photo'],
                                    Qr_Code: results[0]['Name'],
                                    Name: results[0]['Name'],
                                    Sex: results[0]['Sex'],
                                    Dep: results[0]['Dep'],
                                    Title: results2[0]['Title'],
                                    Start_Time: results2[0]['Start_Time'],
                                    End_Time: results2[0]['End_Time'],
                                  });
    });

  });

});

router.post('/passPrint', fun.logChk);
router.post('/passPrint', function(req, res, next){

  fun.getUploadFile(req, uuid.v1(), function(filename){
    //更新个人照片
    var cmd  = "update User set Photo='"+filename+"' where User_Id="+req.session.userid;
    query(cmd, function(error, results){
     if (error) {console.log(cmd + error)}
      
      //重设图片尺寸
      images("./public" + settings.filePath +filename).resize(160, 212).save("./public" + settings.filePath +filename);

      return res.redirect("back");
    });

  });

});



router.get('/enhRole', fun.logChk);
router.get('/enhRole', function(req, res, next){
  //role=[0,2.4]
  next();
});
router.get('/enhRole', function(req, res, next) {

  var menu = {title: '申请改变权限',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render('user/enhRole', {menu: menu,
                            });

});

router.post('/enhRole', fun.logChk);
router.post('/enhRole', function(req, res, next){
  if(req.body.operate == "取消"){
    return res.redirect('/index');
  }

  if (!req.body.enhrole) {
    req.flash('war', '未选择目标权限');
    return res.redirect('back');
  } 
  else if (Math.floor(req.body.enhrole) == Math.floor(req.session.role)) {
    req.flash('war', '您选择的角色与当前角色相同，无需申请');
    return res.redirect('back');
  };
  //role=[0,2.4]
  next();
});
router.post('/enhRole', function(req, res, next) {

  var targetRole = req.body.enhrole;
  var cmd = "update User set Tar_Role="+targetRole+" where User_Id="+req.session.userid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd+error);};
    req.flash('suc', '已提交申请，正在等候管理员审批');
    res.redirect('back');
  });

});


///////////////////////////////////////
module.exports = router;
