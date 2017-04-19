import '../../stylesheets/question/index.less';
import '../../stylesheets/reply.less';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';

$(document).ready(function(){
    var me = window.replyAction;
    me.initReplyList('question', imweb.question.id, imweb.question.author, imweb.question.replies, null, function(reply){
      if(reply.answer){
        return '<a href="javascript:;" class="answer btn-ico" data-answer="true"><i class="fa fa-times-circle-o" aria-hidden="true"></i></a>';
      }else{
        return '<a href="javascript:;" class="answer btn-ico" data-answer="false"><i class="fa fa-check-circle-o" aria-hidden="true"></i></a>';
      }
    }, function(reply){
      if(reply.answer){
        return '<div class="status">答案</div>';
      }
    });
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
    ).on(
        'click',
        '.answer',
        _.bind(function(e) {
            var me = this;
            var $ele = $(e.target).closest('.answer');
            var $reply = me._getReplyItem($ele);
            var replyId = $reply.data('replyId');
            var action = $ele.data('answer') ? 'clear' : 'set';
            if (!confirm('确定要将此回复设置为回答吗？')) {
                return;
            }
            imweb.ajax.post('/question/'+me.parentId+'/answer/', {
                data: {
                    action: action,
                    reply_id: replyId,
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    var $others = $ele.closest('.reply-item ').siblings().find('.answer');
                    if($ele.data('answer')){
                      $others.children('i').addClass('fa-times-circle-o').removeClass('fa-check-circle-o');
                      $others.data('answer',true);
                      $ele.children('i').addClass('fa-check-circle-o').removeClass('fa-times-circle-o');
                      $ele.data('answer',false);
                    }else{
                      $others.children('i').removeClass('fa-times-circle-o').addClass('fa-check-circle-o');
                      $others.data('answer',false);
                      $ele.children('i').removeClass('fa-check-circle-o').addClass('fa-times-circle-o');
                      $ele.data('answer',true);
                    }
                } else {
                    alert(data.msg || '');
                }
            }).fail(imweb.ajax.fail);
        },me)
    );
});

/**
 * 收藏问答
 */
$(document).on('click', '.collect-question-btn', function(e) {
  var $ele = $(e.target);
  var questionId = imweb.question.id;
  imweb.ajax.post('/operate/collect', {
      data: {
          kind: 'question',
          object_id: questionId
      }
  }).done(function(data) {
      if (data.ret === 0) {
          $ele.toggleClass('fa-heart').toggleClass('fa-heart-o');
          $ele.attr('title', $ele.hasClass('fa-heart') ? '取消收藏' : '收藏');
          $('.collect-count').html(data.data.objectCollectCount);
      }
  });
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
