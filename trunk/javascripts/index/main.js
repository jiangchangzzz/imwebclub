//首页入口逻辑

define(['../common/ui.js'], function() {
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
    //注册与登录来回切换
    $(document).on('click', '.js-to-sign', function() {
        $('.to-login').fadeOut('fast', function() {
            $('.to-sign').fadeIn()
        });
    });
    $(document).on('click', '.js-to-login', function() {
        $(".to-sign").fadeOut('fast', function() {
            $('.to-login').fadeIn()
        });
    });
    /*菜单悬浮效果
    $(document).on({
        mouseenter: function() {
            $(this).addClass('active');
        },
        mouseleave: function() {
            $(this).removeClass('active');
        }
    }, '.menu-list li');
    */
});
