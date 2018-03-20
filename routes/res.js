var express = require('express');
var router = express.Router();

var settings = require("settings");
var md5 = require("md5.js");
var fun = require('functions.js');
var query = require('mysqlCon.js');
var uuid = require('node-uuid');
var fs = require('fs');


router.get('/*', function(req, res, next){

  //科研学术活动相关流程
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


//科研项目申请
router.get('/resRep', fun.logChk);
router.get('/resRep', function(req, res, next){  

  //正在进行中的科研活动入口，由此跳转至对应的流程阶段

  var cmd = "select * from SR where User_Id="+req.session.userid+" and Res_Sta<=4";
  query(cmd, function(error, results){
    console.log(results);
    if (error) {console.log(cmd + error)}
    if(results.length == 0 || req.query.srid){
      //没有尚未提交的获活动，前往创建新活动或重新编辑活动
      next();
    }else if(results[0]['Res_Sta'] == 4){
      //已保存活动，编辑获活动成员
      return res.redirect('memAddList?srid='+results[0]['SR_Id']);
    }else if(results[0]['Res_Sta'] == 3){
      //已编辑活动成员，未提交活动
      return res.redirect('memAddList?srid='+results[0]['SR_Id']);
    }else if(results[0]['Res_Sta'] == 2 || results[0]['Res_Sta'] == 0.5){
      //待审核，查看当前提交的活动状态
      return res.redirect('resRepSta?srid='+results[0]['SR_Id']);
    }else if(results[0]['Res_Sta'] == 1){
      //已拒绝
      return res.redirect('resRepSta?srid='+results[0]['SR_Id']);
    }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] != 1){
      //合同没通过
      return res.redirect('contract?srid='+results[0]['SR_Id']);
    }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] == 1 && results[0]['Result_Ok'] != 1){
      //未提交成果
      return res.redirect('resultSub?srid='+results[0]['SR_Id']);
    }else{
      return res.redirect('back');
    }
  });

});
router.get("/resRep", function(req, res, next){

  var menu = {title: '科研学术活动申请',
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
      var submit_datetime = fun.splitDatetime('');

      res.render("res/resRep", {  menu: menu,
                                  start_datetime: start_datetime,
                                  end_datetime: end_datetime,
                                  submit_datetime: submit_datetime,
                                  row: "",
                                  rows_acmdt: rows_acmdt});
    }
    else{
      //编辑replace(/\s/g, "")
      cmd = "select SR_Id, SR_Title, date_format(Start_Time,'%Y-%m-%dT%H:%i') as Start_Time, "
          +"date_format(End_Time,'%Y-%m-%dT%H:%i') as End_Time, "
          +"date_format(Submit_Time,'%Y-%m-%dT%H:%i') as Submit_Time, "
          +"Place, Route, Peop_Count, Acmdt, Act_Content, Spc_Require "
          +"from SR where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)};
        if (results.lenght == 0) {return res.redirect('back');}

        var start_datetime = fun.splitDatetime(results[0]['Start_Time']);
        var end_datetime = fun.splitDatetime(results[0]['End_Time']);
        var submit_datetime = fun.splitDatetime(results[0]['Submit_Time']);

        res.render("res/resRep", {menu: menu,
                                  start_datetime: start_datetime,
                                  end_datetime: end_datetime,
                                  submit_datetime: submit_datetime,
                                  row: results[0],
                                  rows_acmdt: rows_acmdt,
                                  message: ""});
      });
    }
  });
});

