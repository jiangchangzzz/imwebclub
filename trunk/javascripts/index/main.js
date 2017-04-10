$(document).ready(function(){
  $('.focus-add').on('click',function() {
      var $this = $(this);
      var followUser_id = $this.parent().parent().attr('title');
      imweb.ajax.post('/user/follow', {
        data: {
          followUser_id
        }
      }).done(function(){
        $this.html('<a href="javascript:void(0);">已关注</a>');
      })
    })
})



//首页入口逻辑
/*
define(['../common/sign.js','../common/ui.js'], function(sign) {
    
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
*/
