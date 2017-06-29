'use strict';

$(document).ready(function(){
    $('.follow-btn').click(function(e){
        var btn=$(e.target);
        var id=btn.data('id');

        $.ajax({
            url: '',
            type: 'post',
            data: {
                object_id: id,
                kind: 'column'
            },
            success: function(data){
                if(data.ret===0){
                    btn.text('关注');
                }
                else if(data.msg){
                    console.log(data.msg);
                }
            },
            error: function(data){
                console.log(msg); 
            }
        })
    })
});