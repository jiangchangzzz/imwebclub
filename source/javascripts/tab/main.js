//首页入口逻辑

define([
	'../common/base.js',
	'../common/userSlider.js',
    '../common/signin.js',
	'../libs/fancybox/jquery.fancybox.pack.js',
    '../header/header.js',
    '../issue/issue.js'
], function(Base, userSlider, signin){
    console.log("tab init");
	//用户侧边栏初始化
	userSlider.init();
    signin.init();

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

});