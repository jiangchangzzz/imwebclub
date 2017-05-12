import '../../stylesheets/banner.less';
import '../../stylesheets/sidebar.less';
import '../../stylesheets/topic/index.less';
import '../../stylesheets/reply.less';
import '../../stylesheets/markdowntext.css';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/layout';
import '../../javascripts/common/reply.js';

function initReplies(replies){
  var me = window.replyAction;
  $('#reply-list').empty();
  me.initReplyList('topic', imweb.topic.id, imweb.topic.author, replies);
}

$(document).ready(function(){
    var me = window.replyAction;
    initReplies(imweb.topic.replies);
    me.initEditor('.editor-wrap .editor');
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
        '.updown .fa',
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
  var topicId = imweb.topic.id;
  imweb.ajax.post('/topic/'+topicId+'/collect').done(function(data) {
      if (data.ret === 0) {
        $ele.toggleClass('fa-heart').toggleClass('fa-heart-o');
        $ele.attr('title', $ele.hasClass('fa-heart') ? '取消收藏' : '收藏');
        $('.collect-count').text(data.data.objectCollectCount);
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