router.post('/resRep', fun.logChk);
router.post("/resRep", function(req, res, next){
  // var datetimeFor = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  // if(!datetimeFor.test("2015-12-5 11:20:33")){consol .log("传入日期时间格式错误");}

  var start_datetime = fun.joinDatetime(req.body.start_year, req.body.start_month, req.body.start_day, req.body.start_hour, req.body.start_minute);
  var end_datetime = fun.joinDatetime(req.body.end_year, req.body.end_month, req.body.end_day, req.body.end_hour, req.body.end_minute);
  var submit_datetime = fun.joinDatetime(req.body.submit_year, req.body.submit_month, req.body.submit_day, req.body.submit_hour, req.body.submit_minute);

  switch (req.body.operate){
    case "下一步":
      if(req.body.srid){
        var cmd = "update SR set SR_Title='"+req.body.title+"', Place='"+req.body.place+
                                          "', Route='"+req.body.route+"', Acmdt='"+req.body.acmdt+
                                          "', Start_Time='"+start_datetime+
                                          "', End_Time='"+end_datetime+"', Submit_Time='"+submit_datetime+
                                          "', Act_Content='" + req.body.act_content + "', Spc_Require='"+req.body.spc_require+
                                          "', Res_Sta=4 "+
                                          "where SR_Id="+req.body.srid;
                                
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          return res.redirect("memAddList?srid="+req.body.srid);
        });

        //修改后清空现有成员
        var cmd = "delete from Mem where SR_Id="+req.body.srid+" and Act_Type=0";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
        });
      }
      else{

        var cmd = "insert into SR (User_Id, SR_Title, Place, Route, Acmdt, Start_Time, End_Time, Submit_Time, Act_Content, Spc_Require, Res_Sta)\
                    value ("+req.session.userid+", '"+req.body.title+"', '"+req.body.place+"', '"+req.body.route+"', '"+req.body.acmdt+"', '"+start_datetime+"', '"+end_datetime+"', '"+submit_datetime+"', '"+req.body.act_content+"', '"+req.body.spc_require+"', 4)";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)} 
            cmd = "select SR_Id from SR where User_Id="+req.session.userid+" order by SR_Id DESC limit 1"; //获取上一次插入得到的自增长键值，线程安全
            query(cmd, function(error, results){
              if (error) {console.log(cmd + error)}
              return res.redirect("memAddList?srid="+results[0]['SR_Id']);
            });
        });          
      }
      break;
    case "删除":
      if(req.body.srid){

        var cmd = "delete from SR where SR_Id="+req.body.srid;
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
          req.flash("suc", "已删除一条科研活动申请");
          return res.redirect("/index");
        });

        var cmd = "delete from Mem where SR_Id="+req.body.srid+" and Act_Type=0";
        query(cmd, function(error, results){
          if (error) {console.log(cmd + error)}
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


//添加、编辑成员
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

    return res.render("res/addMem", {menu: menu,
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

        res.render("res/addMem", {menu: menu,
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
    next();
  }
});
router.post("/addMem", function(req, res, next){

  if(req.body.operate != "保存"){
    next();
  }

  //添加活动成员

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
              +"values ("+req.query.srid+", '"+Mem_Name+"', '"+Mem_Type+"', "+Mem_Sex+", '"+Mem_Mobile+"', '"+Mem_Email+"', '"+Mem_ID_Card+"', '"+Mem_Dep+"', '"+Mem_Sec_Dep+"', '"+Mem_Major+"', '"+Mem_Cre_Type+"', '"+Mem_Cre_Id+"', 0)";
    
  }else if(req.query.srid && req.query.memid){
    console.log("更新活动成员");
    cmd = "update Mem set SR_Id="+req.query.srid+", Mem_Name='"+Mem_Name+"', Mem_Type='"+Mem_Type+"', Mem_Sex="+Mem_Sex
            +", Mem_Mobile='"+Mem_Mobile+"', Mem_Email='"+Mem_Email+"', Mem_ID_Card='"+Mem_ID_Card+"', Mem_Dep='"+Mem_Dep
            +"', Mem_Sec_Dep='"+Mem_Sec_Dep+"', Mem_Major='"+Mem_Major+"', Mem_Cre_Type='"+Mem_Cre_Type+"', Mem_Cre_Id='"+Mem_Cre_Id+"', Act_Type=0 "
            +"where Mem_Id="+req.query.memid;
  }

  query(cmd, function(error, results){
      if (error) {console.log(cmd + error)};
  });

  //更新活动状态为已添加成员
  query("update SR set Res_Sta=3 where SR_Id="+req.query.srid, function(error, results){
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

  var cmd = "select COUNT(*) from Mem where SR_Id="+req.query.srid+" and Act_Type=0";
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
            +"where SR_Id="+req.query.srid+" and Act_Type=0 "
            +"order by Mem_Id ASC "
            +" limit "+((page-1)*pagesize)+","+pagesize;
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

      res.render("res/memAddList", {menu: menu,
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

  res.render('res/importMem', {menu: menu, 
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

        fun.tt(filename, req.query.srid, 0, function(msg){
          if (msg != '') {
            req.flash('err', msg);
            return res.redirect('importMem?srid=' + req.query.srid);
          }
          else{
            req.flash('suc', '已成功导入数据');
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
router.get('/subRes', fun.logChk);
router.get('/subRes', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/subRes', function(req, res, next){
         
  //更新活动参与人数及活动状态
  var cmd2 = "select COUNT(*) from Mem "
            +"where SR_Id="+req.query.srid+" and Act_Type=0";
  query(cmd2, function(error, results){
    if (error) {console.log(cmd2 + error)}

    if(results[0]['COUNT(*)'] == 0){
      req.flash('err', '无活动成员！请添加至少一名活动成员');
      return res.redirect('back');
    }

    cmd2 = "update SR set Peop_Count="+(results[0]['COUNT(*)'])
            +", Res_Sta=2"
            +" where SR_Id="+req.query.srid;
    query(cmd2, function(error, results){
      if (error) {console.log(cmd2 + error)}

      //创建成员账号并发送通知
      fun.addActMem(req.query.srid, 0);

      req.flash('suc', '已科研活动申请已提交');
      return res.redirect('resRep');
    });
  });

  

});


//科研活动状态
router.get('/resRepSta', fun.logChk);
router.get('/resRepSta', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/resRepSta', function(req, res, next){

  //将没有同意的状态全部更新为失效
  var cmd1 = "select SR_Title, SR_Id, Place, Route, Acmdt, Peop_Count, Act_Content, Spc_Require, Aud_Sug, Res_Sta, Contract_Img, Result_File, Contract_Ok, Result_Ok, "
            +"date_format(Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
            +"date_format(End_Time,'%Y年%m月%d日 %H点%I分') as End_Time, "
            +"date_format(Submit_Time,'%Y年%m月%d日 %H点%I分') as Submit_Time "
            +" from SR where SR_Id="+req.query.srid;
  query(cmd1, function(error, results){
      if (error) {console.log(cmd1 + error)}

      if(results[0]['Res_Sta'] == 2 || results[0]['Res_Sta'] == 0.5){
        req.flash('war', '您申报的科研学术活动已提交至天目山保护区管理局进行审核，请耐心等待！');
      }else if(results[0]['Res_Sta'] == 1){
        req.flash('war', '当前提交的科研活动申报未通过审核，已退回');
      }else if(results[0]['Res_Sta'] == 5){
        req.flash('war', '当前活动已结束');
      }else if(results[0]['Res_Sta'] == 6){
        req.flash('war', '当前活动已撤销');
      }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] == 0){
        req.flash('war', '当前科研学术活动已通过审核，请下载并提交实习材料');
      }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] == 1){
        req.flash('war', '当前提交的科研学术活动合同已通过审核，请按约定参加科研活动');
      }
      

      var menu = {title: '科研学术活动状态',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render('res/resRepSta', {menu: menu, 
                                    contract: results[0]['Contract_Img'] ? settings.filePath + results[0]['Contract_Img'] : "",
                                    result: results[0]['Result_File'] ? settings.filePath + results[0]['Result_File'] : "",
                                    row: results[0]});
  });
});

router.post('/resRepSta', fun.logChk);
router.post('/resRepSta', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.post('/resRepSta', function(req, res, next){
  switch(req.body.operate){
    case "重新申请":
      return res.redirect('resRep?srid='+req.query.srid);
    break;

    case "撤销活动":
      //撤销该活动
      var cmd = "update SR set Res_Sta=6 where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
      });
      return res.redirect('back');
    break;

    case "查看成员列表":

     return res.redirect("resMemList?srid="+req.query.srid);
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
router.get('/resMemList', fun.logChk);
router.get('/resMemList', function(req, res, next){
  if (!req.query.srid) {
    return res.redirect('back');
  };
  next();
});
router.get('/resMemList', function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where SR_Id =" + req.query.srid + " and Act_Type=0";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1;

    var cmd = "select * "
            +"from Mem "
            +"where SR_Id="+req.query.srid+" and Act_Type=0"
            +" order by Mem_Id ASC"
            +" limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
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

      res.render("res/resMemList", {menu: menu,
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
router.get('/resRepList', fun.logChk);
router.get("/resRepList", function(req, res, next){

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from SR where User_Id="+req.session.userid;
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1

    var cmd = "select SR.SR_Id, SR.SR_Title, SR.Peop_Count, SR.Res_Sta, "
            +"date_format(SR.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"User.Name "
            +"from SR left join User on SR.User_Id=User.User_Id "
            +"where SR.User_Id="+req.session.userid
            +" order by SR.SR_Id DESC "
            +"limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
      if (results.length == 0) {
        req.flash('war', '暂无科研活动申请数据');
      };

      var menu = {title: '科研活动状态列表',
                username: req.session.username,
                userrole: req.session.role,
                flow: req.flash('flow')[0],
                count: req.flash('countMsg')[0],
                suc: req.flash('suc').toString(),
                war: req.flash('war').toString(),
                err: req.flash('err').toString()
                };

      res.render("res/resRepList", {menu: menu,
                                    page: page,
                                    totalPage: totalPage,
                                    isFirstPage: page == 1,
                                    isLastPage: page == totalPage,
                                    rows: results});
    });
  });
});



//科研活动审核状态列表
router.get('/resAudList', fun.logChk);
router.get('/resAudList', function(req, res, next){
  if (!(req.session.role < 2)) {
    return res.redirect('back');
  };
  //[0,1]
  next();
});
router.get("/resAudList", function(req, res, next){

  var range, title;
  if (req.query.range && req.query.range=="aud") {
    //待审核
    range = " SR.Res_Sta=2 ";
    title = "待审核科研活动申请列表";
  }else if(req.query.range && req.query.range=="leaderAud"){
    //待领导审核
    range = " SR.Res_Sta=0.5 ";
    title = "待领导审核科研活动申请列表";
  }else if (req.query.range && req.query.range=="con") {
    //待确认合同
    range = " SR.Res_Sta=0 and SR.Contract_Ok=0 and (SR.Contract_Img != '' or SR.Contract_Ex!='') ";
    title = "待确认科研活动合同列表";
  }else if (req.query.range && req.query.range=="resu") {
    //待确认合同
    range = " SR.Res_Sta=0 and SR.Contract_Ok=1 and SR.Result_Ok=0 and (SR.Result_File != '' or SR.Result_Ex!='') ";
    title = "待确认科研活动成果列表";
  }else{
    //全部
    range = " SR.SR_Id>=0 ";
    title = "全部科研活动列表";
  }

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from SR where "+range;
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1


    var cmd = "select SR.SR_Id, SR.SR_Title, SR.Peop_Count, SR.Res_Sta, SR.Aud_Sug, "
            +"SR.Contract_Img, SR.Contract_Ex, SR.Contract_Ok, SR.Result_File, SR.Result_Ex, SR.Result_Ok, "
            +"date_format(SR.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"User.User_Id, User.Name "
            +"from SR left join User on SR.User_Id=User.User_Id "
            +"where "+range
            +"order by SR.SR_Id DESC "
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

      res.render("res/resAudList", {menu: menu,
                                  page: page,
                                  totalPage: totalPage,
                                  isFirstPage: page == 1,
                                  isLastPage: page == totalPage,
                                  rows: results});
    
    });
  });
});


//科研活动审核
router.get('/resAud', fun.logChk);
router.get('/resAud', function(req, res, next){
  if ((req.session.role >= 2) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/resAud', function(req, res, next){
  var cmd = "select Res_Sta, Contract_Ok, Result_Ok from SR where SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd+error)};

    if(results[0]['Res_Sta'] >= 0.5 && results[0]['Res_Sta'] <= 4){
      //1-审核拒绝， 2-待审核，3-已保存活动添加成员待成员同意（未提交活动），4-已保存活动，尚未添加成员（未提交活动）
      
      //活动处于待领导审核状态且当前用户时领导或管理员时，跳转至领导审核界面
      if (results[0]['Res_Sta'] == 0.5 && req.session.role <= 0.5) {
        return res.redirect('leaderResAud?srid='+req.query.srid);
      }else{
        next();
      }

    }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] == 0){
      //活动审核通过，待审核合同
      return res.redirect('conRew?srid='+req.query.srid);
    }else if(results[0]['Res_Sta'] == 0 && results[0]['Contract_Ok'] == 1 && results[0]['Result_Ok'] != 1) {
      //合同审核通过，待提交成果
      return res.redirect('resultRew?srid='+req.query.srid);
    }else if(results[0]['Res_Sta'] == 5 || results[0]['Res_Sta'] == 6) {
      //5-活动结束, 6-活动撤销
      return res.redirect('resRepSta?srid='+req.query.srid);
    }
  });
});
router.get("/resAud", function(req, res, next){

  var cmd = "select SR.SR_Id, SR.SR_Title, SR.Place, SR.Route, SR.Peop_Count, SR.Acmdt, SR.Res_Sta, SR.Aud_Sug, SR.Act_Content, SR.Spc_Require, "
          +"date_format(SR.Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
          +"date_format(SR.End_Time,'%Y年%m月%d日 %H点%I分') as End_Time, "
          +"date_format(SR.Submit_Time,'%Y年%m月%d日 %H点%I分') as Submit_Time, "
          +"User.User_Id, User.Name "
          +"from SR left join User on SR.User_Id=User.User_Id "
          +"where SR.SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}

    if(results[0]['Res_Sta'] == 0.5){
      req.flash('war', '已通过当前科科研学术活动审核，正在等待主管领导审批');
    }else if(results[0]['Res_Sta'] == 1){
      req.flash('war', '已拒绝当前科研学术活动，拒绝理由：' + results[0]['Aud_Sug']);
    }else if(results[0]['Res_Sta'] == 2){
      req.flash('war', '请审核当前科研学术活动');
    }else if(results[0]['Res_Sta'] == 3 || results[0]['Res_Sta'] == 4){
      req.flash('war', '用户尚未提交该科研学术活动申请');
    }

    var menu = {title: '科研活动审核',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

    res.render("res/resAud", {menu: menu,
                          row: results[0],
                          message: ""});
  });

});

router.post('/resAud', fun.logChk);
router.post('/resAud', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.post("/resAud", function(req, res, next){
  switch (req.body.operate){
    case "通过审核，提交领导确认":
      var cmd = "update SR set Res_Sta=0.5, Aud_Sug='', Update_Time=now() where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
            req.flash('suc', '已通过该项科研任务');
            res.redirect("back");
            // fun.send2ActOrganiger('res', req.query.srid, "经审核，您申报的科研学术活动已被批准，请及时登录本系统进行查看，并下载、打印《天目山国家级自然保护区科研工作管理合同》，进行后续处理。");
          }
      });

      break;
    case "不通过":
      var cmd = "update SR set Res_Sta=1, Aud_Sug='"+req.body.aud_sug+"', Update_Time=now() where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
          req.flash('suc', '已拒绝该项科研任务');
          res.redirect("back");
          fun.send2ActOrganiger('res', req.query.srid, "经审核，您目前申报的科研学术活动已被工作人员退回，请及时登录本系统进行查看！"); //被工作人员退回的邮件中有说明，被领导退回的邮件中没指明
        }
      });
      
      break;
    case "返回":
      res.redirect("/res/resAudList");
      break;
    default:
      console.log("出现未知的operate");
      break;
  }
});


