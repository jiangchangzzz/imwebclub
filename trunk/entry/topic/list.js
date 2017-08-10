import '../../stylesheets/topic/list.less';
import '../../javascripts/index/main.js';
import '../../javascripts/layout';
/**
 * 删除文章
 */
$(document).on('click', '.js-topic-del', function(e) {
  var $ele = $(e.target).closest('.js-topic-del');
  var topicId = $ele.data('tid');
  if(topicId){
    if (!confirm('确定要删除此话题吗？')) {
        return ;
    }
    imweb.ajax.post('/topic/' + topicId + '/delete')
        .done(function(data) {
            if (data.ret === 0) {
                location.reload();
            } else if (data.msg) {
                alert(data.msg);
            }
        });
  }
});
