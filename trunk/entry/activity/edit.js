import '../../stylesheets/sidebar.less';
import '../../stylesheets/reply.less';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';

// 版块选择的检查，必须选择
$('#create_topic_form').on('submit', function (e) {
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
  var editor = new Editor();
  var $editor = $('.editor');
  $editor.data('editor', editor);
  editor.render($editor[0]);
});
