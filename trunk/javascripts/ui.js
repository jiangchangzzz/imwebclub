    var ui = {};
    // more icon 点击切换方向
    $(document).on('click', '.ui-more-down', function() {
        $(this).removeClass('ui-more-down').addClass('ui-more-up'); 
    });
    $(document).on('click', '.ui-more-up', function() {
        $(this).removeClass('ui-more-up').addClass('ui-more-down'); 
    });
    $(document).on('click', '.ui-more-left', function() {
        $(this).removeClass('ui-more-left').addClass('ui-more-right'); 
    });
    $(document).on('click', '.ui-more-right', function() {
        $(this).removeClass('ui-more-right').addClass('ui-more-left'); 
    });

    // ui-disabled
    $(document).on('click', '.ui-disabled', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    
    $(function() {
        $('select').each(function() {
            if (typeof $(this).attr('value') === 'string') {
                $(this).val($(this).attr('value'));
            }
        });
    });

    /**
     * 隐藏浮沉视觉的停留延时
     */
    var VIEW_STAY = 100;
    
    /**
     * 绑定dropdownlayer hover显示/隐藏layer
     * @param {Object} $trigger
     * @param {Object} options
     * @param {string} options.mode 何时显示hover/click 默认hover
     * @param {string} options.layer layer的选择器
     * @param {Object} options.offset 
     *      layer将显示在trigger的正下方，用offset微调layer的位置
     * @param {number} options.offset.left
     * @param {number} options.offset.top
     * @param {function} options.enter 显示layer的回调
     * @param {function} options.leave 隐藏layer的回调
     */
    ui.attachDropdownLayer = function($trigger, options) {
        var $layer = $(options.layer);
        options.mode = options.mode || 'click';
        var offset = options.offset || {};
        offset.top = offset.top
            ? +offset.top.toString().replace('px', '') : 0;
        offset.left = offset.left
            ? +offset.left.toString().replace('px', '') : 0;
        options.enter = options.enter || $.noop;
        options.leave = options.leave || $.noop;
        var showTimeout = null;
        var hideTimeout = null;
        var show = function() {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            if ($layer.css('display') !== 'none' || showTimeout) {
                return;
            }
            showTimeout = setTimeout(showImmediately, VIEW_STAY);
        };
        var hide = function() {
            if (showTimeout) {
                clearTimeout(showTimeout);
                showTimeout = null;
            }
            if ($layer.css('display') === 'none' || hideTimeout) {
                return;
            }
            hideTimeout = setTimeout(hideImmediately, VIEW_STAY);
        };
        var showImmediately = function() {
            showTimeout = null;
            var triggerPos = $trigger.position();
            // show first
            $layer.css('display', 'block');
            // set position
            // $layer.css({
            //     left: parseInt(
            //             triggerPos.left 
            //                 + ($trigger.width() - $layer.outerWidth()) / 2
            //                 + offset.left
            //         ),
            //     top: parseInt(triggerPos.top + $trigger.height() + offset.top)
            // });    
            $layer.css({
                left: offset.left,
                top: offset.top
            }); 
            options.enter.apply($trigger[0]);
        };
        var hideImmediately = function() {
            hideTimeout = null;
            $layer.css('display', 'none');
            options.leave.apply($trigger[0]);
        };
        $trigger.hover(show, hide);
        $layer.hover(show, hide);
    };
            /**
         * 表单验证器
         * @construtor
         * @param {Object} options 
         * @param {Object} options.input
         * @param {bool} options.required
         * @param {String} options.requiredError
         * @param {RegExp} options.regexp
         * @param {String} options.regexpError
         * @param {function(String):bool} validate 验证函数
         */
    ui.Validator = function(options){

            this.input = options.input;
            this.$input = $(options.input);
            this.options = options;
            var me = this;
            this.$input.blur(function() {
                me.check();
            }).bind('keypress keydown keyup', function() {
                if (me._checkTimes) {
                    me.check();
                }
            });
            if (this.options.required || this.options.requiredTag) {
                this.$input.closest('.control-group')
                    .addClass('required');
            }
    };
    ui.Validator.prototype = {
        check: function() {
            this._checkTimes = this._checkTimes || 0;
            this._checkTimes++;
            var msg = this._check();
            if (msg) {
                this.error(msg);
                return false;
            } else {
                this.succss();
                return true;
            }
        },
        _check: function() {
            if (this.options.trim !== false) {
                this.$input.val($.trim(this.$input.val()));
            }
            var text = this.$input.val();
            if (this.options.required && !text) {
                return this.options.requiredError;
            }
            if (this.options.regexp && !this.options.regexp.test(text)) {
                return this.options.regexpError;
            }
            if (this.options.validate) {
                return this.options.validate(text);
            }
        },
        error: function(msg) {
            var container = this.$input.closest('.control-group');
            this._setErrorMsg(msg);
            container.addClass('error');
        },
        succss: function() {
            var container = this.$input.closest('.control-group');
            this._setErrorMsg('');
            container.removeClass('error');
        },
        _setErrorMsg: function(msg) {
            var $error = this.$input.nextAll('.error-msg');
            if (!$error.length) {
                $error = $('<span></span>').addClass('error-msg');
                this.$input.after($error);
            }
            $error.html(msg);
        }
    };
        /**
         * 表单验证器
         * @construtor
         * @param {Object} $form
         * @param {Array.<Validator>} validators
         */
    ui.FormValidator = function($form, validators){

     
            if (!$form.length) {
                return;
            }
            this.$form = $form;
            this.validators = validators;
            $form.submit(function() {
                var success = true;
                $.each(validators, function(i, item) {
                    if (!item.check()) {
                        success = false;
                    }
                });
                return success;
            });
        
    };

    //生成自动头像
    ui.identicon = function(){
        var $imgList = $("img.js-identicon");
        for(var i=0,len=$imgList.length; i<len; i++){
            var src = $imgList.eq(i).attr("src");
            var result = src.match(/avatar\/.+?\?size/);
            if(result && result[0]){
                src = result[0];
                src = src.replace("avatar/", "").replace("?size","");
                var data = new Identicon(src, 420).toString();
                $imgList.eq(i).attr("src", "data:image/png;base64," + data);
            }
        }
    }
    window.ui = ui;
