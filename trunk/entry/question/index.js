import '../../stylesheets/question/index.less';
import '../../stylesheets/reply.less';
import '../../stylesheets/markdowntext.css';
import '../../stylesheets/monokai_sublime.css';
import '../../stylesheets/ryan-dark.css'
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';
import '../../javascripts/layout';

function initReplies(replies){
  var me = window.replyAction;
  $('#reply-list').empty();
  me.initReplyList('question', imweb.question.id, imweb.question.author, replies, null, function(reply){
    if(imweb.user && (imweb.user.is_admin || imweb.user.id === reply.author.id)){
      if(reply.answer){
        return '<a href="javascript:;" class="answer btn-ico" data-answer="true">取消答案</a>';
      }else{
        return '<a href="javascript:;" class="answer btn-ico" data-answer="false">设为答案</a>';
      }
    }
  }, function(reply){
    if(reply.answer){
      return '<div class="status"><i class="fa fa-check" aria-hidden="true"></i><div class="txt">已采纳</div></div>';
    }
  });
}

$(document).ready(function(){
    //回复
    var me = window.replyAction;
    initReplies(imweb.question.replies);
    me.initEditor('.newComment .editor-wrap .editor');
    $('.reply-submit').click(_.bind(me.replySubmit, me));
    $('#reply-list').on(
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
    ).on(
        'click',
        '.answer',
        _.bind(function(e) {
            var me = this;
            var $ele = $(e.target).closest('.answer');
            var $reply = me._getReplyItem($ele);
            var replyId = $reply.attr('id');
            if (!confirm('确定要将此回复设置为回答吗？')) {
                return;
            }
            imweb.ajax.post('/question/'+me.parentId+'/answer/', {
                data: {
                    action: $ele.data('answer') ? 'clear' : 'set',
                    reply_id: replyId,
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    var $others = $ele.closest('.reply-item').siblings();
                    if($ele.data('answer')){
                      $ele.text('设为答案').data('answer', false);
                      $ele.closest('.reply-item').find('.left-area .status').remove();
                    }else{
                      $others.find('.answer').text('设为答案').data('answer', false);
                      $others.find('.left-area .status').remove();
                      $ele.text('取消答案').data('answer',true)
                      $ele.closest('.reply-item').find('.left-area').append('<div class="status">答案</div>');
                    }
                } else {
                    alert(data.msg || '');
                }
            }).fail(imweb.ajax.fail);
        },me)
    );
});

$(document).on('click', '.sorts li', function(e) {
  var $ele = $(e.target);
  var questionId = imweb.question.id;
  if($ele.hasClass('active')){
    return;
  }
  var sortby = $ele.data('sortby');
  console.log(sortby);
  $('.sorts li').toggleClass('active');
  imweb.ajax.get('/reply/'+questionId+'/query?sortby='+sortby).done(function(data) {
      if (data.ret === 0) {
        initReplies(data.data);
      }
  });
});
$(document).on('click', '.sorts .time', function(e) {
  console.log('time');
  $('.sorts .ups').removeClass('active');
  $('.sorts .time').addClass('active');
});

$(document).on('click', '.detail-content .updown .fa', function(e) {
    var me = this;
    var $ele = $(e.target);
    if (!(imweb.user && imweb.user.loginname)) {
        alert('请登陆。');
        return;
    }
    if(imweb.user.loginname !== imweb.question.author.loginname){
      alert('您无法对自己的评论点赞。');
      return;
    }
    var cancel = $ele.hasClass('fa-caret-down');

    imweb.ajax.post('/operate/up', {
        data: {
            kind: 'question',
            object_id: imweb.question.id,
            cancel: cancel
        }
    }).done(function(data) {
        if (data.ret === 0) {
            $ele.toggleClass('hidden');
            $ele.siblings('.fa').toggleClass('hidden');
            $('.detail-content .updown .count').text(data.data.count);
        } else if (data.msg) {
            alert(data.msg);
        }
    }).fail(imweb.ajax.fail);
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
          $ele.text(data.data.ifCollect ? '取消收藏' : '收藏');
          $('.collect-count').html(data.data.objectCollectCount);
      }
  });
});

/**
 * 关注问答
 */
$(document).on('click', '.follow-question-btn', function(e) {
  var $ele = $(e.target);
  var questionId = imweb.question.id;
  imweb.ajax.post('/operate/follow', {
      data: {
          kind: 'question',
          object_id: questionId
      }
  }).done(function(data) {
      if (data.ret === 0) {
          $ele.text(data.data.ifFollow ? '取消关注' : '关注');
          $('.follow-count').html(data.data.objectFollowerCount);
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
