//前端JS
var emailReg = /^([0-9a-z_\.-]+)@([0-9a-z\.-]+)\.([a-z]{2,6})$/;
var mobileReg = /^\d{11}$/;
var ID_CardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
var datetime = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
var date = /((^((1[8-9]\d{2})|([2-9]\d{3}))(-)(10|12|0?[13578])(-)(3[01]|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))(-)(11|0?[469])(-)(30|[12][0-9]|0?[1-9])$)|(^((1[8-9]\d{2})|([2-9]\d{3}))(-)(0?2)(-)(2[0-8]|1[0-9]|0?[1-9])$)|(^([2468][048]00)(-)(0?2)(-)(29)$)|(^([3579][26]00)(-)(0?2)(-)(29)$)|(^([1][89][0][48])(-)(0?2)(-)(29)$)|(^([2-9][0-9][0][48])(-)(0?2)(-)(29)$)|(^([1][89][2468][048])(-)(0?2)(-)(29)$)|(^([2-9][0-9][2468][048])(-)(0?2)(-)(29)$)|(^([1][89][13579][26])(-)(0?2)(-)(29)$)|(^([2-9][0-9][13579][26])(-)(0?2)(-)(29)$))/;

//==============================================================


//浏览器类型检查
function browserType(){
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
    var isOpera = userAgent.indexOf("Opera") > -1;
    if (isOpera) {
        // alert("Opera");
    }; //判断是否Opera浏览器
    if (userAgent.indexOf("Firefox") > -1) {
        alert("使用Firefox浏览器无法正确输入日期时间，建议更换浏览器访问本页面，如Chrome浏览器。");
    } //判断是否Firefox浏览器
    if (userAgent.indexOf("Chrome") > -1){
  		// alert("Chrome");
 	}
    if (userAgent.indexOf("Safari") > -1) {
        // alert("Safari");
    } //判断是否Safari浏览器
    if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
        alert("使用IE浏览器无法正确输入日期时间，建议更换浏览器访问本页面，如Chrome浏览器。");
    }; //判断是否IE浏览器
}



function loginChk(){
  var username = document.getElementById("username").value;
  var pwd = document.getElementById("password").value;
  
  if(username == "" || pwd == ""){
    alert("用户名或密码不能为空");
		return false;
  }

  if(!emailReg.test(username) && !mobileReg.test(username)){
    alert("用户名应为合法的邮件地址");
    return false;
  }

 document.getElementById("password").value = hex_md5(document.getElementById("password").value);
}


function regChk(){
	var username = document.getElementById("usernamesignup").value;
	var dep = document.getElementById("depsignup").value;
	var mobile = document.getElementById("mobilesignup").value;
	var ID_Card = document.getElementById("ID_Cardsignup").value;
	var email = document.getElementById("emailsignup").value;
	var pwd = document.getElementById("passwordsignup").value;
	var pwd_confirm = document.getElementById("passwordsignup_confirm").value;

	if(username == ""){
		alert("用户名不能为空");
		return false;
	}

	if(dep == ""){
		alert("单位不能为空");
		return false;
	}

	if(!mobileReg.test(mobile)){
		alert("请输入中国大陆地区11为手机号码");
		return false;
	}

	if(!ID_CardReg.test(ID_Card)){
		alert("请输入15位或18位中国大陆地区身份证编号");
		return false;
	}

	if(!emailReg.test(email)){
		alert("请输入合法的邮件地址");
		return false;
	}

	if(pwd == ""){
		alert("请输入密码");
		return false;
	}else if(strlen(pwd) < 6){
                alert("密码长度应不小于6位");
                return false;
        }else if(pwd != pwd_confirm){
		alert("两次输入密码不符！");
		return false;
	}

  
	document.getElementById("passwordsignup").value = hex_md5(document.getElementById("passwordsignup").value);
	document.getElementById("passwordsignup_confirm").value = hex_md5(document.getElementById("passwordsignup_confirm").value);

}

function delcfm() {
    if (!confirm("确认要删除？")) {
        window.event.returnValue = false;
    }
}

function passcfm() {
    if (!confirm("确认通过本项审核？")) {
        window.event.returnValue = false;
    }
}

function stopcfm() {
    if (!confirm("确认不通过本项审核？")) {
        window.event.returnValue = false;
    }
}

function randomString(len) {
　　len = len || 32;
　　var $chars = 'QWERTYUIOPLKJHGFDSAZXCVBNMqwertyuioplkjhgfdsazxcvbnm1234567890';
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}

