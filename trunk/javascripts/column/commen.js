'use strict';

$(document).ready(function(){
    //关注专栏
    $('.follow-btn').click(function(e){
        var btn=$(e.target);
        var id=btn.data('id');
        toggleFollow(id,btn); 
    });

    //取消关注专栏
    $('.cancel-btn').click(function(e){
        var btn=$(e.target);
        var id=btn.data('id');
        toggleFollow(id,btn);
    });

    //改变关注和未关注状态
    function toggleFollow(id,btn){
        btn.attr("disabled", true);
        var info=btn.siblings('.info');   //提示信息
        info.text('');

         $.ajax({
            url: '/operate/follow?_csrf=' + imweb._csrf,
            type: 'post',
            data: {
                object_id: id,
                kind: 'column'
            },
            success: function(data){
                if(data.ret===0){
                    btn.siblings('.btn').removeClass('hide');
                    btn.addClass('hide');
                    btn.attr('disabled',false);

                    var numEle=btn.parents('.column-item').find('.follow-num');
                    var num=parseInt(numEle.text());
                    if(btn.hasClass('follow-btn')){
                        num++;
                    }
                    else if(btn.hasClass('cancel-btn')){
                        num--;
                    }
                    numEle.text(num);
                }
                else if(data.msg){
                    btn.attr('disabled',false);
                    info.text('操作失败，请重试');
                    console.log(data.msg);
                }
            },
            error: function(xhr,msg){
                btn.attr('disabled',false);
                info.text('网络错误，请检查');
                console.log(msg); 
            }
        })
    }
});