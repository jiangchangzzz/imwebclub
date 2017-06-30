'use strict';

$(document).ready(function(){
    var cid=$('#column-id').text();
    $('#topic-list').delegate('.delete-btn','click',function(){
        var btn=$(this);
        var info=btn.siblings('.delete-info');
        var tids=[btn.data('tid')];

        $.ajax({
            url: '/column/remove_topic',
            type: 'post',
            data: {
                cid: cid,
                tids: tids
            },
            success: function(data){
                if(data.ret===0){
                    location.href='/column/'+cid;
                }
                else{
                    info.text('从专栏中移除文章失败，请重试');
                    console.log(data);
                }
            },
            error: function(error){
                info.text('网络错误，请检查');
                console.log(error);
            }
        })
    });
});