//判断字符串长度
function strlen(str){
    var len = 0;
    for (var i=0; i<str.length; i++) { 
        var c = str.charCodeAt(i); 

        if ((c >= 0x0001 && c <= 0x007e) || (0xff60<=c && c<=0xff9f)) { 
            len++; 
        } 
        else { 
            len+=2; 
        } 
    } 
    return len;
}

//科研申请格式验证
function repChk(){
	var title = document.getElementById("title").value;
	var place = document.getElementById("place").value;
	var route = document.getElementById("route").value;
	var start_year = document.getElementById("start_year").value;
	var start_month = document.getElementById("start_month").value;
	var start_day = document.getElementById("start_day").value;

	var start_date = start_year+'-'+start_month+'-'+start_day;

	var end_year = document.getElementById("end_year").value;
	var end_month = document.getElementById("end_month").value;
	var end_day = document.getElementById("end_day").value;

	var end_date = end_year+'-'+end_month+'-'+end_day;

	if(title == ""){
		alert("请输入本次科研任务的主题");
		window.event.returnValue = false;
	}else if(place == ""){
		alert("请输入本次科研任务的具体地点");
		window.event.returnValue = false;
	}else if(route == ""){
		alert("请输入本次科研任务的路线");
		window.event.returnValue = false;
	}else if(!date.test(start_date)){
		alert("开始日期非法！");
		window.event.returnValue = false;
	}else if(!date.test(end_date)){
		alert("结束日期非法！");
		window.event.returnValue = false;
	}

	if(document.getElementById("submit_year")){
		var submit_year = document.getElementById("submit_year").value;
		var submit_month = document.getElementById("submit_month").value;
		var submit_day = document.getElementById("submit_day").value;

		var submit_date = submit_year+'-'+submit_month+'-'+submit_day;

		if(!date.test(submit_date)){
			alert("成果提交日期非法！");
			window.event.returnValue = false;
		}
	}

}

//检查成员身份证号
function idcardChk(){
	var numOfPeople = document.getElementById("numOfPeople").value;
	for(var i = 0; i < numOfPeople; i++){
		var ID_Card = document.getElementById(i+"ID_Card").value;
		if(!ID_CardReg.test(ID_Card)){
			alert("身份证号("+ID_Card+")非法，请检查输入");
			return false;
		}

		var name = document.getElementById(i+"name").value;
		if(name == ""){
			alert("姓名不得为空");
			return false;
		}
	}
}


//检查提交合同
function fileChk(){
	var uploadfile = document.getElementById("uploadfile").value;

	if(uploadfile == ""){
		alert("请上传文件");
		return false;
	}
	r(); //等待
}


function conExChk(){
	var Contract_Ex = document.getElementById("contract_ex").value;

	if(Contract_Ex == ""){
			alert("请填写邮寄单号");
			return false;
		}
}

function resExChk(){
	var Result_Ex = document.getElementById("result_ex").value;
	
	if(Result_Ex == ""){
			alert("请填写邮寄单号");
			return false;
		}
}

function openingChk(){
	if (!confirm("确定开启/关闭当前系统？")) {
        window.event.returnValue = false;
    }
}

function skipCfm(){
	if (!confirm("确认提交申请？将根据实际同意邀请的人数自动更新参加活动人数。")) {
        window.event.returnValue = false;
    }
}

function subChk(ope){
	ope = ope == undefined ? "" : ope;
	if(!confirm("确认"+ope+"？")){
		window.event.returnValue = false;
	}
}

function clickCfm(string){
	if(!confirm(string)){
		window.event.returnValue = false;
	}
}

//打印
function printpage()
{
	window.print();
}

function volActPubChk(){
	var title = document.getElementById("title").value;

	var start_year = document.getElementById("start_year").value;
	var start_month = document.getElementById("start_month").value;
	var start_day = document.getElementById("start_day").value;

	var start_date = start_year+'-'+start_month+'-'+start_day;

	var end_year = document.getElementById("end_year").value;
	var end_month = document.getElementById("end_month").value;
	var end_day = document.getElementById("end_day").value;

	var end_date = end_year+'-'+end_month+'-'+end_day;

	var place = document.getElementById("place").value;
	var dema_vol = document.getElementById("dema_vol").value;
	var vol_rsct = document.getElementById("vol_rsct").value;

	if (title == "") {
		alert("请填写活动名称");
		return false;
	}else if (!date.test(start_date)) {
		alert("活动开始日期非法");
		return false;
	}else if (!date.test(end_date)) {
		alert("活动结束时间非法");
		return false;
	}else if (place == "") {
		alert("请填写活动地点");
		return false;
	}else if (dema_vol == "") {
		alert("请填写志愿者需求人数");
		return false;
	}else if (vol_rsct == "") {
		alert("请填写志愿者要求");
		return false;
	}else{
		if(!confirm("确认发布该宣传教育活动？")){
			window.event.returnValue = false;
		}
	}
}

