'use strict';

$(document).ready(function(){
    $('.follow-btn').click(function(e){
        var btn=$(e.target);
        var id=btn.data('id');
        toggleFollow(id,btn);
    });

    $('.cancel-btn').click(function(e){
        var btn=$(e.target);
        var id=btn.data('id');
        toggleFollow(id,btn);
    });

    function toggleFollow(id,btn){
         $.ajax({
            url: '/operate/follow',
            type: 'post',
            data: {
                object_id: id,
                kind: 'column'
            },
            success: function(data){
                if(data.ret===0){
                    btn.siblings('.btn').removeClass('hide');
                    btn.addClass('hide');

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
                    console.log(data.msg);
                }
            },
            error: function(xhr,msg){
                console.log(msg); 
            }
        })
    }
});