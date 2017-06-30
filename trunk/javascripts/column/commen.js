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
                    btn.siblings('button').removeClass('hide');
                    btn.addClass('hide');
                }
                else if(data.msg){
                    console.log(data.msg);
                }
            },
            error: function(data){
                console.log(msg); 
            }
        })
    }
});