//主管领导科研活动审核
router.get('/leaderResAud', fun.logChk);
router.get('/leaderResAud', function(req, res, next){
  if ((req.session.role > 0.5) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0, 0.5]
  next();
});
router.get("/leaderResAud", function(req, res, next){

  var cmd = "select SR.SR_Id, SR.SR_Title, SR.Place, SR.Route, SR.Peop_Count, SR.Acmdt, SR.Res_Sta, SR.Aud_Sug, SR.Act_Content, SR.Spc_Require, "
          +"date_format(SR.Start_Time,'%Y年%m月%d日 %H点%I分') as Start_Time, "
          +"date_format(SR.End_Time,'%Y年%m月%d日 %H点%I分') as End_Time, "
          +"date_format(SR.Submit_Time,'%Y年%m月%d日 %H点%I分') as Submit_Time, "
          +"User.User_Id, User.Name "
          +"from SR left join User on SR.User_Id=User.User_Id "
          +"where SR.SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}

    if(results[0]['Res_Sta'] == 0){
      req.flash('war', '已通过当前科科研学术活动审核，用户可进行下一步操作');
    }else if(results[0]['Res_Sta'] == 0.5){
      req.flash('war', '请主管领导审核当前科研学术活动');
    }else if(results[0]['Res_Sta'] == 1){
      req.flash('war', '已拒绝当前科研学术活动');
    }

    var menu = {title: '科研活动审核',
              username: req.session.username,
              userrole: req.session.role,
              flow: req.flash('flow')[0],
              count: req.flash('countMsg')[0],
              suc: req.flash('suc').toString(),
              war: req.flash('war').toString(),
              err: req.flash('err').toString()
              };

    res.render("res/leaderResAud", {menu: menu,
                          row: results[0],
                          message: ""});
  });

});
router.post('/leaderResAud', fun.logChk);
router.post('/leaderResAud', function(req, res, next){
  if (req.session.role >= 1 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0, 0.5]
  next();
});
router.post("/leaderResAud", function(req, res, next){
  switch (req.body.operate){
    case "通过审核":
      var cmd = "update SR set Res_Sta=0, Aud_Sug='', Update_Time=now() where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
            res.redirect("back");
            fun.send2ActOrganiger('res', req.query.srid, "经审核，您申报的科研学术活动已被批准，请及时登录本系统进行查看，并下载、打印《天目山国家级自然保护区科研工作管理合同》，进行后续处理。");
          }
      });

      break;
    case "不通过":
      var cmd = "update SR set Res_Sta=1, Aud_Sug='"+req.body.aud_sug+"', Update_Time=now() where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
        else{
          res.redirect("back");
          fun.send2ActOrganiger('res', req.query.srid, "经审核，您目前申报的科研学术活动已被退回，请及时登录本系统进行查看！");
        }
      });
      
      break;
    case "返回":
      res.redirect("/res/resAudList");
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

  var cmd = "select Contract_Img, Contract_Ex, Contract_Ok, Aud_Sug from SR where SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
    if(results[0]['Contract_Img'] == null && results[0]['Contract_Ex'] == null && results[0]['Contract_Ok'] == 0){
      req.flash('war', '您提交的科研学术活动已通过审核，请及时下载科研工作管理合同，签字盖章后上传或邮寄');
    }else if ((results[0]['Contract_Img'] != null || results[0]['Contract_Ex'] != null) && results[0]['Contract_Ok'] == 0) {
      req.flash('war', '您发送的科研学术合同已提交至天目山保护区管理局进行审核，请耐心等待！审核完成后，您将收到系统的通知邮件，届时登录本系统进行查看！');
    }else if(results[0]['Contract_Ok'] == 1) {
      req.flash('suc', '合同审核已通过，请按申报参加活动并及时提交科研成果');
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

    res.render("res/contract", {menu: menu,
                            row: results[0],
                            contract: settings.templateFilePath + settings.resContractFile,
                            message: "下载合同后请签字盖章，并邮寄合同或上传扫描文件(<20M)，邮寄地址："+req.flash('Admin_Addr')});
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
      var cmd  = "update SR set Contract_Ok=0, Contract_Ex='"+req.body.contract_ex+"', Aud_Sug='' where SR_Id="+req.query.srid;
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

        var cmd  = "update SR set Contract_Ok=0, Contract_Img='"+filename+"', Aud_Sug='' where SR_Id="+req.query.srid;
        query(cmd, function(error, results){
         if (error) {console.log(cmd + error)}
          //已更新contract提交信息
          req.flash('suc', '合同已提交，请等待管理员确认');

          return res.redirect("back");
        });
      });
      break;

    case "撤销活动申请":

      var cmd = "update SR set Res_Sta=6 where SR_Id="+req.query.srid;
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

  var cmd = "select Contract_Img, Contract_Ex, Aud_Sug from SR where SR_Id="+req.query.srid;
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

    res.render("res/conRew", {menu: menu,
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
    var cmd  = "update SR set Contract_Ok="+Contract_Ok+", Aud_Sug='', Update_Time=now() where SR_Id="+req.query.srid;
    query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
      //已更新contract提交信息
      req.flash('suc', '已通过当前合同审核');
      res.redirect("back");
      fun.send2ActOrganiger('res', req.query.srid, "您提交的科研学术活动已通过审核，请按照约定进行科研学术活动。");
    });
  }
  else if(req.body.operate == "不通过"){
    Contract_Ok = 2;
    var cmd  = "update SR set Contract_Ok="+Contract_Ok+", Aud_Sug='"+req.body.aud_sug+"', Update_Time=now() where SR_Id="+req.query.srid;
    query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
      //已更新contract提交信息
      req.flash('suc', '已拒绝当前合同');
      res.redirect("back");
      fun.send2ActOrganiger('res', req.query.srid, "您提交的科研学术活动未通过审核，您可以修改后重新提交。");
    });
  }
  else{
    //取消
    res.redirect("resAudList");
  }
});


