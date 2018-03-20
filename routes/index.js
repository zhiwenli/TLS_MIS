var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');

//res中路径前是否带/表示是否views中的绝对路径


//打印访问日志
router.get('/*', function(req, res, next) {

  fun.printRequsetMsg(req);
  next();
});

router.get('/*', function(req, res, next) {

  //检查是否有正在进行的科研学术或科普教育活动。现科普教育已经可以不检查
  fun.actChk(req.session.userid, function(SRing, EDUing){

    var flow = {
      SRing: SRing,
      EDUing: EDUing
    };
    req.flash('flow'); //取出缓存
    req.flash('flow', flow);
    next();
  });
});

router.get('/*', function(req, res, next) {

  //如果是管理员的话，统计未处理消息数
  if(req.session.role < 2){
    fun.countMsg(function(res_count1, res_count1_1, res_count2, res_count3, edu_count1, edu_count1_1, edu_count2, edu_count3){
      //
      var count = {
        res_count1:res_count1,
        res_count1_1:res_count1_1,
        res_count2:res_count2,
        res_count3:res_count3,
        edu_count1:edu_count1,
        edu_count1_1:edu_count1_1,
        edu_count2:edu_count2,
        edu_count3:edu_count3
      };
    req.flash('countMsg'); //flash不能覆盖，需要取出原flash
    req.flash('countMsg', count);
      next();
    });
  }else{
    next();
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {

  res.redirect('login');
});

// 模拟登录，测试专用
// router.get('/*', function(req, res, next) {
//   fun.loginMock(req, 49, "李智文", 0, 'hi@zhiwenli.com');
//   next();
// });
// router.post('/*', function(req, res, next) {
//   fun.loginMock(req, 49, "李智文", 0, 'hi@zhiwenli.com');
//   next();
// });

// router.get('/*', function(req, res, next) {
//   fun.loginMock(req, 52, "高金国", 2, 'gjg@zhiwenli.com');
//   next();
// });
// router.post('/*', function(req, res, next) {
//   fun.loginMock(req, 52, "高金国", 2, 'gjg@zhiwenli.com');
//   next();
// });

// router.get('/*', function(req, res, next) {
//   fun.loginMock(req, 51, "周媚", 2, '627077915@qq.com');
//   next();
// });
// router.post('/*', function(req, res, next) {
//   fun.loginMock(req, 51, "周媚", 2, '627077915@qq.com');
//   next();
// });

//首页
router.get('/index', fun.logChk);
router.get('/index', function(req, res, next){
  var cmd = "select DD_Value from DD where DD_Key='Index_Notice'";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
      req.flash('indexNotice', results[0]["DD_Value"]);
      next();
  });
});
router.get('/index', function(req, res, next) {

  var cmd = "select Vol_Act_Id, Title, date_format(Start_Time,'%Y-%m-%d %H:%I') as Start_Time, Place, Vol_Rsct, Det "
            +"from VolAct where Start_Time > now()";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
      if(results.length == 0){
        req.flash('war', '暂无相关宣传教育活动');
      }

      var menu = {title: '首页',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

      return res.render('index', {menu: menu,
                          indexNotice: req.flash('indexNotice').toString(),
                          rows: results});
    });
});


//暂用页面
router.get('/undo', function(req, res, next){

  var menu = {title: '迷航',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('eduWar').toString(),
                war: req.flash('eduWar').toString(),
                err: req.flash('volWar').toString()
                };

  res.render('undo', {menu: menu});
});


//独立登录页面
router.get('/login', fun.unlogChk);
router.get('/login', function(req, res, next){
  //检查是否为找回密码的临时登录页面
  if(req.query.tmpUrlCode){
    //检查链接是否有效
    var cmd = "select Email, Log_URL_Visited, UNIX_TIMESTAMP(Send_Time) from RePwd where Log_URL_Code='"+req.query.tmpUrlCode+"'";
    query(cmd, function(error, results){
      if (error) {console.error(error+cmd)};
      if (results.length == 0) {
        console.log("非法的URL");
        req.flash('logTips', '非法的链接');
        next();
      }else if((Date.parse(new Date())/1000 - results[0]['UNIX_TIMESTAMP(Send_Time)']) > 1800){
        //半小时以上链接失效
        req.flash('logTips', '链接已失效(超时)');
        next();
      }else if(results[0]['Log_URL_Visited'] == 1){
        req.flash('logTips', '链接已失效(已被访问)');
        next();
      }else{
        //验证通过，标记链接已访问，自动登录并进入重置密码界面
        var cmd1 = "update RePwd set Log_URL_Visited=1 where Log_URL_Code='"+req.query.tmpUrlCode+"'";
        query(cmd1, function(error, results1){
          if (error) {console.error(cmd+error)};
        });

        
        var cmd2 = "select * from User where Email='"+results[0]['Email']+"'";
        query(cmd2, function(error, results2){
          if (error) {console.error(cmd+error)};
          //记录session
          req.session.userid = results2[0]['User_Id'];
          req.session.username = results2[0]['Name'];
          req.session.role = results2[0]['Role'];
          req.session.email = results2[0]['Email'];

          console.log('临时URL登录成功 userid='+req.session.userid);

          //进入编辑个人信息页面
          req.flash('war', '请修改登录密码');
          return res.redirect('user/userEdit');
        });
        
      }
    });
  }else{
    next();
  }
});
router.get('/login', function(req, res, next) {
  var loginstr = req.flash('logTips').toString();

  if(fun.isAndroid(req)){
    //android对登录界面的输入框兼容性不好，因此使用原生界面
    res.render('loginForAndroid', {logTips: loginstr});
  }

  res.render('login', {logTips: loginstr});
});

