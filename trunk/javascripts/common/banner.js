define([
    '../libs/jquery.slider.js',
], function(){
 var windowWidth = window.innerWidth;
    if(windowWidth <= 1200){
        var bannerHeight = windowWidth /1200 * 330;
        $("#sliderbox li a").css({
            width:windowWidth + "px",
            height:bannerHeight + "px"
        });
        $("#banner_wrap").css({
          height: bannerHeight + 'px'
        });

    }
    $("#banner_wrap").slider({
        pb:$("#prev-btn"), //下一个按钮
        nb:$("#next-btn"), //上一个按钮
        sliderbox: $("#sliderbox"), //ul节点
        slidernav: $(".sliderNav"), //nav小点
        sliderbg : $("#banner-container"),
        sliderNum: 1, //每次滑动块数,默认为1
        isAuto:true, //是否自己滚动，默认为false
        sliderCb:function(cur, pre){} //切换回调，cur为当前页，pre为切换前页
    });
});
