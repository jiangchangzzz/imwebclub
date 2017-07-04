'use strict';

$(document).ready(function(){
    $('.delete-message').click(function(){
        if(!confirm('确定删除此系统消息吗？')){
            return;
        }

        var btn=$(this);
        var mid=btn.data('id');
        $.ajax({
            url: '/admin/message/'+mid+'/delete',
            type: 'get',
            success: function(data){
                if(data.ret===0){
                    location.href='/admin/message';
                }else if(data.msg){
                    alert(data.msg);
                }
            },
            error: function(msg){
                console.log(msg);
            }
        })
    });

    $('#messageForm').on('submit',function(){

    });

    function validateTitle(){
        var title=$('#title').val().trim();
        if(!title){
            
        }
    }
});