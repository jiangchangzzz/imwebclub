'use strict';

$(document).ready(function(){
    var validators={
        title: validateTitle,
        cover: validateCover,
        description: validateDescription
    }

    $('#columnForm').change(function(e){
        var id=e.target.id;
        if(validators.hasOwnProperty(id)){
            validators[id]();
        }
    });

    //提交表单
    $('#columnForm').on('submit',function(e){
        var res=true;
        for(var i in validators){
            var v=validators[i]();
            res=res && v;
        }
        return res;
    });

    //重置表单
    $('#columnForm').on('reset',function(e){
        $('#titleGroup').removeClass('has-error');
        $('#file-group').removeClass('has-error');
        $('#description-group').removeClass('has-error');
    });

    //图片上传
    $('#file').change(function(){  
        uploadImage();
    });

    //上传图片
    function uploadImage(){
        var image=$('#file')[0].files[0];
        var type=image.type;
        var ext=type.slice(type.lastIndexOf('/')+1).toLowerCase();
        if(ext!=='jpeg' && ext!=='png' && ext!=='gif'){
            $('#file-alert').text('请选择图片文件');
            $('#file-group').addClass('has-error');
            return;
        }

        $('#file-info').text('图片上传中...');
        var data=new FormData();
        data.append('file',$('#file')[0].files[0]);

        $.ajax({
            type: 'POST',
            url: '/upload',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function(data){
                console.log(data);
                if(data.success){
                    $('#file-info').text('图片上传成功');
                    $('#cover').val(data.url);
                }
                else{
                    $('#file-info').text('图片上传失败,请重试');
                }
            },
            error: function(msg){
                $('#file-info').text('网络错误，请检查');
                console.log(msg); 
            }
        })
    }

    //标题表单验证
    function validateTitle(){
        var title=$('#title').val().trim();
        if(!title){
            $('#titleGroup').addClass('has-error');
            return false;
        }else{
            $('#titleGroup').removeClass('has-error');
            return true;
        }
    }

    //封面表单验证
    function validateCover(){
        var cover=$('#cover').val();
        if(!cover){
            $('#file-group').addClass('has-error');
            return false;
        }
        else{
            $('#file-group').removeClass('has-error');
            return true;
        }
    }

    //描述表单验证
    function validateDescription(){
        var description=$('#description').val();
        if(!description){
            $('#description-group').addClass('has-error');
            return false;
        }
        else{
            $('#description-group').removeClass('has-error');
            return true;
        }
    }
});



