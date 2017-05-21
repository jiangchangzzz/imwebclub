define([], function() {
    return (function(root, factory) {
        if (typeof define === 'function' && define.amd) {
            define(factory);
        } else {
            root['tplReplyItem'] = factory();
        }
    }(this, function() {
        return function(it, opt) {
            it = it || {};
            with(it) {
                var _$out_ = [];
                _$out_.push('<li class=\'reply-item ', reply.ups.length >= topic.reply_up_threshold ? 'reply-highlight' : '', '\' data-reply-id="', reply.id, '"> <a class="anchor" id="', reply.id, '"></a> <div class="user-area"> <div class="user-avatar-wrap"> <a href="javascript:void(0);" class="user-avatar user-slider-btn" data-name="', reply.author.name || reply.author.loginname, '"> <img class="ui-avatar ui-avatar-38 js-identicon" src="', reply.author.avatar, '" title="', reply.author.name || reply.author.loginname, '" /> </a> </div> </div> <div class="main-area"> <div class="user-url-wrap "> <a href="javascript:void(0);" title="', reply.author.name || reply.author.loginname, '" class="user-url user-slider-btn" data-name="', reply.author.name || reply.author.loginname, '">', reply.author.loginname, '</a> <span class="create-at">', reply.friendly_create_at, '</span> <div class="actions btn-wrap"> ');
                if (isAdmin || isAuthor) {
                    _$out_.push(' <a href="/reply/', reply.id, '/edit" class="btn-ico"> <i class="fa fa-lg fa-pencil-square-o" title="编辑"></i></a> ');
                }
                _$out_.push(' ');
                if (isAdmin || isAuthor || isTopicAuthor) {
                    _$out_.push(' <a href="javascript:;" class="btn-ico delete-reply"> <i class="fa fa-lg fa-trash" title="删除"></i></a> ');
                }
                _$out_.push(' </div> </div> <div class="content-wrap"> ', reply.content, ' </div> <div class="info-area"> <div class="edit-at">', reply.friendly_edit_at, '</div> </div> ');
                if (isLogin) {
                    _$out_.push(' <div class="reply-btn-area"> ');
                    if (isLogin && _.contains(reply.ups, user.id)) {
                        _$out_.push(' <span class="act up-reply uped" data-cancel="true">取消感谢</span> ');
                    } else {
                        _$out_.push(' <span class="act up-reply" data-cancel="false">感谢<span class="up-count">(', reply.ups.length, ')</span></span> ');
                    }
                    _$out_.push(' <span class="act open-sub-reply" data-count="', reply.subReplies.length, '">回复(', reply.subReplies.length, ')</span> </div> <div class="reply-edit-area"> <div class="editor-wrap"> <textarea class="editor"></textarea> </div> <div class="editor-actions"> <button class="ui-button sub-reply-submit" type="button">回复</button> </div> </div> ');
                }
                _$out_.push(' <div class="sub-reply"> <ul class="sub-reply-list"> ', reply.subRepliesHTML || '', ' </ul> </div> </div> </li>');
                return _$out_.join('');
            }
        }
    }));
});
