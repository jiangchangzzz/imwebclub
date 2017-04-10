import '../stylesheets/reset.less';
import '../stylesheets/ui.less';
import '../stylesheets/font-awesome/css/font-awesome.less';
import '../stylesheets/iconfont.less';
import '../stylesheets/base.less';
import '../stylesheets/common.less';
import '../stylesheets/header.less';
import '../stylesheets/footer.less';

var sign = require('../javascripts/common/sign.js');
require('../javascripts/common/ui.js');
//二级菜单
ui.attachDropdownLayer($('#nav-team-menu'), {
    layer: '#nav-team-menu-layer',
    left: 0,
    top: 80,
    width: $('#nav-team-menu').width()
});
if($('#nav-post-menu').length > 0){
  ui.attachDropdownLayer($('#nav-post-menu'), {
      layer: '#nav-post-menu-layer'
  });
}
if($('#nav-user-menu').length > 0){
  ui.attachDropdownLayer($('#nav-user-menu'), {
      layer: '#nav-user-menu-layer'
  });
}
//展示和隐藏登录框
$(document).on('click', '.nav-login', function() {
    $('.to-login').show();
    $('.to-sign').hide();
    $(".login-wrapper").show();
});
$(document).on('click', '.nav-sign', function() {
    $('.to-sign').show();
    $('.to-login').hide();
    $(".login-wrapper").show();
});
$(document).on('click', '.not-sign-close', function() {
    $('.login-wrapper').hide();
});

$(document).ready(function(){
  //注册、登录
  sign.init();
  //修改rich meta
  // var rich_name = $('meta[itemprop = "name"]');
  // var rich_description = $('meta[itemprop = "description"]');
  // var rich_image = $('meta[itemprop = "image"]');
  // rich_name.attr("content","imweb前端社区文章：" + RICH_META.name);
  // rich_description.attr("content",RICH_META.author +":" +RICH_META.name);
  // rich_image.attr("content",RICH_META.img);
});

// ajax common
imweb.ajax = {};
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
    delete: function(url, options) {
      options = options || {};
      return $.ajax(url, $.extend({
        type: 'DELETE'
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
//二维码