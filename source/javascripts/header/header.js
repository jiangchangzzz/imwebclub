//首页入口逻辑

define([], function(){
    
    var $navWrap = $('.modules-list');

    $navWrap.on('click', '.modules-list-item', function(){
        $navWrap.find('.modules-list-item').removeClass('modules-list-item-active');
        $(this).addClass('modules-list-item-active');
    });


})