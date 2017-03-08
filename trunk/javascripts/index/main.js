//首页入口逻辑

define([], function(){
    $(document).on('click', '.user-login-btn', function(){
      //展示登录框
      $(".login-wrapper").show();
    });
    $(document).on('click', '.not-sign-close', function(){
      //隐藏登录框
      $(".login-wrapper").hide();
    });
    /*注册与登录来回切换*/
    $(document).on('click', '.js-to-sign', function(){
      $(".to-login").fadeOut("fast", function(){$(".to-sign").fadeIn()});
    });
		$(document).on('click', '.js-to-login', function(){
			$(".to-sign").fadeOut("fast", function(){$(".to-login").fadeIn()});
		});
});
