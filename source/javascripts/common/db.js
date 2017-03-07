define([], function(){
	return {
		init: function(){
			// ajax common
			imweb.ajax = imweb.ajax || {};
			$.extend(imweb.ajax, {
			    post: function(url, options) {
			        options = options || {};
			        options.data = $.extend({
			            _csrf: imweb._csrf
			        }, options.data || {});
			        return $.ajax(url, $.extend({
			            method: 'post'
			        }, options));
			    },
			    get: function(url, options) {
			        options = options || {};
			        return $.ajax(url, $.extend({
			            method: 'get'
			        }, options));
			    },
			    fail: function(xhr) {
			        if (xhr.status === 403) {
			            alert('请先登录，登陆后即可点赞。');
			        } else if(xhr.status >= 500) {
			            alert('系统异常，请稍候重试。');
			        } else {
			            alert('系统错误，请稍候重试。');
			        }
			    }
			});

		    // add csrf to form 
		    $('form').submit(function() {
		        if (!$(this).find('*[name=_csrf]').length) {
		            $('<input type="hidden" name="_csrf" />').val(imweb._csrf)
		                .appendTo($(this));
		        };
		    });
		}
	}
});