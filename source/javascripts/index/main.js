//首页入口逻辑

define([
    '../common/base.js',
    '../common/userSlider.js',
    '../common/signin.js',
    '../libs/fancybox/jquery.fancybox.pack.js',
    '../header/header.js'
], function(Base, userSlider, signin){

	//用户侧边栏初始化
	userSlider.init();

	//fancybox初始化
	if ($(".fancybox").length) {
        $(".fancybox").fancybox();
    }
    
    //lazyload初始化
    if ($("#topic_list").length) {
        $("#topic_list").lazyload({
            size: [200, 120]
        });
    }
    //signin
    signin.init();

    var bind = function(){
        $(".js-topic-del").click(function(e){
            if (!confirm('确定要删除此话题吗？')) {
                return ;
            }
            var $target = $(this);
            imweb.ajax.post('/topic/' + $target.attr("data-tid") + '/delete')
            .done(function(data) {
                if (data.ret === 0) {
                    $target.closest(".cell").remove();
                } else if (data.msg) {
                    alert(data.msg);
                }
            });
        });
    };
    bind();

    var $navWrap = $('.modules-list')/*,
        $issueRank = $('#issue-rank')*/;

    $navWrap.on('click', '.modules-list-item', function(){
        $navWrap.find('.modules-list-item').removeClass('modules-list-item-active');
        $(this).addClass('modules-list-item-active');
    });

    // $issueRank.on('click','.issue-item', function(){
    //     window.open($(this).data('href'));
    // });
    
    var $sortTab = $('.sort-tab');
    var getSort = function() {
        var m = window.location.pathname.split('/');
        return m.length && m[m.length-1];
    };
    var sortMap = {
        'reply': '-top -good -last_reply_at',
        'create': '-top -create_at',
        'good': '-good -visit_count',
        'good_top': '-good -top -visit_count',
        'top_good': '-top -good -visit_count',
        'default': '-top -good -last_reply_at'
    };
    var currentType = getSort() || 'default';
    currentType = sortMap[currentType] ? currentType : 'default';

    $sortTab.removeClass('z-active');
    $('.sort-tab[data-type="' + currentType + '"]').addClass('z-active');

    $sortTab.click(function(e) {
        if ($(this).hasClass('z-active')) {
            return false;
        }
    });

});