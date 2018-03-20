var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');



router.get('/*', function(req, res, next){

  //科普教育实习相关流程
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

//这对活动申请用户
//流程控制，该页面将请求的活动定向到活动不同的状态阶段
//创建和编辑活动申请无需经过此处
router.get('/flowControl', fun.logChk);
router.get('/flowControl', function(req, res, next){
  if (!req.query.srid) {
    console.log("非法的URL");
    return res.redirect('back');
  };
  next();
});
router.get('/flowControl', function(req, res, next){

  //跳转控制
  var cmd = "select * from EDU where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    console.log(results);
    if (error) {console.log(cmd + error)}
    if(results.length == 0){
      //没有尚未提交的获活动，前往创建新活动或重新编辑活动
      return res.redirect('eduRep');
    }else if(results[0]['Edu_Sta'] == 4){
      //已保存活动，进入活动成员列表
      return res.redirect('memAddList?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 3){
      //等待受邀者确认，查看邀请状况成员
      return res.redirect('memAddList?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 2 || results[0]['Edu_Sta'] == 0.5){
      //待审核，查看当前提交的活动状态
      return res.redirect('eduRepSta?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] != 1){
      //合同没通过
      return res.redirect('contract?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 1){
      //合同通过审核，培训状态用户不可见
      return res.redirect('eduRepSta?srid='+req.query.srid);
      // next();
    }else{
      return res.redirect('eduRepSta?srid='+req.query.srid);
    }
  });
});

//科普教育实习申请
router.get('/eduRep', fun.logChk);
router.get("/eduRep", function(req, res, next){

  var menu = {title: '科普教育实习申请',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

  var cmd = "select DD_Key, DD_Value from DD where DD_Key='Acmdt'";
  query(cmd, function(error, results){
    var rows_acmdt = results;
    if (error) {console.log(cmd + error)}

    if(!req.query.srid){
      //新建

      var start_datetime = fun.splitDatetime('');
      var end_datetime = fun.splitDatetime('');

      res.render("edu/eduRep", {  menu: menu,
                                  start_datetime: start_datetime,
                                  end_datetime: end_datetime,
                                  row: "",
                                  rows_acmdt: rows_acmdt});
    }
    else{
      //编辑replace(/\s/g, "")
      cmd = "select EDU_Id, EDU_Title, date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
          +"date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time, "
          +"Place, Route, Acmdt, Act_Content, Spc_Require "
          +"from EDU where EDU_Id="+req.query.srid;console.log(cmd);
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)};
        if (results.lenght == 0) {return res.redirect('back');}

        var start_datetime = fun.splitDatetime(results[0]['Start_Time']);
        var end_datetime = fun.splitDatetime(results[0]['End_Time']);

        res.render("edu/eduRep", {menu: menu,
                                  start_datetime: start_datetime,
                                  end_datetime: end_datetime,
                                  row: results[0],
                                  rows_acmdt: rows_acmdt,
                                  message: ""});
      });
    }
  });
});

router.post('/eduRep', fun.logChk);
router.post("/eduRep", function(req, res, next){
  // var datetimeFor = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  // if(!datetimeFor.test("2015-12-05 11:20:33")){consol .log("传入日期时间格式错误");}

  var start_datetime = fun.joinDatetime(req.body.start_year, req.body.start_month, req.body.start_day, req.body.start_hour, req.body.start_minute);
  var end_datetime = fun.joinDatetime(req.body.end_year, req.body.end_month, req.body.end_day, req.body.end_hour, req.body.end_minute);

  switch (req.body.operate){
    case "下一步":
      if(req.body.srid){
        var cmd1 = "update EDU set EDU_Title='"+req.body.title+"', Place='"+req.body.place+
                                          "', Route='"+req.body.route+"', Acmdt='"+req.body.acmdt+
                                          "', Start_Time='"+start_datetime+
                                          "', End_Time='"+end_datetime+
                                          "', Act_Content='" + req.body.act_content + "', Spc_Require='"+req.body.spc_require+
                                          "', Edu_Sta=4 , Aud_Sug='' "+
                                          "where EDU_Id="+req.body.srid;

        query(cmd1, function(error, results){
          if (error) {console.log(cmd1 + error)}
          return res.redirect("memAddList?srid="+req.body.srid);
        });

        //修改后清空现有成员
        var cmd2 = "delete from Mem where SR_Id="+req.body.srid+" and Act_Type=1";
        query(cmd2, function(error, results){
          if (error) {console.log(cmd2 + error)}
        });
      }
      else{

        var cmd = "insert into EDU (User_Id, EDU_Title, Place, Route, Acmdt, Start_Time, End_Time, Act_Content, Spc_Require, Edu_Sta)\
                    value ("+req.session.userid+", '"+req.body.title+"', '"+req.body.place+"', '"+req.body.route+"', '"+req.body.acmdt+"', '"+start_datetime+"', '"+end_datetime+"', '"+req.body.act_content+"', '"+req.body.spc_require+"', 4)";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
            cmd = "select EDU_Id from EDU where User_Id="+req.session.userid+" order by EDU_Id DESC limit 1"; //获取当前用户最近一次插入得到的自增长键值
            query(cmd, function(error, results){
              if (error) {console.log(cmd + error);}
              return res.redirect("memAddList?srid="+results[0]['EDU_Id']);
            });
        });
      }
      break;
    case "删除":
      if(req.body.srid){

        var cmd1 = "delete from EDU where EDU_Id="+req.body.srid;
        query(cmd1, function(error, results){
          if (error) {console.log(cmd1 + error)}
          req.flash("suc", "已删除一条科普教育实习申请");
          return res.redirect("/index");
        });

        var cmd2 = "delete from Mem where SR_Id="+req.body.srid+" and Act_Type=1";
        query(cmd2, function(error, results){
          if (error) {console.log(cmd2 + error)}
        });  
      }
      else{
        return res.redirect("/index");
      }
      break;
    case "取消":
        return res.redirect("/index");
      break;
    default:
        console.log("出现未知的operate");
      break;
  }
  
});


