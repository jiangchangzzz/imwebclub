'use strict';

$(document).ready(function(){

    $('#file').change(function(e){
        uploadImage();
    });

    $('#name').change(function(e){
        validateName();
    }); 

    $('#celebrityForm').on('submit',function(e){
        return validateName();
    });

    //上传图片
    function uploadImage(){
        var image=$('#file')[0].files[0];
        var type=image.type;
        var ext=type.slice(type.lastIndexOf('/')+1).toLowerCase();
        if(ext!=='jpeg' && ext!=='png' && ext!=='gif'){
            $('#file-info').text('请选择图片文件');
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
                    $('#avatar').val(data.url);
                }
                else{
                    $('#file-info').text('图片上传失败,请重试');
                }
            },
            error: function(xhr,msg){
                $('#file-info').text('网络错误，请检查');
                console.log(msg);
            }
        })
    }

    //表单验证姓名
    function validateName(){
        var name=$('#name').val().trim();
        if(!name){
            $('#name-info').text('姓名是必须的');
            $('#name-group').addClass('has-error');
            return false;
        }
        else{
            $('#name-group').removeClass('has-error');
            return true;
        }
    }

});