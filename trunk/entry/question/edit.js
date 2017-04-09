require('../../stylesheets/reply.less');
require('../../stylesheets/activity/edit.less');
require('../../javascripts/libs/editor/editor.css');
require('../../javascripts/common/reply.js');

// 版块选择的检查，必须选择
$('#create_question_form').on('submit', function (e) {
  var tabValue = $('#tab-value').val();
  if (!tabValue) {
    alert('必须选择一个版块！');
    return false;
  }
  var title = $('#title').val();
  if(!title){
    alert('标题不可为空！');
    return false;
  }
});
// END 版块选择的检查，必须选择

$(document).ready(function(){
  //富文本编辑
  var editor = new Editor();
  var $editor = $('.editor');
  $editor.data('editor', editor);
  editor.render($editor[0]);
});
