import '../../stylesheets/banner.less';
import '../../stylesheets/sidebar.less';
import '../../stylesheets/topic/index.less';
import '../../stylesheets/reply.less';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';

$(document).ready(function(){
    var me = window.replyAction;
    me.initReplyList();
    me.initEditor($('.topic-reply-panel .editor'));
    $('.reply-submit').click(_.bind(me.replySubmit, me));
    $('#content').on(
        'click',
        '.sub-reply-submit',
        _.bind(me.subReplySubmit, me)
    ).on(
        'click',
        '.delete-reply',
        _.bind(me.deleteReply, me)
    ).on(
        'click',
        '.up-reply',
        _.bind(me.upReply, me)
    ).on(
        'click',
        '.open-sub-reply',
        _.bind(me.openSubReply, me)
    );
});

/**
 * 收藏文章
 */
$(document).on('click', '.collect-topic-btn', function(e) {
  var $ele = $(e.target);
  var cancelVal = $ele.data('cancel');
  var cancel = cancelVal.toString() === 'true';
  var topicId = imweb.topic.id;
  imweb.ajax.post('/topic/collect', {
      data: {
          cancel: cancel,
          topic_id: topicId
      }
  }).done(function(data) {
      if (data.ret === 0) {
          cancel = !cancel;
          $ele.attr('title', cancel ? '取消收藏' : '收藏');
          $ele.data('cancel', cancel);
          $ele.toggleClass('fa-heart').toggleClass('fa-heart-o');
          $('.topic-collect-count').html(data.data.topicCollectCount);
      }
  });
});
/**
 * 删除文章
 */
$(document).on('click', '.delete-topic-btn', function(e) {
  var topicId = imweb.topic.id;
  if (!confirm('确定要删除此话题吗？')) {
      return ;
  }
  imweb.ajax.post('/topic/' + topicId + '/delete')
      .done(function(data) {
          if (data.ret === 0) {
              location.reload();
          } else if (data.msg) {
              alert(data.msg);
          }
      });
});
