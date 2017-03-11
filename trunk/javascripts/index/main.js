//首页入口逻辑

define([], function() {
    //展示和隐藏登录框
    $(document).on('click', '.user-login-btn', function() {
        $(".login-wrapper").show();
    });
    $(document).on('click', '.not-sign-close', function() {
        $(".login-wrapper").hide();
    });
    //注册与登录来回切换
    $(document).on('click', '.js-to-sign', function() {
        $(".to-login").fadeOut('fast', function() {
            $('.to-sign').fadeIn()
        });
    });
    $(document).on('click', '.js-to-login', function() {
        $(".to-sign").fadeOut('fast', function() {
            $('.to-login').fadeIn()
        });
    });
    //菜单悬浮效果
    $(document).on({
        mouseenter: function() {
            $(this).addClass('active');
        },
        mouseleave: function() {
            $(this).removeClass('active');
        }
    }, '.menu-list li');
});
