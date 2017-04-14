(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root['tplReplyItem'] = factory();
    }
}(this, function() {
    return function(it, opt) {
        it = it || {};
        var _$out_ = [];
        var user = it.user;
        var reply = it.reply;
        _$out_.push('<li class=\'reply-item ', reply.ups.length >= it.reply_up_threshold ? 'reply-highlight' : '', '\' data-reply-id="', reply.id, '"> <a class="anchor" id="', reply.id, '"></a> <div class="user-area"> <div class="user-avatar-wrap"> <a href="javascript:void(0);" class="user-avatar user-slider-btn" data-name="', reply.author.loginname, '"> <img class="ui-avatar ui-avatar-38 js-identicon" src="', reply.author.avatar, '" title="', reply.author.loginname, '" /> </a> </div> </div> <div class="main-area"> <div class="user-url-wrap "> <a href="javascript:void(0);" title="', reply.author.loginname, '" class="user-url user-slider-btn" data-name="', reply.author.loginname, '">', reply.author.loginname, '</a> <span class="create-at">', reply.friendly_create_at, '</span> <div class="actions btn-wrap">');
        if (it.isAdmin || it.isAuthor) {
            _$out_.push('<a href="/reply/', reply.id, '/edit" class="btn-ico"> <i class="fa fa-pencil-square-o" title="编辑"></i></a>');
        }
        if (it.isAdmin || it.isAuthor || it.isParentAuthor) {
            _$out_.push('<a href="javascript:;" class="delete-reply btn-ico"><i class="fa fa-trash" title="删除"></i></a>');
        }
        if(typeof(it.customerIcos) === 'function'){
          _$out_.push(it.customerIcos(reply));
        }else if(typeof(it.customerIcos) === 'string'){
          _$out_.push(it.customerIcos);
        }
        _$out_.push('</div> </div> <div class="content-wrap"> ', reply.content, '</div> <div class="info-area"> <div class="edit-at">', reply.friendly_edit_at, '</div> </div>');
        if (it.isLogin) {
            _$out_.push('<div class="reply-btn-area"><div class="act ups">');
            if (it.isLogin && reply.ups.indexOf(user.id) > -1) {
                _$out_.push('<span class="up-reply uped" data-cancel="true" data-mine="',it.isAuthor,'">取消赞</span>');
            } else {
                _$out_.push('<span class="up-reply" data-cancel="false" data-mine="',it.isAuthor,'">赞</span>');
            }
            _$out_.push('<span class="up-count">', reply.ups.length, '</span></div><div class="act subs">');
            _$out_.push('<span class="open-sub-reply">回复</span>');
            _$out_.push('<span class="sub-count">', reply.subReplies.length, '</span></div> </div>');
            _$out_.push('<div class="reply-edit-area"> <div class="editor-wrap"> <textarea class="editor"></textarea> </div> <div class="editor-actions"> <button class="ui-button sub-reply-submit" type="button">回复</button> </div> </div>');
        }
        _$out_.push('<div class="sub-reply"> <ul class="sub-reply-list"> ', reply.subRepliesHTML || '', '</ul> </div> </div> </li>');
        return _$out_.join('');
    }
}));
