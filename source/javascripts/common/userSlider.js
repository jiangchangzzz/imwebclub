/*user slider*/
define([
	'../template/tplUserSliderMain',
	'../template/tplUserSliderList'
], function(tplUserSliderMain, tplUserSliderList){
	

	var userSliderCache = {};

	var tpl = $('<div class="user-slider-wrap">\
	  <div class="slider-main">\
	    <div class="slider-headbg"></div>\
	    <div class="slider-img-wrap">\
	      <img class="ui-avatar ui-avatar-100" src="//gravatar.com/avatar/1b1060c5a2544f4ae03788a00f7c2c93?size=48" title="litten">\
	    </div>\
	  </div>\
	</div>');
	var showTimeline = function(){
		var $timeline_block = $('.cd-timeline-block');
		//hide timeline blocks which are outside the viewport
		$timeline_block.each(function(){
			if($(this).offset().top > $(window).scrollTop()+$(window).height()*0.75) {
				$(this).find('.cd-timeline-img, .cd-timeline-content').addClass('is-hidden');
			}
		});
		//on scolling, show/animate timeline blocks when enter the viewport
		$(".slider-main").on('scroll', function(){
			$timeline_block.each(function(){
				if( $(this).offset().top <= $(window).scrollTop()+$(window).height()*0.75 && $(this).find('.cd-timeline-img').hasClass('is-hidden') ) {
					$(this).find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
				}
			});
		});
		$(".slider-main")[0].scrollTop = 0;

	}
	var clkHandle = function(e){
		$("body").append($("<div class='user-slider-glass'></div>")).css({"overflow":"hidden"});
		$(".user-slider-glass").css({"opacity": 1}).bind("click", hideHandle);
		$(".user-slider-wrap").addClass("user-slider-left2");
		$("#main").addClass("user-slider-left");

		getInfo($(this).data("name"));
	}

	var hideHandle = function(e){
		$("body").css({"overflow":"auto"});
		$(".user-slider-glass").remove();
		$(".user-slider-wrap").removeClass("user-slider-left2");
		$("#main").removeClass("user-slider-left");
		$(".user-slider-wrap").html("");
		var $target = $(e.target);
	}

	var getInfo = function(_name){
		if(userSliderCache[_name]) {
			render(userSliderCache[_name]);
		}

		imweb.ajax.get('/user/' + _name + '/get_user_info', {
            data: {
                name: _name
            }
        }).done(function(result) {
            if (result.ret === 0) {
            	console.log(result.data);
                if(!userSliderCache[_name]) {
                	render(result.data);
                }
                userSliderCache[result.data.name] = result.data;
            }
        });
	}

	var render = function(data){
		//main
		var hideArr = ["company", "location", "signature", "topic"];
		for(var i=0,len=hideArr.length; i<len; i++){
			data[hideArr[i]] = data[hideArr[i]] || "";
		}
		$(".user-slider-wrap").html(tplUserSliderMain(data));
		for(var i=0,arr=hideArr,len=arr.length; i<len; i++){
			if(!data[arr[i]] || data[arr[i]].length == 0){
				$(".js-"+arr[i]).hide();
			}
		}
		//list
		$('#cd-timeline').html("");
		var html = $.map(data.topic, function(item) {
			item.id = item._id;
			//item.create_at = moment(item.create_at).fromNow();
			
			if(item.reprint){
				item.type = "reprint";
				item.icon = "&#xe61e;";
				item.action = "转载了文章";
			}else{
				item.type = "article";
				item.icon = "&#xe613;";
				item.action = "发表了文章";
			}
            return tplUserSliderList(item);
        });
        $('#cd-timeline').append(html);
        showTimeline();
	}

	return {
		init: function(dom){
			dom = dom || $(".user-slider-btn, #user-rank li");
			$(document).on('click', '.user-slider-btn, #user-rank li', clkHandle);
			$(document).on('click', '.user-login-btn', function(){
				//展示登录框
				$(".login-wrapper").show();
			});
			$(document).on('click', '.not-sign-close', function(){
				//隐藏登录框
				$(".login-wrapper").hide();
			});

			// dom.unbind("click").bind("click", clkHandle);
		}
	}
});