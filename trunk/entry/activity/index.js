import '../../stylesheets/sidebar.less';
import '../../stylesheets/activity/index.less';
import '../../stylesheets/marktang/markdowntext.css';

/**
 * 收藏活动
 */
$(document).on('click', '.collect-activity-btn', function(e) {
  var $ele = $(e.target);
  var activityId = imweb.activity.id;
  imweb.ajax.post('/operate/collect', {
      data: {
          kind: 'activity',
          object_id: activityId
      }
  }).done(function(data) {
      if (data.ret === 0) {
        $ele.toggleClass('fa-heart').toggleClass('fa-heart-o');
        $ele.attr('title', $ele.hasClass('fa-heart') ? '取消收藏' : '收藏');
        $('.collect-count').text(data.data.objectCollectCount);
      }
  });
});

/**
 * 删除活动
 */
$(document).on('click', '.delete-activity-btn', function(e) {
  var activityId = imweb.activity.id;
  if (!confirm('确定要删除此话题吗？')) {
      return ;
  }
  imweb.ajax.post('/activity/' + activityId + '/delete')
      .done(function(data) {
          if (data.ret === 0) {
              location.reload();
          } else if (data.msg) {
              alert(data.msg);
          }
      });
});
