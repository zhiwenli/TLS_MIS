var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');



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


//设置系统发件箱
router.get('/setMISEmail', fun.logChk);
router.get('/setMISEmail', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/setMISEmail', function(req, res, next){
  //查询邮箱信息
  var cmd = "select DD_Value from DD where DD_Key='MIS_Email_Addr' or DD_Key='MIS_Email_Pwd' or DD_Key='MIS_Email_SMTP' order by DD_Id ASC";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}

      var row = { MIS_Email_Addr: results[0]['DD_Value'],
                MIS_Email_Pwd: results[1]['DD_Value'],
                MIS_Email_SMTP: results[2]['DD_Value']};

      var menu = {title: '发件箱设置',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

      res.render('admin/setMISEmail', { menu: menu,
                              row: row,
                              message: ''});
    });
});

router.post('/setMISEmail', fun.logChk);
router.post('/setMISEmail', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.post('/setMISEmail', function(req, res, next){
  
  var MIS_Email_Addr = req.body.MIS_email_addr;
  var MIS_Email_Pwd = req.body.MIS_email_pwd;
  var MIS_Email_SMTP = req.body.MIS_email_SMTP;

  switch(req.body.operate){
      case  "保存":
        var cmd = "update DD set DD_Value='"+MIS_Email_Addr+"' where DD_Key='MIS_Email_Addr'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新系统发件箱地址");
        });

        cmd = "update DD set DD_Value='"+MIS_Email_Pwd+"' where DD_Key='MIS_Email_Pwd'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新系统发件箱密码");
        });

        cmd = "update DD set DD_Value='"+MIS_Email_SMTP+"' where DD_Key='MIS_Email_SMTP'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新系统发件箱SMTP服务器");
        });

        req.flash('suc', '系统发件箱更新成功');

        //允许异步
        res.redirect("back");

        break;

      case "邮箱测试":
        fun.mailChk(function(error, success) {
           if(error){
                console.log("邮箱连接异常  "+error);
                req.flash('err', '邮箱连接异常'+error);
                res.redirect("back");
           }
           else{
                console.log('邮箱连接正常');
                req.flash('suc', '邮箱连接正常');
                res.redirect("back");
           }
        });
        break;

      case "取消":
        res.redirect("index");
        break;

      default:
        console.log("出现未知的operate");
        break;
  }

});

//设置邮寄地址
router.get('/setAdminAddr', fun.logChk);
router.get('/setAdminAddr', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/setAdminAddr', function(req, res, next){

  var cmd = "select DD_Value from DD where DD_Key='Admin_Addr'";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}

      var menu = {title: '系统邮箱设置',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };
      res.render('admin/setAdminAddr', {  menu: menu,
                                    addr: results[0]['DD_Value'],
                                    message: ''});
    });
});

router.post('/setAdminAddr', fun.logChk);
router.post('/setAdminAddr', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.post('/setAdminAddr', function(req, res, next){

  switch(req.body.operate){
      case  "保存":
        var addr = req.body.MIS_email_Addr;

        var cmd = "update DD set DD_Value='"+addr+"' where DD_Key='Admin_Addr'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新邮寄信息");
          req.flash('suc', '邮寄地址信息已更新');
          res.redirect("back");
        });
        break;

      case "取消":
        res.redirect("/index");
        break;
  }
});


//设置系统首页公告
router.get('/setIndexNotice', fun.logChk);
router.get('/setIndexNotice', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/setIndexNotice', function(req, res, next){

  var cmd = "select DD_Value from DD where DD_Key='Index_Notice'";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}

      var menu = {title: '发布系统公告',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };
      res.render('admin/setIndexNotice', {  menu: menu,
                                    indexnotice: results[0]['DD_Value']});
    });
});

router.post('/setIndexNotice', fun.logChk);
router.post('/setIndexNotice', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.post('/setIndexNotice', function(req, res, next){

  switch(req.body.operate){
      case  "保存":
        var indexnotice = req.body.indexnotice;

        var cmd = "update DD set DD_Value='"+indexnotice+"' where DD_Key='Index_Notice'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新系统公告");
          req.flash('suc', '系统公告已更新');
          res.redirect("back");
        });
        break;

      case "取消":
        res.redirect("/index");
        break;
  }
});


//开启、关闭系统。关闭后只有管理员可以登录
router.get('/setOpening', fun.logChk);
router.get('/setOpening', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/setOpening', function(req, res, next){

  var cmd = "select DD_Value from DD where DD_Key='MIS_Opening'";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}

      var menu = {title: '系统开关',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };
      res.render('admin/setOpening', { menu: menu,
                                opening: results[0]['DD_Value'],
                                message: ''});
    });

});

