define(['../libs/webuploader/webuploader.withoutimage.min.js'], function(WebUploader){
  //图片上传工具
  var ToolImage = function(){
      var self = this;

      this.$upload = $('.upload-cover');
      this.$uploadBtn = this.$upload.find('.button');
      this.$uploadTip = this.$upload.find('.tip');

      this.file = false;
      var _csrf = $('[name=_csrf]').val();

      this.uploader = WebUploader.create({
          swf: '/public/libs/webuploader/Uploader.swf',
          server: '/upload?_csrf=' + _csrf,
          pick: this.$upload[0],
          dnd: this.$upload[0],
          auto: true,
          multiple: false,
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
          // console.log(percentage);
          self.showProgress(file, percentage * 100);
      });

      this.uploader.on('uploadSuccess', function(file, res){
          if(res.success){
              self.$upload.css('background-image','url('+res.url+')');
              $('form input[name="cover"]').val(res.url);
              //self.editor.push(' !['+ file.name +']('+ res.url +')');
          }
          else{
              self.removeFile();
              self.showError(res.msg || '服务器走神了，上传失败');
          }
      });

      this.uploader.on('uploadComplete', function(file){
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
      this.$uploadBtn.show();
      this.$uploadTip.hide();
  };

  ToolImage.prototype.showFile = function(file){
      this.file = file;
      this.$uploadBtn.hide();
      this.$uploadTip.html('正在上传: ' + file.name).show();
      this.hideError();
  };

  ToolImage.prototype.showError = function(error){
      this.$upload.find('.alert-error').html(error).show();
  };

  ToolImage.prototype.hideError = function(error){
      this.$upload.find('.alert-error').hide();
  };

  ToolImage.prototype.showProgress = function(file, percentage){
      this.$uploadTip
          .html('正在上传: ' + file.name + ' ' + percentage + '%')
          .show();
  };

  var toolImage = new ToolImage();
});
