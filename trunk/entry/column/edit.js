import '../../javascripts/layout';
import '../../javascripts/libs/editor/editor.css';
import '../../stylesheets/column/edit.less';
import '../../javascripts/common/reply.js';
import '../../javascripts/common/uploader.js';


$(document).ready(function(){
  //富文本编辑
  var editor = new Editor();
  var $editor = $('.editor');
  $editor.data('editor', editor);
  editor.render($editor[0]);
});