//研究成果提交
router.get('/resultSub', fun.logChk);
router.get('/resultSub', function(req, res, next){
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
router.get("/resultSub", function(req, res, next){

  var cmd = "select * from SR where SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
    if(results[0]['Result_File'] == null && results[0]['Result_Ex'] == null && results[0]['Result_Ok'] == 0){
      req.flash('war', '科研学术活动管理合同已通过审核，请按约定参加活动，活动结束后约定的时间内请上传或邮寄科研成果');
    }else if((results[0]['Result_File'] != null || results[0]['Result_Ex'] != null) && results[0]['Result_Ok'] == 0) {
      req.flash('war', '您提交的科研成果已提交至天目山保护区管理局进行审核，请耐心等待！审核完成后，您将收到系统的邮件通知，届时请登录本系统进行查看！');
    }else if(results[0]['Result_Ok'] == 1) {
      req.flash('suc', '通过科研成果，本次活动结束。欢迎您申请下次科研学术活动！');
    }else if(results[0]['Result_Ok'] == 2) {
      req.flash('err', '科研成果未通过审核，请重新提交。拒绝理由：'+results[0]['Aud_Sug']);
    }

    var menu = {title: '成果上传',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

    //获取文件名后缀
    results[0]['Result_File'] = /\.[^\.]+/.exec(results[0]['Result_File']);

    res.render("res/resultSub", {menu: menu,
                            row: results[0],
                            message: "活动完成后请在约定的时间内邮寄科研成果或上传成果压缩包(<50M)，重复上传会覆盖，邮寄地址："+req.flash('Admin_Addr')});
  });
  
});

router.post('/resultSub', fun.logChk);
router.post('/resultSub', function(req, res, next){
  if(!req.query.srid){
    return res.redirect("back");
  }
  next();
});
router.post("/resultSub", function(req, res, next){

  switch(req.body.operate){
    case  "保存":
      var cmd  = "update SR set Result_Name='" + req.body.result_name + "', Result_Dep='" + req.body.result_dep + "', Result_Author='" + req.body.result_author + "', Result_Author_Contact='" + req.body.result_author_contact + "', Result_Ex='"+req.body.result_ex+"' where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
          //已更新contract提交信息
          req.flash('suc', '已保存成果信息，请上传成果文件或提交成果邮寄信息');
          res.redirect("back");
      });
      break;
    case  "提交快递信息":
      var cmd  = "update SR set Result_Ok=0, Result_Ex='"+req.body.result_ex+"' where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
        if (error) {console.log(cmd + error)}
          //已更新contract提交信息
          req.flash('suc', '已保存快递信息');
          res.redirect("back");
      });
      break;
    case undefined:
      //接收文件，回调函数传入文件名，uuid.v1()基于时间戳生成文件名
      //由于multipart/form-data的数据组织形式，导致无法直接获取
      fun.getUploadFile(req, uuid.v1(), function(filename){

        var cmd  = "update SR set Result_Ok=0, Result_File='"+filename+"' where SR_Id="+req.query.srid;
        query(cmd, function(error, results){
         if (error) {console.log(cmd + error)}
          //已更新成果文件提交信息
          req.flash('suc', '已提交成果文件');
          res.redirect("back");
        });
      });
      break;
    default:
      console.log("出现未知的operate");
      break;
  }

});