//成员管理
router.get('/addMem', fun.logChk);
router.get('/addMem', function(req, res, next){
  if(req.query.srid && !req.query.memid){
    //添加新活动成员

    req.flash('war', '以下项均为必填，其中电子邮箱地址将作为该用户登录本系统的用户名');

    var menu = {title: '添加活动成员',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

    return res.render("edu/addMem", {menu: menu,
                                     row: "" });
  }else{
    next();
  }
});
router.get("/addMem", function(req, res, next){

  if(req.query.srid && req.query.memid){
    //更新活动成员
    var cmd = "select * from Mem where Mem_Id="+req.query.memid;
    query(cmd, function(error, results){
      if (error) {console.error(cmd + error)};
      if(results.length == 0){
        console.log("当前活动成员编号不存在，"+req.query.memid);
        next();
      }
      else{

        req.flash('war', '以下项均为必填，其中电子邮箱地址将作为该用户登录本系统的用户名');

        var menu = {title: '查看/编辑活动成员',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

        res.render("edu/addMem", {menu: menu,
                                  row: results[0]});
      }

    });
  }else{
    next();
  }
});
router.get('/addMem', function(req, res, next){
  console.log("非法的URL");
  return res.redirect("back");
});

router.post('/addMem', fun.logChk);
router.post('/addMem', function(req, res, next){
  if(req.body.operate == "取消"){
    return res.redirect('memAddList?srid='+req.query.srid);
  }else if(!req.query.srid){
    console.log("非法的URL");
    return res.redirect("back");
  }else{
    next();//操作活动成员信息
  }
});
router.post("/addMem", function(req, res, next){
  if(req.body.operate != "保存"){
    next();
  }

  //保存活动成员信息

  var Mem_Name = req.body.memname;
  var Mem_Type = req.body.memtype;
  var Mem_Sex = req.body.memsex;
  var Mem_Mobile = req.body.memmobile;
  var Mem_Email = req.body.mememail;
  var Mem_ID_Card = req.body.memidcard;
  var Mem_Dep = req.body.memdep;
  var Mem_Sec_Dep = req.body.memsecdep;
  var Mem_Major = req.body.memmajor;
  var Mem_Cre_Type = req.body.memcretype;
  var Mem_Cre_Id = req.body.memcreid;

  var cmd;

  if(req.query.srid && !req.query.memid){
    console.log("添加活动成员");
    cmd = "insert into Mem (SR_Id, Mem_Name, Mem_Type, Mem_Sex, Mem_Mobile, Mem_Email, Mem_ID_Card, Mem_Dep, Mem_Sec_Dep, Mem_Major, Mem_Cre_Type, Mem_Cre_Id, Act_Type) "
              +"values ("+req.query.srid+", '"+Mem_Name+"', '"+Mem_Type+"', "+Mem_Sex+", '"+Mem_Mobile+"', '"+Mem_Email+"', '"+Mem_ID_Card+"', '"+Mem_Dep+"', '"+Mem_Sec_Dep+"', '"+Mem_Major+"', '"+Mem_Cre_Type+"', '"+Mem_Cre_Id+"', 1)";
    
  }else if(req.query.srid && req.query.memid){
    console.log("更新活动成员");
    cmd = "update Mem set SR_Id="+req.query.srid+", Mem_Name='"+Mem_Name+"', Mem_Type='"+Mem_Type+"', Mem_Sex="+Mem_Sex
            +", Mem_Mobile='"+Mem_Mobile+"', Mem_Email='"+Mem_Email+"', Mem_ID_Card='"+Mem_ID_Card+"', Mem_Dep='"+Mem_Dep
            +"', Mem_Sec_Dep='"+Mem_Sec_Dep+"', Mem_Major='"+Mem_Major+"', Mem_Cre_Type='"+Mem_Cre_Type+"', Mem_Cre_Id='"+Mem_Cre_Id+"', Act_Type=1 "
            +"where Mem_Id="+req.query.memid;
  }

  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
  });

  //更新活动状态为已添加成员
  query("update EDU set Edu_Sta=3 where EDU_Id="+req.query.srid, function(error, results){
    if (error) {console.log(cmd + error)};
  });

  return res.redirect("memAddList?srid="+req.query.srid);
});
router.post("/addMem", function(req, res, next){
  if(req.body.operate != "删除"){
    next();
  }

  //删除活动成员
  if(req.query.srid && req.query.memid){
    console.log("删除活动成员");
    var cmd = "delete from Mem where Mem_Id="+req.query.memid;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
    });
  }
  return res.redirect("memAddList?srid="+req.query.srid);
});