router.post('/login', fun.unlogChk);
router.post('/login', function(req, res, next){console.log("post to login.ejs");
  //检查系统是否开启
  var cmd = "select DD_Value from DD where DD_Key='MIS_Opening'";
  query(cmd, function(error, results){
    if (error) {console.log(cms, '--->', error);};
    var MIS_Opening = results[0]['DD_Value'] == 1 ? true : false;
    if (MIS_Opening) {
      next(); //系统处于开启状态，正常进入登录流程
    }
    else{
      //系统处于关闭状态，判断是否管理员
      var username = req.body.username;
      cmd = "select COUNT(*) from User where (Email='"+username+"' and Role=0)";
      query(cmd, function(error, results){
        if (error) {console.log(cmd, '--->', error);};
        if (results[0]["COUNT(*)"] == 0) {
          //非管理员
          req.flash('logTips', '系统当前处于关闭状态，仅允许管理员登录');
          return res.redirect('back');
        }else{
          //管理员登录
          next();
        }
      });
    }
  })
});
router.post('/login', function(req, res, next){
  var username = req.body.username;
  var pwd = req.body.password;

  var cmd = "select * from User where Email='"+username+"'";
  query(cmd, function(error, results){
    if(error) console.log(error);
    if(results[0] == undefined){
      console.log('用户不存在');
      req.flash('logTips', '账号不存在');
      return res.redirect('back');
    }else{
      //用户存在
      var salt = results[0]['Salt'];
      var pwd_db = results[0]['Pwd'];
      if(md5.hex_md5(salt + pwd) == pwd_db){

        //写入最近登录时间
        cmd = "update User set Nearest_Time=now() where User_Id="+results[0]['User_Id'];
        query(cmd, function(error, results){
          if (error) {console.log("更新最近登录时间失败");}
        });

        //记录session
        req.session.userid = results[0]['User_Id'];
        req.session.username = results[0]['Name'];
        req.session.role = results[0]['Role'];
        req.session.email = results[0]['Email'];

        console.log('登录成功');
        console.log(results);

        var goUrl = 'index';
        var urlBeforLogin = req.flash('urlBeforLogin');
        if (urlBeforLogin != "") {
            goUrl = urlBeforLogin;
        };

        res.redirect(goUrl);//前往登录前所在页面或主页

      }else{
        console.log('密码错误');
        req.flash('logTips', '密码错误');
        return res.redirect('back');
      }

    }
  });
});

/////////////////////////////////////////////////////////////////////
router.post('/loginForAndroid', fun.unlogChk);
router.post('/loginForAndroid', function(req, res, next){console.log("post to loginForAndroid.ejs");
  //检查系统是否开启
  var cmd = "select DD_Value from DD where DD_Key='MIS_Opening'";
  query(cmd, function(error, results){
    if (error) {console.log(error);};
    var MIS_Opening = results[0]['DD_Value'] == 1 ? true : false;
    if (MIS_Opening) {
      next(); //系统处于开启状态，正常进入登录流程
    }
    else{
      //系统处于关闭状态，判断是否管理员
      var username = req.body.username;
      cmd = "select COUNT(*) from User where (Email='"+username+"' and Role=0";
      query(cmd, function(error, results){
        if (error) {console.log(error);};
        if (results[0]["COUNT(*)"] == 0) {
          //非管理员
          req.flash('logTips', '系统当前处于关闭状态，仅允许管理员登录');
          return res.redirect('back');
        }else{
          //管理员登录
          next();
        }
      });
    }
  })
});
router.post('/loginForAndroid', function(req, res, next){
  var username = req.body.username;
  var pwd = req.body.password;

  var cmd = "select * from User where Email='"+username+"'";
  query(cmd, function(error, results){
    if(error) console.log(error);
    if(results[0] == undefined){
      console.log('用户不存在');
      req.flash('logTips', '账号不存在');
      return res.redirect('back');
    }else{
      //用户存在
      var salt = results[0]['Salt'];
      var pwd_db = results[0]['Pwd'];
      if(md5.hex_md5(salt + pwd) == pwd_db){

        //写入最近登录时间
        cmd = "update User set Nearest_Time=now() where User_Id="+results[0]['User_Id'];
        query(cmd, function(error, results){
          if (error) {console.log("更新最近登录时间失败");}
        });

        //记录session
        req.session.userid = results[0]['User_Id'];
        req.session.username = results[0]['Name'];
        req.session.role = results[0]['Role'];
        req.session.email = results[0]['Email'];

        console.log('登录成功');
        console.log(results);

        var goUrl = 'index';
        var urlBeforLogin = req.flash('urlBeforLogin');
        if (urlBeforLogin != "") {
            goUrl = urlBeforLogin;
        };

        res.redirect(goUrl);//前往登录前所在页面或主页

      }else{
        console.log('密码错误');
        req.flash('logTips', '密码错误');
        return res.redirect('back');
      }

    }
  });
});
/////////////////////////////////////////////////////////////////////