//用户信息编辑检查
function userEditChk(){
	var mobile = document.getElementById("mobilesignup").value;
	var ID_Card = document.getElementById("ID_Cardsignup").value;
	var email = document.getElementById("emailsignup").value;
	var pwd = document.getElementById("newpwd").value;
	var pwd_confirm = document.getElementById("newpwdcfm").value;

	if(!mobileReg.test(mobile)){
		alert("请输入中国大陆地区11为手机号码");
		window.event.returnValue = false;
	}

	if(!ID_CardReg.test(ID_Card)){
		alert("请输入15位或18位中国大陆地区身份证编号");
		window.event.returnValue = false;
	}

	if(!emailReg.test(email)){
		alert("请输入合法的邮件地址");
		window.event.returnValue = false;
	}

	if (pwd != "") {
		if(strlen(pwd) < 6){
            alert("密码长度应不小于6位");
            window.event.returnValue = false;
        }else if(pwd != pwd_confirm){
			alert("两次输入密码不一致！");
			window.event.returnValue = false;
		}else{
			document.getElementById("newpwd").value = hex_md5(pwd);
			document.getElementById("newpwdcfm").value = hex_md5(newpwdcfm);
		}
	}
}

//添加活动成员检测
function addMemChk(){
	var memname = document.getElementById("memname").value;
	var memtype = document.getElementById("memtype").value;
	var memsex = document.getElementById("memsex").value;
	var memmobile = document.getElementById("memmobile").value;
	var mememail = document.getElementById("mememail").value;
	var memidcard = document.getElementById("memidcard").value;
	var memdep = document.getElementById("memdep").value;
	var memsecdep = document.getElementById("memsecdep").value;
	var memmajor = document.getElementById("memmajor").value;
	var memcretype = document.getElementById("memcretype").value;
	var memcreid = document.getElementById("memcreid").value;

	if(memname == ""){
		alert("请输入成员姓名");
		return window.event.returnValue = false;
	}

	// if(memtype == ""){
	// 	alert("请输入成员类别");
	// 	return window.event.returnValue = false;
	// }
	
	// if(memsex == ""){
	// 	alert("请输入成员性别");
	// 	return window.event.returnValue = false;
	// }

	if(!mobileReg.test(memmobile)){
		alert("请输入合法手机号");
		return window.event.returnValue = false;
	}

	if(!emailReg.test(mememail)){
		alert("请输入合法的邮件地址");
		return window.event.returnValue = false;
	}

	if(!ID_CardReg.test(memidcard)){
		alert("请输入合法的成员身份证号");
		return window.event.returnValue = false;
	}

	if(memdep == ""){
		alert("请输入成员所属单位");
		return window.event.returnValue = false;
	}

	if(memsecdep == ""){
		alert("请输入成员所属二级单位");
		return window.event.returnValue = false;
	}

	if(memmajor == ""){
		alert("请输入成员专业");
		return window.event.returnValue = false;
	}

	// if(memcretype == ""){
	// 	alert("请输入成员证件类型");
	// 	return window.event.returnValue = false;
	// }

	if(memcreid == ""){
		alert("请输入成员证件号码");
		return window.event.returnValue = false;
	}
}

//下载文件
function downloadfile(url){
	window.open(url);
}

function skip(url){
	window.open(url);
}

//弹出窗口,窗口内容为URL指向的HTML文件
function openDialog(url)
{
	var diag = new Dialog();
	diag.Width = 605;
	diag.Height = 330;
	diag.Title = "人员信息";
	diag.URL = url;
	diag.show();
}