//活动成员列表
router.get('/memAddList', fun.logChk);
router.get('/memAddList', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get("/memAddList", function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where SR_Id="+req.query.srid+" and Act_Type=1";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1;

    var cmd = "select Mem_Id, SR_Id, Mem_Name, Mem_Type, Mem_Dep, Mem_Sec_Dep, Mem_Major, Mem_Cre_Type, Mem_Cre_Id "
            +"from Mem "
            +"where SR_Id="+req.query.srid+" and Act_Type=1 "
            +"order by Mem_Id ASC "
            +"limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
      
      if(results.length == 0){
        req.flash('war', '请添加活动成员,第一位成员默认为该活动负责人');
      }

      var menu = {title: '活动成员列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/memAddList", {menu: menu,
                                    srid: req.query.srid,
                                    beforeRec: pagesize*(page-1),
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});


//批量导入活动成员excel文件
router.get('/importMem', fun.logChk);
router.get('/importMem', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/importMem', function(req, res, next){

  var menu = {title: '批量导入成员',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

  res.render('edu/importMem', {menu: menu, 
                              memListTemplate: settings.templateFilePath + "浙江天目山活动人员名单模板.zip",
                              back: req.header('Referer') || '/'
                              });

});

router.post('/importMem', fun.logChk);
router.post('/importMem', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.post('/importMem', function(req, res, next){

  switch(req.body.operate){
    case undefined:
      //接收文件
      fun.getUploadFile(req, uuid.v1(), function(filename){

        fun.tt(filename, req.query.srid, 1, function(msg){
          if (msg != '') {
            req.flash('err', msg);
            return res.redirect('importMem?srid=' + req.query.srid);
          }
          else{
            req.flash('suc', '已成功导入数据，请核对数据是否正确，若有误可返回上一步重新添加。');
            return res.redirect('memAddList?srid=' + req.query.srid);
          }

        });

      });
      break;

    case '返回':
      return res.redirect('memAddList?srid=' + req.query.srid);
      break;

    default:
      console.err("出现未知的operate");
      break;
  }

});


//提交科研活动
router.get('/subEdu', fun.logChk);
router.get('/subEdu', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/subEdu', function(req, res, next){

  //更新活动参与人数及活动状态
  var cmd2 = "select COUNT(*) from Mem "
            +"where SR_Id="+req.query.srid
            +" and Act_Type=1";
  query(cmd2, function(error, results){
    if (error) {console.log(cmd2 + error)}

    if(results[0]['COUNT(*)'] == 0){
      req.flash('err', '无活动成员！请添加至少一名活动成员');
      return res.redirect('back');
    }

    cmd2 = "update EDU set Peop_Count="+(results[0]['COUNT(*)'])
            +", Edu_Sta=2"
            +" where EDU_Id="+req.query.srid;
    query(cmd2, function(error, results){
      if (error) {console.log(cmd2 + error)}

      //创建成员账号并发送通知
      fun.addActMem(req.query.srid, 1);

      req.flash('suc', '科普教育实习申请已提交');
      res.redirect('flowControl?srid='+req.query.srid);
    });
  });
});


//提交科研活动
router.get('/eduRepSta', fun.logChk);
router.get('/eduRepSta', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/eduRepSta', function(req, res, next){

  //将没有同意的状态全部更新为失效
  var cmd1 = "select EDU_Title, EDU_Id, Place, Route, Acmdt, Peop_Count, Act_Content, Spc_Require, Aud_Sug, Edu_Sta, Contract_Img, Contract_Ok, "
            +"date_format(Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
            +"date_format(End_Time,'%Y年%m月%d日 %H点%I分') as End_Time "
            +" from EDU where EDU_Id="+req.query.srid;
  query(cmd1, function(error, results){
      if (error) {console.log(cmd1 + error)}

      if(results[0]['Edu_Sta'] == 2 || results[0]['Edu_Sta'] == 0.5){
        req.flash('war', '当前提交的科普教育实习申请正在等待审核,请耐心等待');
      }else if(results[0]['Edu_Sta'] == 1){
        req.flash('war', '当前提交的科普教育实习申请已被拒绝');
      }else if(results[0]['Edu_Sta'] == 5){
        req.flash('war', '当前活动已结束');
      }else if(results[0]['Edu_Sta'] == 6){
        req.flash('war', '当前活动已撤销');
      }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 0){
        req.flash('war', '当前科普教育实习已通过审核，请下载并提交实习材料');
      }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 1){
        req.flash('war', '当前提交的科普教育实习合同已通过审核，请活动成员按约定参加实习活动');
      }
      

      var menu = {title: '科普教育审核状态',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render('edu/eduRepSta', {menu: menu, 
                                    contract: results[0]['Contract_Img'] ? settings.filePath + results[0]['Contract_Img'] : "",
                                    row: results[0]});
  });
});