router.post('/setOpening', fun.logChk);
router.post('/setOpening', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.post('/setOpening', function(req, res, next){

  switch(req.body.operate){
      case  "保存":

        var cmd = "update DD set DD_Value='"+req.body.MIS_Opening+"' where DD_Key='MIS_Opening'";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          console.log("更新系统开关信息:" + req.body.MIS_Opening);

          if(req.body.MIS_Opening == 0){
            req.flash('suc','系统已关闭!');
            req.flash('war', '当前仅管理员可登陆该系统！');
          }else{
            req.flash('suc', '系统已开启，所有用户可正常登陆');
          }
          res.redirect("back");
        });
        break;

      case "取消":
        res.redirect("/index");
        break;
  }

});

//数据转存
router.get('/dataDump', fun.logChk);
router.get('/dataDump', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/dataDump', function(req, res, next){
  var cmd = "select DD_Value from DD where DD_Key='Mysql_Bak' or DD_Key='Files_Bak' order by DD_Id ASC";

  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}

  var menu = {title: '数据转存',
                    username: req.session.username,
                    userrole: req.session.role,
                    flow: req.flash('flow')[0],
                    count: req.flash('countMsg')[0],
                    suc: req.flash('suc').toString(),
                    war: req.flash('war').toString(),
                    err: req.flash('err').toString()
                    };
  
  res.render('admin/dataDump', {  menu: menu,
                            dir: settings.bakDir,
                            Mysql_Bak: results[0]['DD_Value'],
                            Files_Bak: results[1]['DD_Value'],
                            message: ''});
  });

});

router.post('/dataDump', fun.logChk);
router.post('/dataDump', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.post('/dataDump', function(req, res, next){
  if(req.query.baktype == "sql"){
    if(req.body.operate == "重新备份"){
      fun.SQLBak(function(){
        req.flash('suc', '已重新备份数据库文件');
        res.redirect("back");
      });
    }
    else if(req.body.operate == "下载文件"){
        var file = fs.createReadStream(settings.bakDir+req.query.down);
        res.writeHead(200, {
          'Content-Type': 'application/force-download',
          'Content-Disposition': 'attachment; filename='+req.query.down
        });
       
      file.pipe(res);
    }
    else{
      res.redirect("back");
    }
  }
  else if(req.query.baktype == "files"){
    if(req.body.operate == "重新备份"){
      fun.fileBak(function(){
        req.flash('suc', '已重新备份文件目录');
        res.redirect("back");
      });
    }
    else if(req.body.operate == "下载文件"){
        var file = fs.createReadStream(settings.bakDir+req.query.down);
        res.writeHead(200, {
          'Content-Type': 'application/force-download',
          'Content-Disposition': 'attachment; filename='+req.query.down
        });
       
      file.pipe(res);
    }
    else{
      res.redirect("back");
    }
  }else{
    res.redirect("index");
  }
});


//初始化系统
router.get('/init', fun.logChk);
router.get('/init', function(req, res, next){
  if (req.session.role != 0) {
    return res.redirect('back');
  };
  //[0]
  next();
});
router.get('/init', function(req, res, next){

  req.flash('war', '初始化操作将清空系统中现有全部数据，请谨慎操作');

  var menu = {title: '初始化系统',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                ount: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

          res.render('admin/init', {menu: menu});
});

router.post('/init', fun.logChk);
router.post('/init', function(req, res, next){
  if (true) {
    //暂不开放当前功能
    req.flash('err', '抱歉，当前功能暂不开放');
    return res.redirect('back');
  };
  if(req.session.role != 0){
    return res.redirect('back');
  }
  //role=[0,1)
  next();
});
router.post('/init', function(req, res, next){

  switch(req.body.operate){
    case "初始化":

    var tables = new Array(Mem, SR, User, VolAct, VolActRep);

    if (error) {console.log(cmd + error);};
    if (tables.length == 0){console.log("无数据表！");};

    for (var i = 0; i < tables.length; i++) {
      var cmd = "truncate table " + tables[i];
      query(cmd, function(error, tables){
        if (error) {console.log(cmd + error);};
        console("数据表 " + tables[i] +" 已重建");

        //删除失效文件
        fun.delInvalidFile();

        req.flash('suc', '系统已成功初始化');
      });
    }

    break;

    case "取消":
    return res.redirect('index');
    break;
  }

});


//用户管理页面
router.get('/userMgr', fun.logChk);
router.get('/userMgr', function(req, res, next){
  if(req.session.role >= 1){
    return res.redirect('back');
  }
  //role=[0,1)
  next();
});
router.get('/userMgr', function(req, res, next) {
  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
    console.log("页码："+page);
  
  var cmd = "select COUNT(*) from User";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);

    cmd = "select User_Id, Name, Mobile, Email, ID_Card, Role from User limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + "查询用户失败" + error);}

      var menu = {title: '查看用户',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render('admin/userMgr', { menu: menu,
                              page: page,
                              totalPage: Math.ceil(total / pagesize),
                              isFirstPage: page == 1,
                              isLastPage: ((page - 1) * pagesize + results.length) == total,
                              rows: results});
    });
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

    res.render("admin/userDet", {menu: menu,
                            back: req.header('Referer') || '/',
                            row: results[0]});
  });
});

