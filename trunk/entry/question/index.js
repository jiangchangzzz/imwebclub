import '../../stylesheets/question/index.less';
import '../../stylesheets/reply.less';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';

$(document).ready(function(){
    var me = window.replyAction;
    me.initReplyList('question', imweb.question.id, imweb.question.author, imweb.question.replies);
    me.initEditor('.reply-panel .editor');
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
 * 删除问答
 */
$(document).on('click', '.delete-question-btn', function(e) {
  var questionId = imweb.question.id;
  if (!confirm('确定要删除此问答吗？')) {
      return ;
  }
  imweb.ajax.post('/question/' + questionId + '/delete')
      .done(function(data) {
          if (data.ret === 0) {
              location.reload();
          } else if (data.msg) {
              alert(data.msg);
          }
      });
});