router.post('/eduRepSta', fun.logChk);
router.post('/eduRepSta', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.post('/eduRepSta', function(req, res, next){
  switch(req.body.operate){
    case "重新申请":
      res.redirect('eduRep?srid='+req.query.srid);
    break;

    case "撤销活动":
      //撤销该活动
      var cmd = "update EDU set Edu_Sta=6 where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
      });
      return res.redirect('back');
    break;

    case "查看成员列表":
      var cmd = "select * from EDU where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}

        if ((results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 1) || results[0]['Edu_Sta'] >= 5) {
          //如果活动进待开始或结束、撤销状态后，申报者进入eduTrainStaList可以看到培训状态
          return res.redirect("eduTrainStaList?srid="+req.query.srid);
        }else{
          //活动还在申报或审核状态时，申报者只能看到成员列表没有培训状态
          return res.redirect("eduMemList?srid="+req.query.srid);
        }
      });
    break;

    case "返回":
      return res.redirect('/index');
    break;

    default:
      console,log('出现的未知的operate操作');
    break;
  }
});


//接受参加活动的成员列表
router.get('/eduMemList', fun.logChk);
router.get('/eduMemList', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/eduMemList', function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where SR_Id =" + req.query.srid + " and Act_Type=1";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

    var cmd = "select * "
            +"from Mem "
            +"where SR_Id="+req.query.srid+" and Act_Type=1"
            +" order by Mem_Id ASC"
            +" limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){

      if (results.length == 0) {
        req.flash('err', '尚未添加活动成员');
      };
      if (error) {console.log(cmd + error)}
      var menu = {title: '活动成员列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/eduMemList", {menu: menu,
                                    srid: req.query.srid,
                                    beforeRec: pagesize*(page-1),
                                    back: req.header('Referer') || '/',
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});


//用户已提交的科研活动列表
router.get('/eduRepList', fun.logChk);
router.get("/eduRepList", function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from EDU where User_Id="+req.session.userid;
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

    var cmd = "select EDU.EDU_Id, EDU.EDU_Title, EDU.Peop_Count, EDU.Edu_Sta, "
            +"date_format(EDU.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"User.Name "
            +"from EDU left join User on EDU.User_Id=User.User_Id "
            +"where EDU.User_Id="+req.session.userid
            +" order by EDU.EDU_Id DESC "
            +"limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
      if (results.length == 0) {
        req.flash('war', '暂无科普教育实习申请数据');
      };

      var menu = {title: '科普教育实习状态列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/eduRepList", {menu: menu,
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});



