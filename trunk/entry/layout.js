require('../stylesheets/reset.less');
require('../stylesheets/ui.less');
require('../stylesheets/iconfont.less');
require('../stylesheets/base.less');
require('../stylesheets/common.less');
require('../stylesheets/header.less');
require('../stylesheets/footer.less');

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
$(document).on('click', '.user-login-btn', function() {
    $('.to-login').show();
    $('.to-sign').hide();
    $(".login-wrapper").show();
});
$(document).on('click', '.user-sign-btn', function() {
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
});
