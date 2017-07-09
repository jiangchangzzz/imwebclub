import '../stylesheets/reset.less';
import '../stylesheets/ui.less';
import '../stylesheets/font-awesome/css/font-awesome.less';
import '../stylesheets/iconfont.less';
import '../stylesheets/base.less';
import '../stylesheets/common.less';
import '../stylesheets/header.less';
import '../stylesheets/footer.less';
import '../stylesheets/banner.less';
import '../stylesheets/sidebar.less';

var sign = require('../javascripts/common/sign.js');
require('../javascripts/common/ui.js');
//二级菜单
ui.attachDropdownLayer($('#nav-team-menu'), {
    layer: '#nav-team-menu-layer',
    left: 0,
    top: 80,
    width: $('#nav-team-menu').width()
});
//展示和隐藏登录框
$(document).on('click', '.nav-login', function() {
    $('.to-login').show();
    $('.to-sign').hide();
    $(".modal.login").show();
});
$(document).on('click', '.nav-sign', function() {
    $('.to-sign').show();
    $('.to-login').hide();
    $(".modal.login").show();
});
$(document).on('click', '.modal-close', function() {
    $('.modal').hide();
});

$(document).ready(function(){
  //注册、登录
  sign.init();
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
            alert('请先登录，登录后即可点赞。');
        } else if(xhr.status >= 500) {
            alert('系统异常，请稍候重试。');
        } else {
            alert('系统错误，请稍候重试。');
        }
    }
});
//二维码

$(document).ready(function(){
    $('#column-list').delegate('.column-follow','click',function(){
        var link=$(this);
        var cid=link.data('cid');

        $.ajax({
            url: '/operate/follow',
            type: 'post',
            data: {
                object_id: cid,
                kind: 'column'
            },
            success: function(data){
                if(data.ret===0){
                   link.removeClass('link').text('已关注');
                   var count=link.parent().siblings('.center').find('.follow-count');
                   var follow=parseInt(count.text());
                   count.text(follow+1);
                }
                else if(data.msg){
                    console.log(data.msg);
                }
            },
            error: function(data){
                console.log(msg);
            }
        })
    });
});

