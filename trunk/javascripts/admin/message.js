'use strict';

$(document).ready(function(){
    //删除系统消息
    $('.delete-message').click(function(){
        if(!confirm('确定删除此系统消息吗？')){
            return;
        }

        var btn=$(this);
        var mid=btn.data('id');
        showSuccess('数据正在光速传输中...');
        $.ajax({
            url: '/admin/message/'+mid+'/delete',
            type: 'get',
            success: function(data){
                if(data.ret===0){
                    showSuccess('系统消息发送成功');
                    location.href='/admin/message';
                }else{
                    showFailure('系统消息发送失败,请重试');
                    console.log(data.msg);
                }
            },
            error: function(xhr,msg){
                showFailure('网络错误，请检查');
                console.log(msg);
            }
        })
    });

    //显示成功信息
    function showSuccess(text){
        var info=$('#success-info');
        info.text(text).removeClass('hide');
        info.siblings('.alert').addClass('hide');
    }   

    //显示错误信息
    function showFailure(text){
        var info=$('#fail-info');
        info.text(text).removeClass('hide');
        info.siblings('.alert').addClass('hide');
    }

    $('#messageForm').on('submit',function(){
        var titleRes=validateTitle();
        var contentRes=validateContent();
        return titleRes && contentRes;
    });

    $('#title').change(function(e){
        validateTitle();
    });

    $('#content').change(function(e){
        validateContent();
    });

    //验证标题
    function validateTitle(){
        var title=$('#title').val().trim();
        if(!title){
            $('#title-info').text('标题是必须的');
            $('#title-group').addClass('has-error');
            return false;
        }
        else{
            $('#title-group').removeClass('has-error');
            return true;
        }
    }

    //验证内容
    function validateContent(){
        var content=$('#content').val().trim();
        if(!content){
            $('#content-info').text('内容是必须的');
            $('#content-group').addClass('has-error');
            return false;
        }
        else{
            $('#content-group').removeClass('has-error');
            return true;
        }
    }
});