//用户编辑
router.get('/userEdit', fun.logChk);
router.get('/userEdit', function(req, res, next){
  if(req.session.role > 0){
    req.flash('war', '权限不足');
    return res.redirect('back');
  }else if(!req.query.userid) {
    console.log("URL非法");
    return res.redirect("back");
  };
  //role=[0,1)
  next();
})
router.get('/userEdit', function(req, res, next) {

  var cmd = "select * from User where User_Id="+req.query.userid;
  query(cmd, function(error, results){
    if(error){console.log(cmd + error);}
    if (results.length == 0) {console.log("未查找到用户");}

    var menu = {title: '编辑用户',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

    res.render("admin/userEdit", {menu: menu,
                            User_Id: req.query.userid,
                            row: results[0]});
  });
});

router.post('/userEdit', fun.logChk);
router.post('/userEdit', function(req, res, next){
    if(req.session.role > 0){
      req.flash('war', '权限不足');
    return res.redirect('back');
  }
  //role=[0,1)
  next();
})
router.post('/userEdit', function(req, res, next) {
  switch (req.body.operate){
    case "保存":
      var cmd = "update User set Role="+req.body.role+", Tar_Role=" + req.body.role + ", Name='"+req.body.username+
                 "', Sex="+req.body.gender+
                 ", Email='"+req.body.email+"', Mobile='"+req.body.mobile+"', ID_Card='"+req.body.ID_Card+
                 "', Addr='"+req.body.addr+"' where User_Id="+req.body.Id;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        req.flash('suc', "已保存");
        return res.redirect('back');
      });

      if (req.body.reset_pwd == "true") {
        //重置密码和盐
        var salt = fun.randomString(8);
        console.log("rest id md5:"+md5.hex_md5(req.body.ID_Card));
          cmd = "update User set Pwd='"+md5.hex_md5(salt + md5.hex_md5(req.body.ID_Card))+"', Salt='"+salt+"' where User_Id="+req.body.Id;
           query(cmd, function(error, results){
           if (error) {console.log(cmd + error)}
        });
        };
    break;

    case "删除":

      //检查是否有申请任务

      var cmd = "delete from User where User_Id="+req.body.Id;
      query(cmd, function(error, results){
         if (error) {console.log(cmd + error)}
          return res.redirect("userMgr");
       });

    break;

    case "取消":
      res.redirect("userMgr");
    break;

    default:
      console.log("未知的operate属性");
    break;
  }
});

//用户权限申请列表
router.post('/enhRoleList', fun.logChk);
router.get('/enhRoleList', function(req, res, next){
  if(req.session.role != 0){
    console.log('权限不足');
    return res.redirect('/index');
  }
  next();
});
router.get('/enhRoleList', function(req, res, next){
  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);
  
  var cmd = "select COUNT(*) from User where Role!=Tar_Role";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

    cmd = "select User_Id, Name, Role, Tar_Role from User where Role!=Tar_Role";
    
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error);}
      if (results.length == 0) {
            req.flash('war', '暂无用户申请改变角色');
          }

      var menu = {title: '用户权限申请列表',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

      res.render('admin/enhRoleList', { menu: menu,
                                        page: page,
                                        totalPage: totalPage,
                                        isFirstPage: page == 1,
                                        isLastPage: page == totalPage,
                                        rows: results});
    });
  });
});


//处理enhRoleList
router.get('/enhRoleAud', fun.logChk);
router.get('/enhRoleAud', function(req, res, next){
  if (!req.query.srid || !req.query.opt) {
    console.log("URL非法");
    return res.redirect('back');
  } else if(req.session.role != 0){
    console.log("权限不足");
    return res.redirect('back');
  };

  var cmd = "select Tar_Role from User where User_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd+error)};
    req.flash('Tar_Role', results[0]);
    next();
  });
});
router.get('/enhRoleAud', function(req, res, next){
  var cmd;
  if (req.query.opt == "true") {
    var Tar_Role = req.flash('Tar_Role')[0]["Tar_Role"];
    if (Tar_Role == 2) {
      cmd = "update User set Role=2.4 where User_Id="+req.query.srid;
    }else{
      cmd = "update User set Role="+Tar_Role+" where User_Id="+req.query.srid;
    }

  } else if(req.query.opt == "false"){
    cmd = "update User set Tar_Role=Role where User_Id="+req.query.srid;
  }else{
    console.log("非法的URL");
  }

  query(cmd, function(error, results){
    if(error){console.log(cmd+error);};
    return res.redirect('back');
  });


});



//#######################
//export
module.exports = router;