//科研活动审核状态列表
router.get('/eduAudList', fun.logChk);
router.get('/eduAudList', function(req, res, next){
  if (!(req.session.role < 2)) {
    return res.redirect('back');
  };
  //[0,1]
  next();
});
router.get("/eduAudList", function(req, res, next){

  var range, title;
  if (req.query.range && req.query.range=="aud") {
    //待审核
    range = " EDU.Edu_Sta=2 ";
    title = "待审核科普实习申请列表";
  }else if(req.query.range && req.query.range=="leaderAud"){
    //待领导审核
    range = " EDU.Edu_Sta=0.5 ";
    title = "待领导审核科普实习申请列表";
  }else if (req.query.range && req.query.range=="con") {
    //待确认合同
    range = " EDU.Edu_Sta=0 and EDU.Contract_Ok=0 and (EDU.Contract_Img != '' or EDU.Contract_Ex!='')";
    title = "待确认科普实习合同列表";
  }else if (req.query.range && req.query.range=="tra") {
    //待确认合同
    range = " EDU.Edu_Sta=0 and EDU.Contract_Ok=1 ";
    title = "待参加的科普教育实习列表";
  }else{
    //全部
    range = " EDU.EDU_Id>=0 ";
    title = "全部科普实习列表";
  }

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from EDU where "+range;
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

    var cmd = "select EDU.EDU_Id, EDU.EDU_Title, EDU.Peop_Count, EDU.Edu_Sta, EDU.Contract_Img, EDU.Contract_Ex, EDU.Contract_Ok, "
            +"date_format(EDU.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"User.User_Id, User.Name "
            +"from EDU left join User on EDU.User_Id=User.User_Id "
            +"where "+range
            +"order by EDU.EDU_ID DESC "
            +"limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
      if (results.length == 0) {
        req.flash('war', '暂无符合条件的记录');
      };

      var menu = {title: title,
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/eduAudList", {menu: menu,
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});


//科研活动审核
router.get('/eduAud', fun.logChk);
router.get('/eduAud', function(req, res, next){
  if ((req.session.role >= 2) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/eduAud', function(req, res, next){
  var cmd = "select Edu_Sta, Contract_Ok from EDU where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd+error)};

    if(results[0]['Edu_Sta'] >= 0.5 && results[0]['Edu_Sta'] <= 4){
      //0.5-待领导审核，1-审核拒绝， 2-待审核，3-已保存活动添加成员待成员同意（未提交活动），4-已保存活动，尚未添加成员（未提交活动）

      //活动处于待领导审核状态且当前用户时领导或管理员时，跳转至领导审核界面
      if (results[0]['Edu_Sta'] == 0.5 && req.session.role <= 0.5) {
        return res.redirect('leaderEduAud?srid='+req.query.srid);
      }else{
        next();
      }

    }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 0){
      //活动审核通过，待审核合同
      return res.redirect('conRew?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 0 && results[0]['Contract_Ok'] == 1) {
      //合同审核通过，待参加活动
      return res.redirect('eduTrainStaList?srid='+req.query.srid);
    }else if(results[0]['Edu_Sta'] == 5 || results[0]['Edu_Sta'] == 6) {
      //5-活动结束, 6-活动撤销
      return res.redirect('eduRepSta?srid='+req.query.srid);
    }
  });
});
router.get("/eduAud", function(req, res, next){

  var cmd = "select EDU.EDU_Id, EDU.EDU_Title, EDU.Place, EDU.Route, EDU.Peop_Count, EDU.Acmdt, EDU.Edu_Sta, EDU.Act_Content, EDU.Act_Content, EDU.Spc_Require, EDU.Aud_Sug, "
          +"date_format(EDU.Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
          +"date_format(EDU.End_Time,'%Y年%m月%d日 %H点%I分') as End_Time, "
          +"User.User_Id, User.Name "
          +"from EDU left join User on EDU.User_Id=User.User_Id "
          +"where EDU.EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}

    if(results[0]['Edu_Sta'] == 0.5){
      req.flash('war', '已通过当前科普教育实习活动审核，正在等待主管领导审批');
    }else if(results[0]['Edu_Sta'] == 1){
      req.flash('war', '已拒绝当前科普教育实习活动，拒绝理由：' + results[0]['Aud_Sug']);
    }else if(results[0]['Edu_Sta'] == 2){
      req.flash('war', '请审核当前科普教育实习活动');
    }else if(results[0]['Edu_Sta'] == 3 || results[0]['Edu_Sta'] == 4){
      req.flash('war', '用户尚未提交该科普教育实习活动申请');
    }

    var menu = {title: '科普教育实习审核',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

    res.render("edu/eduAud", {menu: menu,
                          row: results[0],
                          message: ""});
  });
  
});

router.post('/eduAud', fun.logChk);
router.post('/eduAud', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.post("/eduAud", function(req, res, next){
  switch (req.body.operate){
    case "通过审核，提交领导确认":
      var cmd = "update EDU set Edu_Sta=0.5, Aud_Sug='', Update_Time=now() where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
            res.redirect("back");
            // fun.send2ActOrganiger('edu', req.query.srid, "经审核，您申报的科普实习活动已被批准，请及时登录本系统进行查看，并下载、打印《天目山国家级自然保护区科普教育实习工作管理规定》和人员名单，进行后续处理。");
          }
      });

      break;
    case "不通过":
      var cmd = "update EDU set Edu_Sta=1, Aud_Sug='"+req.body.aud_sug
                +"', Update_Time=now() where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
          res.redirect("back");
          fun.send2ActOrganiger('edu', req.query.srid, "经审核，您申报的科普实习活动已被工作人员退回，请及时登录本系统进行查看！"); //被工作人员退回的邮件中有说明，被领导退回的邮件中没指明
        }
      });
      
      break;
    case "返回":
      res.redirect("/edu/eduAudList");
      break;
    default:
      console.log("出现未知的operate");
      break;
  }
});