//转圈圈,等待
function r(){
  function ProgressBarWin8(){ 
    // 圆心坐标 
    this.fixed = { 
      left: 0, 
      top: 0
    }; 
    // html标签元素坐标 
    this.position = { 
      left: 0, 
      top: 0
    }; 
    this.radius = 50; // 圆半径 
    this.angle = 270; // 角度,默认270 
    this.delay = 20; // 定时器延迟毫秒 
    this.timer = null; // 定时器时间对象 
    this.dom = null; // html标签元素 
    // html标签元素样式， position需设置成absolute 
    this.style = { 
      position:"absolute", 
      width:"6px", 
      height:"6px", 
      background:"#000", 
      "border-radius":"5px" 
    }; 
  } 
 
  ProgressBarWin8.prototype={
    run:function(){
      if(this.timer){
        clearTimeout(this.timer); 
      } 
         
      // 设置html标签元素坐标，即计算圆上的点x,y轴坐标 
      this.position.left = Math.cos(Math.PI*this.angle/180)*this.radius + this.fixed.left; 
      this.position.top = Math.sin(Math.PI*this.angle/180)*this.radius + this.fixed.top; 
      this.dom.style.left = this.position.left + "px"; 
      this.dom.style.top = this.position.top + "px"; 
 
      //改变角度 
      this.angle++; 
      //判断元素x与圆心x坐标大小，设置定时器延迟时间 
      if(this.position.left < this.fixed.left){ 
        this.delay += .5; 
      } 
          else{ 
        this.delay -= .5; 
      } 
 
      var scope = this; 
      // 定时器，循环调用run方法，有点递归的感觉 
      this.timer = setTimeout(function () { 
        // js中函数的调用this指向调用者，当前this是window 
        scope.run(); 
      }, this.delay); 
    }, 
    // html标签元素初始设置 
    defaultSetting: function () { 
      // 创建一个span元素 
      this.dom = document.createElement("span"); 
      // 设置span元素的样式，js中对象的遍历是属性 
      for(var property in this.style){ 
        // js中对象方法可以用.操作符，也可以通过键值对的方式 
        this.dom.style[property] = this.style[property]; 
      } 
      //innerWidth innerHeight窗口中文档显示区域的宽度，不包括边框和滚动条,该属性可读可写。 
      //设置圆心x,y轴坐标，当前可视区域的一般，即中心点 
      this.fixed.left = window.innerWidth / 2; 
      this.fixed.top = window.innerHeight / 2; 
      // 设置span元素的初始坐标 
      this.position.left = Math.cos(Math.PI*this.angle / 180) * this.radius + this.fixed.left; 
      this.position.top = Math.sin(Math.PI*this.angle / 180) * this.radius + this.fixed.top; 
      this.dom.style.left = this.position.left + "px"; 
      this.dom.style.top = this.position.top + "px"; 
      // 把span标签添加到documet里面 
      document.body.appendChild(this.dom); 
      // 返回当前对象 
      return this; 
    } 
  }; 
 
  var progressArray = [], 
  tempArray = [],
  timer = 200; 
 
  for (var i=0;i< 5;++i){ 
    progressArray.push(new ProgressBarWin8().defaultSetting()); 
  } 
 
  Array.prototype.each=function(fn){ 
    for(var i=0, len=this.length;i<len;){ 
      fn.call(this[i++],arguments);
    } 
  }; 
 
  window.onresize=function(){ 
    tempArray.each(function () { 
      this.fixed.left = window.innerWidth / 2; 
      this.fixed.top = window.innerHeight / 2; 
    }); 
  }; 
 
  timer=setInterval(function() { 
    if(progressArray.length <= 0){ 
      clearInterval(timer); 
    } 
    else { 
      var entity = progressArray.shift(); 
      tempArray.push(entity); 
      entity.run(); 
    } 
  },timer);
}


function autoIframeHeight(iframeId, minHeight){
	var browserVersion = window.navigator.userAgent.toUpperCase();
	var isOpera = false;
	var isFireFox = false;
	var isChrome = false;
	var isSafari = false;
	var isIE = false;
	var iframeTime;
	function reinitIframe(iframeId, minHeight) {
	    try {
	        var iframe = document.getElementById(iframeId);
	        var bHeight = 0;
	        if (isChrome == false && isSafari == false)
	            bHeight = iframe.contentWindow.document.body.scrollHeight;

	        var dHeight = 0;
	        if (isFireFox == true)
	            dHeight = iframe.contentWindow.document.documentElement.offsetHeight + 2;
	        else if (isIE == false && isOpera == false)
	            dHeight = iframe.contentWindow.document.documentElement.scrollHeight;
	        else
	            bHeight += 3;
	        var height = Math.max(bHeight, dHeight);
	        if (height < minHeight) height = minHeight;
	        iframe.style.height = height + "px";
	    } catch (ex) { }
	}
	function startInit(iframeId, minHeight) {
	    isOpera = browserVersion.indexOf("OPERA") > -1 ? true : false;
	    isFireFox = browserVersion.indexOf("FIREFOX") > -1 ? true : false;
	    isChrome = browserVersion.indexOf("CHROME") > -1 ? true : false;
	    isSafari = browserVersion.indexOf("SAFARI") > -1 ? true : false;
	    if (!!window.ActiveXObject || "ActiveXObject" in window)
	        isIE = true;
	    reinitIframe(iframeId, minHeight);
	    if (iframeTime != null)
	        clearInterval(iframeTime)
	    iframeTime = window.setInterval("reinitIframe('" + iframeId + "'," + minHeight + ")", 100);
	}
}