//独立注册页面
router.get('/register', fun.unlogChk);
router.get('/register', function(req, res, next) {
  var regTips = req.flash('regTips').toString();
  res.render('register', {regTips: regTips});
});

router.post('/register', fun.unlogChk);
router.post('/register', function(req, res, next) {

  console.log('注册');
  var username = req.body.usernamesignup;
  var sex = req.body.sexsignup;
  var mobile = req.body.mobilesignup;
  var ID_Card = req.body.ID_Cardsignup;
  var email = req.body.emailsignup;
  var addr = req.body.addrsignup;
  var pwd = req.body.passwordsignup;
  var dep = req.body.depsignup;
  var secdep = req.body.secdepsignup;

  var salt = fun.randomString(8);
  pwd = md5.hex_md5(salt + pwd);

  //检查用户是否已经注册
  var cmd = "select Email, Mobile, ID_Card from User where Email='"+email+"'";
  query(cmd, function(error, results){
    if(error) {
      console.log("err is "+error);
      return res.redirect('back');
    }
    // console.log("results is "+results[0]['Email']);
    if(results.length != 0){
      console.log('重复注册');
      req.flash('regTips', '该邮箱已被注册');
      return res.redirect('back');
    }
    else{
      var role = 2.4; //default--normal user not volunteer
      var tarrole = role;

      var cmd = "insert into User "
                +"(Pwd, Role, Tar_Role, Name, Sex, ID_Card, Mobile, Email, Addr, Reg_Time, Salt, Dep, Sec_Dep) "
                +"values('"+pwd+"',"+role+","+tarrole+",'"+username+"',"+sex+",'"+ID_Card+"','"+mobile+"','"+email
                +"','"+addr+"',now(),'"+salt+"', '"+dep+"', '"+secdep+"')";

      query(cmd, function(error, results){
        if(error) console.log(error+cmd);
        console.log("信息已写入");
        
        req.flash('loginTips', '注册成功，请使用电子邮件地址登录');
        return res.redirect('/login');
      });
    }
  });
});




//注销，该路径无对应ejs页面
router.get('/logout', fun.logChk);
router.get('/logout', function(req, res, next){
  //销毁session
  req.session.destroy(function(err) {
    if(err){
      console.log("session销毁失败 "+err);
      res.redirect('back');
    }
    res.redirect('/');
  })
});





//找回密码页面
router.get('/rePwd', fun.unlogChk);
router.get('/rePwd', function(req, res, next){
  var rePwdTips = req.flash('rePwdTips');

  res.render('rePwd', {rePwdTips:rePwdTips});
});
router.post('/rePwd', fun.unlogChk);
router.post('/rePwd', function(req, res, next){
  //
  var unique = req.body.unique;
  var cmd = "select * from User where Email='"+unique+"'";
  query(cmd, function(error, results){
    if (error) {console.error(cmd + error)};
    if (results.length == 0) {
      req.flash('rePwdTips', '用户不存在');
      return res.redirect('back');
    }
    else{
      //用户存在
      var timeStamp = (new Date()).valueOf();
      var randomString = fun.randomString(8);
      var tmpUrlCode = results[0]['Email'] + randomString + timeStamp;
      tmpUrlCode = md5.hex_md5(tmpUrlCode);

      //地址需要修改
      var urlString = settings.domain+"/login" + "?tmpUrlCode="+tmpUrlCode;

      //生成临时URL、存入数据库、发送给用户
      var context = "您好，您在浙江天目山国家级自然保护区科研教育管理信息系统上申请了重置密码，"
                    +"请访问 "+urlString+" 重置密码，该链接仅在半小时内首次访问有效。如果您没有申请重置密码，请忽略此邮件。";
      fun.send_Mail(results[0]['Email'], context, function(error, info){
        if(error){
                  return console.error('邮件发送失败'+error);
                }else{
                  console.log('邮件发送成功: ' + info.response);

                  //写入密码找回信息
                  cmd = "insert into RePwd (Email, Log_URL_Code, Log_URL_Visited, Send_Time) "
                        +"value ('"+results[0]['Email']+"', '"+tmpUrlCode+"', 0, now())";
                  query(cmd, function(error, results){
                    if (error) {console.error(cmd + error)};
                  });

                  req.flash('rePwdTips', '邮件发送成功，请检查收件箱');
                  return res.redirect('back');
                }
      });
    }
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

    res.render("userDet", {menu: menu,
                            back: req.header('Referer') || '/',
                            row: results[0]});
  });
});


