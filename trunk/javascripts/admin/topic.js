'use strict';

$(document).ready(function () {

  //ajax配置
  var ajaxOption = {
    url: '',
    type: 'post',
    data: {
      columnid: columnid,
      topicids: topicids
    },
    success: function (data) {
      if (data.ret === 0) {
        location.href = '/admin/topic/all';
      } else if (data.msg) {
        alert(data.msg);
      }
    },
    error: function (msg) {
      console.log(msg);
    }
  };

  //添加文章到专栏
  $('#addTopic').click(function (e) {
    var topicids = getChecked();
    var columnid = $('column-select').val();
    $.ajax(ajaxOption);
  });

  //从专栏中移除文章
  $('#removeTopic').click(function (e) {
    var topicids = getChecked();
    var columnid = $('column-select').val();
    $.ajax(ajaxOption);
  });

  function getChecked() {
    var topicids = [];
    $('.topic-check').each(function (index, item) {
      var check = $(item);
      if (check.attr('checked')) {
        var id = check.parent().siblings('.topic-id').text();
        topicids.push(id);
      }
    });
    return topicids;
  }

  // var columnid = getQueryStringV(location.href, "columnid");

  // //显示当前选中的专栏
  // $('#column-select').children().each(function(i,n){
  //   var option=$(n);
  //   if(option.attr('value')==columnid){
  //       option.attr('selected',true);
  //   }
  // });

  // //改变选中的专栏时，跳转到响应的专栏选择页面
  // $('#column-select').change(function (e) {
  //   var id = $(e.target).val();
  //   if (id == 0) {
  //     location.href = '/admin/topic/all';
  //   } else {
  //     location.href = '/admin/topic/all?columnid=' + id
  //   }
  // });

  // function getQueryStringV(vhref, name) {
  //   // 如果链接没有参数，或者链接中不存在我们要获取的参数，直接返回空 
  //   if (vhref.indexOf("?") == -1 || vhref.indexOf(name + '=') == -1) {
  //     return '';
  //   }
  //   // 获取链接中参数部分 
  //   var queryString = vhref.substring(vhref.indexOf("?") + 1);
  //   // 分离参数对 ?key=value&key2=value2 
  //   var parameters = queryString.split("&");
  //   var pos, paraName, paraValue;
  //   for (var i = 0; i < parameters.length; i++) {
  //     // 获取等号位置 
  //     pos = parameters[i].indexOf('=');
  //     if (pos == -1) {
  //       continue;
  //     }
  //     // 获取name 和 value 
  //     paraName = parameters[i].substring(0, pos);
  //     paraValue = parameters[i].substring(pos + 1);

  //     if (paraName == name) {
  //       return unescape(paraValue.replace(/\+/g, " "));
  //     }
  //   }
  //   return '';
  // }
});
