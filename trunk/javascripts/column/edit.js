'use strict';

$(document).ready(function(){
    //提交表单
    $('#columnForm').on('submit',function(e){
        var res=true;

        var title=$('#title').val().trim();
        if(!title){
            $('#titleGroup').addClass('has-error');
            res=false;
        }
        
        var cover=$('cover').val();
        if(!cover){
            $('file-group').addClass('has-error');
            res=false;
        }

        return res;
    });

    //重置表单
    $('#columnForm').on('reset',function(e){
        $('#titleGroup').removeClass('has-error');
    });

    //图片上传
    $('#file').change(function(){  
        uploadImage();
    });

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
});