//调用弹窗显示活动成员的第一位（负责人）
router.get('showFuzheren', fun.logChk);
router.get('/showFuzheren', function(req, res, next){
  if (!req.query.srid || !req.query.act_type) {
    console.log("非法的URL");
    return null;
  }else if(req.query.act_type != 0 && req.query.act_type!=1){
    console.log("非法的参数");
    return null;
  }else{console.log("-----",req.query.act_type );
    next();
  }
});
router.get('/showFuzheren', function(req, res, next){

  var cmd = "select User_Id from Mem " 
          + "where SR_Id="+req.query.srid+" and Act_Type="+req.query.act_type
          + " order by Mem_Id ASC"
          + " limit 0,1";
  query(cmd, function(error, results){
    if (error) {console.error(cmd+error);};
    if (results.length == 0) {
      console.log("未查找到成员")
      return null;
    };console.log(results);
    return res.redirect('userDetDialog?userid=' + results[0]['User_Id']);
  });
});

//弹窗查看用户信息
router.get('/userDetDialog', fun.logChk);
router.get('/userDetDialog', function(req, res, next){
  if (!req.query.userid) {
    console.log("非法的URL");
    return null;
  }else{
    next();
  }

});
router.get('/userDetDialog', function(req, res, next) {
  
  var cmd = "select * from User where User_Id="+req.query.userid;
  query(cmd, function(error, results){
    if(error){console.log(cmd + error);}
    if (results.length == 0) {
      console.log("未查找到成员", req.query.userid);
      res.render("userDetDialog", {row: []});
    }

    res.render("userDetDialog", {row: results[0]});
  });
});

//弹窗查看活动成员信息
router.get('/memDet', fun.logChk);
router.get('/memDet', function(req, res, next){
  if (!req.query.memid) {
    console.log("非法的URL");
    return null;
  }else{
    next();
  }

});
router.get('/memDet', function(req, res, next) {
  
  var cmd = "select * from Mem where Mem_Id="+req.query.memid;
  query(cmd, function(error, results){
    if(error){console.log(cmd + error);}
    if (results.length == 0) {
      console.log("未查找到成员", req.query.memid);
      res.render("memDet", {row: []});
    }

    res.render("memDet", {row: results[0]});
  });
});



//用户登录注册使用指南
router.get('/loginHelp', function(req, res, next){

  if (!req.session.userid) {
    //用户未登录,允许进入当前页面，但仍未标记为登录
    req.session.username = '未登录';
    userrole: req.session.role = '2.4';
    req.flash('war', '您尚未登录，暂时无法使用其它功能！');
  }
  next();
});
router.get('/loginHelp', function(req, res, next){

  var menu = {title: '登录注册使用帮助',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render("loginHelp", {menu: menu});
});



//普通用户使用指南
router.get('/normalUserHelp', fun.logChk);
router.get('/normalUserHelp', function(req, res, next){

  var menu = {title: '普通用户使用帮助',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render("normalUserHelp", {menu: menu});
});


//科普宣教科人员（审核员）用户使用指南
router.get('/auditorHelp', fun.logChk);
router.get('/auditorHelp', function(req, res, next){

  var menu = {title: '系统审核员使用帮助',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render("auditorHelp", {menu: menu});
});

//主管领导使用指南
router.get('/leaderHelp', fun.logChk);
router.get('/leaderHelp', function(req, res, next){

  var menu = {title: '主管领导使用帮助',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render("leaderHelp", {menu: menu});
});


//系统管理使用指南
router.get('/adminHelp', fun.logChk);
router.get('/adminHelp', function(req, res, next){

  var menu = {title: '系统管理员使用帮助',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render("adminHelp", {menu: menu});
});


//#######################
//export
module.exports = router;
