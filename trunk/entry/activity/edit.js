require('../../stylesheets/reply.less');
require('../../stylesheets/activity/edit.less');
require('../../javascripts/libs/editor/editor.css');
require('../../javascripts/common/reply.js');
require('../../javascripts/common/uploader.js');

var Flatpickr = require('flatpickr');
var l10n = require('../../../node_modules/flatpickr/dist/l10n/zh.js');
require('../../../node_modules/flatpickr/dist/flatpickr.min.css');
Flatpickr.localize(l10n.zh);

// 版块选择的检查，必须选择
$('#create_activity_form').on('submit', function (e) {
  var tabValue = $('#tab-value').val();
  if (!tabValue) {
    alert('必须选择一个版块！');
    return false;
  }
  var title = $('input[name="title"]').val();
  if(!title){
    alert('标题不可为空！');
    return false;
  }
});
// END 版块选择的检查，必须选择

$(document).ready(function(){
  $('.datetime').flatpickr({
    enableTime: true,
    dateFormat: 'Y-m-j H:i D',
    onChange: function(selectedDates) {
    	const selectedUTCDate = new Date(selectedDates[0].fp_toUTC());
      $(this.element).prev().val(selectedUTCDate.getTime());
      //console.log($(this.element).prev().val());
    }
  });
  //富文本编辑
  var editor = new Editor();
  var $editor = $('.editor');
  $editor.data('editor', editor);
  editor.render($editor[0]);
});
