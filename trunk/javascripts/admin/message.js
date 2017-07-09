'use strict';

$(document).ready(function(){
    //删除系统消息
    $('.delete-message').click(function(e){
        if(!confirm('确定删除此系统消息吗？')){
            e.preventDefault();
        }
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