//主管领导科研活动审核
router.get('/leaderEduAud', fun.logChk);
router.get('/leaderEduAud', function(req, res, next){
  if ((req.session.role > 0.5) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0, 0.5]
  next();
});
router.get("/leaderEduAud", function(req, res, next){

  var cmd = "select EDU.EDU_Id, EDU.EDU_Title, EDU.Place, EDU.Route, EDU.Peop_Count, EDU.Acmdt, EDU.Edu_Sta, EDU.Act_Content, EDU.Spc_Require, EDU.Aud_Sug, "
          +"date_format(EDU.Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
          +"date_format(EDU.End_Time,'%Y年%m月%d日 %H点%I分') as End_Time, "
          +"User.User_Id, User.Name "
          +"from EDU left join User on EDU.User_Id=User.User_Id "
          +"where EDU.EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}

    if(results[0]['Edu_Sta'] == 0){
      req.flash('war', '已通过当前科普教育实习活动审核，用户可进行下一步操作');
    }else if(results[0]['Edu_Sta'] == 0.5){
      req.flash('war', '请主管领导审核当前科普教育实习活动');
    }else if(results[0]['Edu_Sta'] == 1){
      req.flash('war', '已拒绝当前科普教育实习活动');
    }

    var menu = {title: '科普教育实习审核',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

    res.render("edu/leaderEduAud", {menu: menu,
                          row: results[0],
                          message: ""});
  });
  
});
router.post('/leaderEduAud', fun.logChk);
router.post('/leaderEduAud', function(req, res, next){
  if (req.session.role >= 1 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0, 0.5]
  next();
});
router.post("/leaderEduAud", function(req, res, next){
  switch (req.body.operate){
    case "通过审核":
      var cmd = "update EDU set Edu_Sta=0, Aud_Sug='', Update_Time=now() where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
            res.redirect("back");
            fun.send2ActOrganiger('edu', req.query.srid, "经审核，您申报的科普实习活动已被批准，请及时登录本系统进行查看，并下载、打印《天目山国家级自然保护区科普教育实习工作管理规定》和人员名单，进行后续处理。");
          }
      });

      break;
    case "不通过":
      var cmd = "update EDU set Edu_Sta=1, Aud_Sug='"+req.body.aud_sug
                +"', Update_Time=now() where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
          res.redirect("back");
          fun.send2ActOrganiger('edu', req.query.srid, "经审核，您申报的科普实习活动已被退回，请及时登录本系统进行查看！");
        }
      });
      
      break;
    case "返回":
      res.redirect("/edu/eduAudList");
      break;
    default:
      console.log("出现未知的operate");
      break;
  }
});


//合同上传下载
router.get('/contract', fun.logChk);
router.get('/contract', function(req, res, next){
  if(!req.query.srid){
    return res.redirect("back");
  }

  //获取邮寄地址
  var cmd = "select DD_Value from DD where DD_Key='Admin_Addr'";
  query(cmd, function(error, results){
      if (error) {console.log(cmd + error);}
      if(results.length != 0 && results[0]["DD_Value"] != ""){
          req.flash('Admin_Addr', results[0]["DD_Value"]);
          next();
      }else{
          req.flash('Admin_Addr', "邮寄地址未初始化");
          next();
      }
    });
});
router.get("/contract", function(req, res, next){

  var cmd = "select EDU_Id, Contract_Img, Contract_Ex, Contract_Ok, Aud_Sug from EDU where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
    if(results[0]['Contract_Img'] == null && results[0]['Contract_Ex'] == null && results[0]['Contract_Ok'] == 0){
      req.flash('war', '您提交的科普教育实习活动已通过审核，请及时下载科普教育工作管理合同及参与成员名单，签字盖章后上传或邮寄');
    }else if ((results[0]['Contract_Img'] != null || results[0]['Contract_Ex'] != null) && results[0]['Contract_Ok'] == 0) {
      req.flash('war', '您发送的科普教育实习活动合同已提交至天目山保护区管理局进行审核，请耐心等待！审核完成后，您将收到系统的邮件通知，请及时登录本系统进行查看！');
    }else if(results[0]['Contract_Ok'] == 1) {
      req.flash('suc', '合同审核已通过，请按约定进行活动并在活动前参加国家自然保护区培训');
    }else if(results[0]['Contract_Ok'] == 2) {
      req.flash('err', '合同被拒绝,请重新提交。拒绝理由：'+results[0]['Aud_Sug']);
    }

    var menu = {title: '合同下载上传',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

    //获取文件名后缀
    results[0]['Contract_Img'] = /\.[^\.]+/.exec(results[0]['Contract_Img']);

    res.render("edu/contract", {menu: menu,
                            row: results[0],
                            contract: settings.templateFilePath + settings.eduContractFile,
                            message: "下载合同后请签字盖章，并邮寄或扫描后上传(<20M)，邮寄地址："+req.flash('Admin_Addr')});
  });
  
});

