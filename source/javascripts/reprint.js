var Reprint = (function(){

	var _canPost = false;
	var _tab = "";
	var _link = "";

	var hideHandle = function(){
		$(".user-slider-glass").remove();
		$(".reprint-wrap").remove();
	}

	var save = function(param){
		imweb.ajax.post('/topic/reprint', {
            data: param
        }).done(function(result) {
            window.open("/topic/"+result.tid);
        });
        hideHandle();
        alert("数据正在提交中，文章存储完成后将自动为您打开。");
	}

	var check = function(){
		var link = $(".body-input").val();
		var isLink = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link);
		var isTab = $(".reprint-wrap .current-tab").data("val");
		_tab = isTab;
		_canPost = isLink && isTab;
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
				save({
					tab: _tab,
					link: _link,
					reprint: !$("#ismine")[0].checked,
				});
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
		$(".publish-wrap").html(imweb.template('publish-btns', {}));
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
			}else if(type == "reprint"){
				hideView();
				showGlass();
				$("body").append(imweb.template('publish-reprint', {}));
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
})();