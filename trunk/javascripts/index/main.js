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

    $('.activity-tab').on('click', function (e) {
        var $this = $(this),
            index = $this.index();
        $(this).addClass('active').siblings('a').removeClass('active');
        $('.column-body .activity-list').addClass('hide').eq(index).removeClass('hide');
    });
})

