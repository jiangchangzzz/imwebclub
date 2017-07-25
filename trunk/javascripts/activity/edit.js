'use strict';

$(document).ready(function () {

  console.log('red');
  $('.datetime').flatpickr({
    enableTime: true,
    dateFormat: 'Y-m-j H:i D',
    onChange: function (selectedDates) {
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

  // 版块选择的检查，必须选择
  $('#create_activity_form').on('submit', function (e) {
    var tabValue = $('#tab-value').val().trim();
    if (!tabValue) {
      $('#tab-info').text('必须选择一个板块');
      return false;
    }
    else{
      $('#tab-info').text('');
    }

    var title = $('#title').val().trim();
    if (!title) {
      $('#title-info').text('标题是必须的');
      return false;
    }
    else{
      $('#title-info').text('');
    }

    var content = $('#t_content').val().trim();
    if (!content) {
      $('#content-info').text('内容是必须的');
      return false;
    }
    else{
      $('#content-info').text('');
    }
  });
});
