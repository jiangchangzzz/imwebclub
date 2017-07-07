'use strict';

$(document).ready(function(){
    $('.btn-delete').click(function(e){
        var columnId=$(this).parents('tr').children('.column-id').text().trim();
        if(!confirm('确认删除此专栏吗？')){
            return;
        }

        var info=$('#handle-info');
        $.ajax({
            url: '/column/'+columnId+'/delete?_csrf=' + imweb._csrf,
            type: 'post',
            data: {
                cid: columnId
            },
            success: function(data){
                if(data.ret===0){
                    location.href='/admin/column/all';
                }
                else if(data.msg){
                    info.removeClass('hide').text(data.msg).addClass('alert-warning');
                }
            },
            error: function(xhr,textStatus){
                info.removeClass('hide').text(xhr.statusText).addClass('alert-danger');  
            }
        });
    });
});