router.post('/contract', fun.logChk);
router.post('/contract', function(req, res, next){
  if(!req.query.srid){
    return res.redirect("back");
  }
  next();
});
router.post("/contract", function(req, res, next){

  switch(req.body.operate){
    case  "提交快递信息":
      var cmd  = "update EDU set Contract_Ok=0, Contract_Ex='"+req.body.contract_ex+"', Aud_Sug='' where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
          //已更新contract提交信息
          req.flash('suc', '已保存快递信息，请等待管理员确认');
          res.redirect("back");
      });
      break;
    case undefined:
      //接收文件，回调函数传入文件名，uuid.v1()基于时间戳生成文件名
      //由于multipart/form-data的数据组织形式，导致无法直接获取
      fun.getUploadFile(req, uuid.v1(), function(filename){

        var cmd  = "update EDU set Contract_Ok=0, Contract_Img='"+filename+"', Aud_Sug='' where EDU_Id="+req.query.srid;
        query(cmd, function(error, results){
         if (error) {console.log(cmd + error)}
          //已更新contract提交信息
          req.flash('suc', '合同已提交，请等待管理员确认');

          return res.redirect("back");
        });
      });
      break;

    case "撤销活动申请":
      var cmd = "update EDU set Edu_Sta=6 where EDU_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.error(cmd+error);};
      });
      return res.redirect("/index");
      break;

    case "返回":
      return res.redirect("/index");
      break;

    default:
      console.log("出现未知的operate");
      break;
  }
  
});


//打印人员名单
router.get('/printMem', fun.logChk);
router.get('/printMem', function(req, res, next){
  if (!req.query.srid) {
    console.log('URL非法');
    return res.redirect('back');
  }
  next();
});
router.get('/printMem', function(req, res, next){
  //获取活动信息
  var cmd = "select EDU_Id, EDU_Title, Place, Route, Acmdt, Peop_Count, Spc_Require, "
            +"date_format(Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"date_format(End_Time,'%Y-%m-%d %H:%i') as End_Time "
            +"from EDU where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.error(cmd+error);};
    if (results.length == 0) {
      console.error("活动不存在"+req.query.srid);
    };

    req.flash('EDU_Inf', results[0]);
    next();
  });

});
router.get('/printMem', function(req, res, next){

  var cmd = "select * from Mem where Act_Type=1 and SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.error(cmd+error);};
    if (results.length == 0) {
      console.error("活动成员为空"+req.query.srid);
    };

    res.render("edu/printMem", {row: req.flash('EDU_Inf')[0],
                               rows: results
                               });
  });

});

//审核合同
router.get('/conRew', fun.logChk);
router.get('/conRew', function(req, res, next){
  if ((req.session.role >= 2) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
})
router.get("/conRew", function(req, res, next){

  var cmd = "select Contract_Img, Contract_Ex, Aud_Sug from EDU where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
    //已更新contract提交信息
    var menu = {title: '合同审核',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

    res.render("edu/conRew", {menu: menu,
                            contract: results[0]['Contract_Img'] ? settings.filePath + results[0]['Contract_Img'] : "",
                            row: results[0],
                            message: "审核用户提交的合同扫描件或邮寄的合同后在当前页面选择是否审核通过用户合同"});
    });
  
});

router.post('/conRew', fun.logChk);
router.post('/conRew', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.post("/conRew", function(req, res, next){
  var Contract_Ok = 0;
  if(req.body.operate == "通过"){
    Contract_Ok = 1;
    var cmd  = "update EDU set Contract_Ok="+Contract_Ok+", Aud_Sug='', Update_Time=now() where EDU_Id="+req.query.srid;
    query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
      //已更新contract提交信息
      req.flash('suc', '已通过当前合同审核');
      res.redirect("back");
      fun.send2ActOrganiger('edu', req.query.srid, "您提交的科普教育实习活动材料已通过审核，请按照约定进行科普教育实习活动。");
    });
  }
  else if(req.body.operate == "不通过"){
    Contract_Ok = 2;
    var cmd  = "update EDU set Contract_Ok="+Contract_Ok+", Aud_Sug='"+req.body.aud_sug+"', Update_Time=now() where EDU_Id="+req.query.srid;
    query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
      //已更新contract提交信息
      req.flash('suc', '已拒绝当前合同');
      res.redirect("back");
      fun.send2ActOrganiger('edu', req.query.srid, "您提交的科普教育实习活动材料未通过审核，您可以在系统中重新提交。");
    });
  }
  else{
    //取消
    res.redirect("eduAudList");
  }
});


