define([
	'../template/tplPublishBtn.js',
	'../template/tplReprint.js',
	'../template/tplGithubPro.js'
], function(tplPublishBtn, tplReprint, tplGithubPro){

	var _canPost = false;
	var _tab = "";
	var _link = "";
	var _publishType = 0; //0-转载；1-项目
	var _isBind = false;

	var _tabs = [
	    ['html', 'HTML&HTML5'],
	    ['rebuild', 'CSS/重构'],
	    ['network', 'HTTP网络'],
	    ['secure', 'Web安全'],
	    ['browser', '浏览器'],
	    ['debug', '调试'],
	    ['build', '构建工具'],
	    ['performance', '性能'],
	    ['lib', '前端库'],
	    ['dev', '开发模式'],
	    ['node', 'nodeJS全栈'],
	    ['mobile', '移动开发'],
	    ['tools', '工具建设'],
	    ['op', '运营']
	];

	var hideHandle = function(){
		$(".user-slider-glass").remove();
		$(".reprint-wrap").remove();
	}

	var _cgi = {
		reprint: function(param){
			imweb.ajax.post('/topic/reprint', {
	            data: param
	        }).done(function(result) {
	            window.open("/topic/"+result.tid);
	        });
	        hideHandle();
	        alert("数据正在提交中，文章存储完成后将自动为您打开。");
		},
		githubPro: function(param){
			imweb.ajax.post('/topic/save', {
	            data: param
	        }).done(function(result) {
	            location.reload();
	        });
		}
	}

	var check = function(){
		var link = $(".body-input").val();
		var isLink = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link);
		var isTab = $(".reprint-wrap .current-tab").data("val");
		_tab = isTab;
		_canPost = isLink && isTab;

		if(_publishType == 1){
			var isGithub = link.indexOf("github.com") > 0;
			_canPost = _canPost && isGithub;
		}
		if(_canPost){
			$(".js-reprint-publish").removeClass("ui-disabled");
		}else{
			$(".js-reprint-publish").addClass("ui-disabled");
		}
		return _canPost;
	}

	var bind = function(){
		$(".js-reprint-cancel").bind("click", hideHandle);

		$(".body-input").bind("input propertychange", function(){
			_link = $(".body-input").val();
			if(_link == ""){
				$(".body-link").show();
			}else{
				$(".body-link").hide();
				_canPost = check();
			}
		});

		$(".reprint-wrap").find(".topic-tab").bind("click", function(){
			$(".reprint-wrap .current-tab").removeClass("current-tab");
			$(this).addClass("current-tab");
			_canPost = check();
		});

		$(".js-reprint-publish").bind("click", function(){
			if(_canPost){
				if(_publishType == 0){
					_cgi.reprint({
						tab: _tab,
						link: _link,
						reprint: !$("#ismine")[0].checked,
					});
				}else{
					_cgi.githubPro({
						tab: _tab,
						title: _link,
						content: $("#githubDes").val(),
						json: true,
						type: 1
					});
				}
				
			}
		});

	}

	var showGlass = function(){
		$("body").append($("<div class='user-slider-glass'></div>"));
		$(".user-slider-glass").css({"opacity": 1});
	}

	var hideView= function(){
		$(".post-type-icon").addClass("fadeOut");
		$(".post-type-name").addClass("fadeOut");
		$(".user-slider-glass").fadeOut(300, function(){
			$(this).remove();
		});
		setTimeout(function(){
			$(".publish-wrap").html("");
		}, 300);
	}
	var showView = function(){
		showGlass();
		//$(".publish-wrap").html(imweb.template('publish-btns', {}));
		$(".publish-wrap").html(tplPublishBtn());

		setTimeout(function(){
			$(".post-type-icon").addClass("fadeIn");
			$(".post-type-name").addClass("fadeIn");
		}, 20);
		$(".post-tab-switching").bind("click", function(e){
			var target = $(e.target);
			if(target.hasClass("post-tab-switching")){
				hideView();
			}
		});
		$(".tab-post-type.item").bind("click", function(e){
			var target = $(this);
			var type = target.attr("data-post-type");
			if(type == "topic"){
				window.open("/marktang/index?autoOpenInfo=true");
				hideView();
			}else{
				if(type == "reprint"){
					_publishType = 0;
					$("body").append(tplReprint({
						tabs: _tabs
					}));
				}else if(type == "githubPro"){
					_publishType = 1;
					$("body").append(tplGithubPro({
						tabs: _tabs
					}));
				}
				hideView();
				showGlass();
				$(".reprint-wrap").fadeIn();
				bind();
			}
		});
	}

	return {
		init: function(dom){
			$(".js-btn-publish").bind("click", showView);
		}
	}
});