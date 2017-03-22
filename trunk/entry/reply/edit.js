import '../../stylesheets/sidebar.less';
import '../../stylesheets/reply.less';
import "../../javascripts/libs/editor/editor.css";
import '../../javascripts/common/reply.js';

(function () {
  var editor = new Editor();
  editor.render($('.editor')[0]);
})();
