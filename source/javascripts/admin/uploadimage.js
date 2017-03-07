/* global WebUploader */

define([
    '../libs/webuploader/webuploader.withoutimage.js',
], function() {
    var $masker = $('#upload-mask');

    var ToolImage = function() {
        var self = this;
        this.$win = $('.upload-mask');

        this.$upload = this.$win.find('.upload-img');

        this.$uploadBtn = this.$upload.find('.button-upload');

        this.$uploadTip = this.$upload.find('.tip');

        this.file = false;
        var _csrf = $('[name=_csrf]').val();

        this.uploader = WebUploader.create({
            swf: '/public/libs/webuploader/Uploader.swf',
            server: '/setting/upload?_csrf=' + imweb._csrf,
            pick: this.$uploadBtn,
            paste: document.body,
            dnd: this.$upload[0],
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

        this.uploader.on('beforeFileQueued', function(file) {
            // alert('beforeFileQueued')
            if (self.file !== false) {
                return false;
            }
            self.showFile(file);
        });

        this.uploader.on('uploadProgress', function(file, percentage) {
            // console.log(percentage);
            self.showProgress(file, percentage * 100);
        });

        this.uploader.on('uploadSuccess', function(file, res) {
            // console.log(file, res)
            if (res.success) {
                // $('#avatar').val(res.url);
                // $('#user-avatar img,.modal-body img').attr('src', res.url);
                $('#b_image').val(res.url);
                $('#image-preview, .modal-body img').attr('src', res.url);
                $('.img-preview').show();

                setTimeout(function() {
                    $masker.fadeOut();
                }, 300);
            } else {
                self.removeFile();
                self.showError(res.msg || '服务器走神了，上传失败');
            }
        });

        this.uploader.on('uploadComplete', function(file) {
            // console.log(file)
            self.uploader.removeFile(file);
            self.removeFile();
        });

        this.uploader.on('error', function(type) {
            self.removeFile();
            switch (type) {
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

        this.uploader.on('uploadError', function() {
            self.removeFile();
            self.showError('服务器走神了，上传失败');
        });
    };

    ToolImage.prototype.removeFile = function() {
        this.file = false;
        this.$uploadBtn.fadeIn();
        this.$uploadTip.fadeOut();
    };

    ToolImage.prototype.showFile = function(file) {
        this.file = file;
        this.$uploadBtn.fadeOut();
        this.$uploadTip.html('正在上传: ' + file.name).fadeIn();
        this.hideError();
    };

    ToolImage.prototype.showError = function(error) {
        this.$upload.find('.alert-error').html(error).fadeIn();
    };

    ToolImage.prototype.hideError = function(error) {
        this.$upload.find('.alert-error').fadeOut();
    };

    ToolImage.prototype.showProgress = function(file, percentage) {
        this.$uploadTip
            .html('正在上传: ' + file.name + ' ' + percentage + '%')
            .fadeIn();
    };

    $masker.on('click', '.close, .button-cancel', function(e) {
        $masker.fadeOut();
    });
    var toolImage;
    toolImage = new ToolImage();

    $('#upload-btn').on('click', function() {
        $('.upload-mask').fadeIn();
    });
});