//研究成果审核
router.get('/resultRew', fun.logChk);
router.get('/resultRew', function(req, res, next){
  if ((req.session.role >= 2) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get("/resultRew", function(req, res, next){
  var cmd = "select Result_Name, Result_Dep, Result_Author, Result_Author_Contact, Result_File, Result_Ex, Result_Ok, Aud_Sug from SR where SR_Id="+req.query.srid;
  query(cmd, function(error, results){
    if (error) {console.log(cmd + error)}
      //已更新contract提交信息


    var menu = {title: '成果审核',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

    res.render("res/resultRew", {menu: menu,
                          result_file: results[0]['Result_File'] ? settings.filePath + results[0]['Result_File'] : "",
                          row: results[0],
                          message: "管理员可根据用户上传的文件或邮寄的成果在当前页面修改用户成果递交状态"});
    });
});

router.post('/resultRew', fun.logChk);
router.post('/resultRew', function(req, res, next){
  if ((req.session.role >= 2) || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.post("/resultRew", function(req, res, next){
    if(req.body.operate == "确定"){
      var Result_Ok = req.body.result_ok;
      var cmd  = "update SR set Result_Ok="+Result_Ok+", Aud_Sug='"+req.body.aud_sug+"', Update_Time=now() where SR_Id="+req.query.srid;
      query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}

          //标记本次活动完成
        if (Result_Ok == 1) {
          var cmd = "update SR set Res_Sta=5 where SR_Id="+req.query.srid;
          query(cmd, function(error, results){
            if (error) {console.log(cmd + error)}
            req.flash('suc', '已确认收到用户合格的研究成果');
            res.redirect("back");
            fun.send2ActOrganiger('res', req.query.srid, "您提交的科研活动已经通过审核，本次科研活动结束，您可以申报下一次科研学术活动。");
          });
        }else{
          req.flash('suc', '已将用户研究成果状态标记为未通过审核');
            res.redirect("back");
            fun.send2ActOrganiger('res', req.query.srid, "您提交的科研活动未通过审核，请重新提交科研成果，否则无法申报下一次科研学术活动。");
        }
        
      });
    }
    else if(req.body.operate == "取消"){
      res.redirect("resAudList");
    }
    else{
      //取消
      console.log("出现未知的operate");
    }
});


//暂未使用！
//活动状态列表（流程式）显示
router.get('/taskDis', fun.logChk);
router.get('/taskDis', function(req, res, next) {

  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);
  
  var cmd = "select COUNT(*) from SR";
  query(cmd, function(error, results){
    if(error){console.log(error);}
    var total = results[0]["COUNT(*)"];
    console.log("total records: " + total);
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);

    if(req.session.role <= 1){
      //管理员和审核员查询所有活动
      cmd = "select SR_Id, SR_Title, User_Id, Is_Pending, Is_Reviewed, Contract_Ok, Result_Ok, Update_Time from SR order by SR_Id DESC limit "+((page-1)*pagesize)+","+pagesize;
    }else{
      //普通用户查询自己的活动
      cmd = "select SR_Id, SR_Title, User_Id, Is_Pending, Is_Reviewed, Contract_Ok, Result_Ok, Update_Time from SR where User_Id="+req.session.userid+" order by SR_Id DESC limit "+((page-1)*pagesize)+","+pagesize;
    }
    query(cmd, function(error, results){
      if (error) {console.log(cmd + "查询用户失败" + error);}
      var menu = {title: '查看任务',
                  username: req.session.username,
                  userrole: req.session.role,
                  flow: req.flash('flow')[0],
                  count: req.flash('countMsg')[0],
                  suc: req.flash('suc').toString(),
                  war: req.flash('war').toString(),
                  err: req.flash('err').toString()
                  };

      res.render('taskDis', { menu: menu,
                              page: page,
                              totalPage: Math.ceil(total / pagesize),
                              isFirstPage: page == 1,
                              isLastPage: ((page - 1) * pagesize + results.length) == total,
                              rows: results});
    });
  });
});


//查看用户参加的活动列表
router.get('/resActJoined', fun.logChk);
router.get('/resActJoined', function(req, res, next){
  var pagesize = settings.pagesize;
  var page = (req.query.page && req.query.page > 0) ? req.query.page : 1;
  console.log("页码："+page);

  var cmd = "select COUNT(*) from Mem where Act_Type=0 and Mem_Email='"+req.session.email+"'";
  query(cmd, function(error, results){
    if(error){console.log(cmd+error);}
    var total = results[0]["COUNT(*)"];//组织者本人
    console.log("total records: " + total);
    console.log("total pages: " + Math.ceil(total / pagesize));

    //确保page大于0小于总页码,page>0
    page = page <= Math.ceil(total / pagesize) ? page : Math.ceil(total / pagesize);
    page = (page > 0) ? page : 1;
    var totalPage = Math.ceil(total / pagesize) > 0 ? Math.ceil(total / pagesize) : 1;

    var cmd = "select SR.SR_Id, SR.SR_Title, SR.Place, SR.Place, SR.Route, SR.Acmdt, SR.Res_Sta, "
            +"date_format(SR.Start_Time,'%Y-%m-%d %H:%i') as Start_Time, "
            +"date_format(SR.End_Time,'%Y-%m-%d %H:%i') as End_Time "
            +"from Mem left join SR on Mem.SR_Id=SR.SR_Id "
            +"where Mem.Act_Type=0 and Mem.Mem_Email='"+req.session.email+"'"
            +" order by SR.SR_Id DESC"
            +" limit "+((page-1)*pagesize)+","+pagesize;
    query(cmd, function(error, results){
      if (error) {console.log(cmd + error)}
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

      res.render("res/resActJoined", {menu: menu,
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
router.get('/resActDel', fun.logChk);
router.get('/resActDel', function(req, res, next){
  if (req.session.role >= 2 || !req.query.srid) {
    console.log('权限不足或URL非法');
    return res.redirect('back');
  }
  //[0,1]
  next();
});
router.get('/resActDel', function(req, res, next){

  var cmd = "delete from SR where SR_Id=" + req.query.srid;
  query(cmd, function(error, results){
    if (error) {
      console.error(cmd + error);
    }else{
      console.log("删除SR活动，SR_Id="+req.query.srid);
    }
    return res.redirect('back');
  });

});


//#######################
//export
module.exports = router;