//科普教育实习前参加教育培训的显示及确认（权限）
router.get('/eduTrainStaList', fun.logChk);
router.get('/eduTrainStaList', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  }
  //[0,2.4]
  //提前检查该活动是否已经结束或撤销
  query("select Edu_Sta from EDU where EDU_Id="+req.query.srid, function(error, results){
    if (error) {console.error(cmd+error);};
    if (results[0]['Edu_Sta'] >= 5) {
      req.flash('eduFinished', true);
    }else{
      req.flash('eduFinished', false);
    }
    next();
  });
});
router.get('/eduTrainStaList', function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where Act_Type=1 and SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];//组织者本人
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1;

    var cmd = "select Mem.* "
            +"from Mem "
            +"where Mem.Act_Type=1 and Mem.SR_Id="+req.query.srid
            +" limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
      if (results.length == 0) {
        req.flash('war', '暂无符合条件的记录');
      };

      req.flash('war', '在该页面编辑科普教育实习活动成员参加国家自然保护区教育培训的状态');

      var menu = {title: '科普教育实习成员培训状态列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/eduTrainStaList", {menu: menu,
                                    srid: req.query.srid,
                                    beforeRec: pagesize*(page-1),
                                    back: req.header('Referer') || '/',
                                    eduFinished: req.flash('eduFinished')[0],
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });

});

//改变培训状态，无对应页面，操作完直接返回上一页
router.get('/eduTrainStaEdit', fun.logChk);
router.get('/eduTrainStaEdit', function(req, res, next){
  if (req.session.role >= 2 || !req.query.memid || !req.query.trainok) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/eduTrainStaEdit', function(req, res, next){

  var newTrainSta;
  if (req.query.trainok == 1) {
    newTrainSta = 0;
  }else if (req.query.trainok == 0){
    newTrainSta = 1;
  }else{
    newTrainSta = 1;
  }

  var cmd = "update Mem set Train_Ok="+newTrainSta+" where Mem_Id="+req.query.memid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd+error);};
    res.redirect('back');
  });

});

//工作人员标记培训完成。活动线上部分结束
//上一页面为：eduTrainStaList，下一页面为活动详情
router.get('/eduActFinish', fun.logChk);
router.get('/eduActFinish', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/eduActFinish', function(req, res, next){
  //标记该活动为结束状态
  var cmd = "update EDU set Edu_Sta=5 where EDU_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.error(cmd+error);};

    fun.send2ActOrganiger('edu', req.query.srid, "您申报的科普教育实习活动的国家自然保护区科普教育培训已结束,感谢您参与本次活动！");
    return res.redirect('eduRepSta?srid='+req.query.srid);
  });
});

//查看用户参加的活动列表
router.get('/eduActJoined', fun.logChk);
router.get('/eduActJoined', function(req, res, next){
  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where Act_Type=1 and Mem_Email='"+req.session.email+"'";
  query(cmd, function(error, results){
    if(error){console.log(cmd+error);}
    var total = results[0]["COUNT(*)"];//组织者本人
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1;

    var cmd = "select EDU.EDU_Id, EDU.EDU_Title, EDU.Place, EDU.Place, EDU.Route, EDU.Acmdt, EDU.Edu_Sta, "
            +"date_format(EDU.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"date_format(EDU.End_Time,'%Y-%m-%d %H:%i') as End_Time "
            +"from Mem left join EDU on Mem.SR_Id=EDU.EDU_Id "
            +"where Mem.Act_Type=1 and Mem.Mem_Email='"+req.session.email+"'"
            +" order by EDU.EDU_Id DESC"
            +" limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.error(cmd + error)}
      if (results.length == 0) {
        req.flash('war', '暂无符合条件的记录');
      };

      var menu = {title: '我参加的科普教育实习列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("edu/eduActJoined", {menu: menu,
                                    srid: req.query.srid,
                                    back: req.header('Referer') || '/',
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});


//删除活动
router.get('/eduActDel', fun.logChk);
router.get('/eduActDel', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/eduActDel', function(req, res, next){

  var cmd = "delete from EDU where EDU_Id=" + req.query.srid;
  query(cmd, function(error, results){
    if (error) {
      console.error(cmd + error);
    }else{
      console.log("删除EDU活动，EDU_Id="+req.query.srid);
    }
    return res.redirect('back');
  });

});




//#######################
//export
module.exports = router;


