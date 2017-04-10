$(document).ready(function(){
  $('.follow-cancel').on('click', function() {
    const $this = $(this);
    const followUser_id = $this.parent().attr('id');
    imweb.ajax.delete('/user/follow', {
      data: {
        followUser_id,
      }
    }).done(function() {
      $this.parent().remove();
    })
  });
})
