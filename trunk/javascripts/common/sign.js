define([
	'./jquery.validate.min.js',
	'./jquery.mailtip.js'
], function(){

	/*去除chrome自动填表单功能*/
	var disFill = function(){
		$('input:-webkit-autofill').each(function() {
	        $(this).after($(this).clone(true).val('')).remove();
	    });

		var $input = $('input[autocomplete="off"]').val(' ');
		setTimeout(function(){
			$input.val("");
		}, 150);
	}

	/*校验器初始化*/
	var validateInit = function(){
		jQuery.extend(jQuery.validator.messages, {
			required: "不能为空",
			email: "请输入正确的邮箱地址"
		});
		$.validator.setDefaults({
			errorPlacement: function(error, element) {
				$( element ).closest( ".input-box" ).append( error );
			},
			errorElement: "span"
		});
		$("#sign-form-1").validate({
			messages: {
				loginname1: {
					required: "姓名不能为空",
					minlength: "请输入2-15个字",
					maxlength: "请输入2-15个字"
				},
				loginname2: {
					required: "姓名不能为空"
				},
				passw: {
					required: "密码不能为空",
					minlength: "请输入6位以上密码",
					maxlength: "密码过长"
				}
			}
		});
		$("#sign-form-2").validate({
			messages: {
				comp: {
					required: "公司名称不能为空",
				},
			}
		});
	}
	/*事件绑定*/
	var bind = function(){
    var signForm2 = $('#sign-form-2');
		/*注册与登录来回切换*/
		$(".js-to-sign").click(function(){
			$(".to-login").fadeOut("fast", function(){$(".to-sign").fadeIn()});
		});
		$(".js-to-login").click(function(){
			$(".to-sign").fadeOut("fast", function(){$(".to-login").fadeIn()});
		});

		$(".js-to-step2").click(function(){
			var isvalidate=$("#sign-form-1").valid();
			console.log(isvalidate);
			if(isvalidate){
				$(".step1").fadeOut("fast", function(){$(".step2").fadeIn()});
			}
		});
		$(".js-to-step1").click(function(){
			$(".step2").fadeOut("fast", function(){$(".step1").fadeIn()});
		});

		/*自由职业者跳过公司*/
		$(".js-jump").click(function(){
			$(".js-comp").val("");
			$(".js-comp_mail").val("");
			$(".js-submit").trigger("click");
		});

		/*email自动补全*/
		$(".js-email").eq(0).change(function(){
            signForm2.find("[name=email]").val($(".js-email").eq(0).val());
		}).mailtip({
			mails: ['@qq.com', '@gmail.com', '@126.com', '@163.com', '@sina.com', '@hotmail.com', '@yahoo.com'],
	        afterselect: function (mail){
	        	$(".js-email").removeClass("error").closest( ".input-box" ).find("span.error").remove();
                signForm2.find("[name=email]").val($(".js-email").eq(0).val());
	        }
	    });
		/*loginname表单同步*/
    function updateLoginname() {
        var loginname = $(".js-loginname-1").val()
            + $(".js-loginname-2").val();
        signForm2.find("[name=name]").val(loginname);
        signForm2.find("[name=loginname]").val(loginname);
    }
		$(".js-loginname-1").eq(0).change(updateLoginname);
		$(".js-loginname-2").eq(0).change(updateLoginname);
		/*pass表单同步*/
		$(".js-pass").eq(0).change(function(){
            signForm2.find("[name=pass]").val($(this).val());
		});

	}
	return {
		init: function(){
			//disFill();
			validateInit();
			bind();

		}
	}
});
