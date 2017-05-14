import { Webuploader } from '../libs/webuploader/webuploader.withoutimage.js';

let ToolImage = function(){
    var self = this;

    this.$upload = $('#uploader');
    this.$uploadTip =  $('#user-avatar .tip');
    this.file = false;
    var _csrf = $('[name=_csrf]').val();
    this.uploader = Webuploader.create({
        swf: '/libs/webuploader/Uploader.swf',
        server: '/upload?_csrf=' + imweb._csrf,
        pick: '#picker',
        auto: true,
        fileSingleSizeLimit: 2 * 1024 * 1024,
        //sendAsBinary: true,
        // 只允许选择图片文件。
        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });

    this.uploader.on('beforeFileQueued', function(file){
        if(self.file !== false){
            return false;
        }
        self.showFile(file);
    });

    this.uploader.on('uploadProgress', function(file, percentage){
        console.log(percentage);
        self.showProgress(file, percentage * 100);
    });

    this.uploader.on('uploadSuccess', function(file, res){
        console.log(file, res)
        if(res.success){
            $('#avatar').val(res.url);
            $('.user-avatar').attr('src',res.url);
        }
        else{
            self.removeFile();
            self.showError(res.msg || '服务器走神了，上传失败');
        }
    });

    this.uploader.on('uploadComplete', function(file){
        // console.log(file)
        self.uploader.removeFile(file);
        self.removeFile();
    });

    this.uploader.on('error', function(type){
        self.removeFile();
        switch(type){
            case 'Q_EXCEED_SIZE_LIMIT':
            case 'F_EXCEED_SIZE':
                self.showError('文件太大了, 不能超过2M');
                break;
            case 'Q_TYPE_DENIED':
                self.showError('只能上传图片');
                break;
            default:
                self.showError('发生未知错误');
        }
    });

    this.uploader.on('uploadError', function(){
        self.removeFile();
        self.showError('服务器走神了，上传失败');
    });
};

ToolImage.prototype.removeFile = function(){
    this.file = false;
    this.$uploadTip.fadeOut();
};

ToolImage.prototype.showFile = function(file){
    this.file = file;
    this.$uploadTip.html('正在上传: ' + file.name).fadeIn();
    this.hideError();
};

ToolImage.prototype.showError = function(error){
    this.$upload.find('.alert-error').html(error).fadeIn();
};

ToolImage.prototype.hideError = function(error){
    this.$upload.find('.alert-error').fadeOut();
};

ToolImage.prototype.showProgress = function(file, percentage){
    this.$uploadTip
        .html('正在上传: ' + file.name + ' ' + percentage + '%')
        .fadeIn();
};

let toolImage;
    toolImage = new ToolImage();