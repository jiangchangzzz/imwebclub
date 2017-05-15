$(document).ready(function(){
  $('.focus-add').on('click',function() {
      var $this = $(this);
      var followUser_id = $this.attr('userid');
      var fllower_num = parseInt($this.parents('li').find('.flowers_num').html(), 10);
      imweb.ajax.post('/user/follow', {
        data: {
          followUser_id
        }
      }).done(function(){
        $this.removeClass('focus-add, link').html('<a href="javascript:void(0);">已关注</a>');
        $this.parents('li').find('.flowers_num').html(++fllower_num);
        // var floower
      })
    })

    $('.activity-tab').on('click', function (e) {
        var $this = $(this),
            index = $this.index();
        $(this).addClass('active').siblings('a').removeClass('active');
        $('.column-body .activity-list').addClass('hide').eq(index).removeClass('hide');
    });
})

