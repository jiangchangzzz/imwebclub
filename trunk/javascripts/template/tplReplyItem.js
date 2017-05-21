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
        var hasUped = it.isLogin && reply.ups.indexOf(user.id) > -1;
        var name = reply.author.name || reply.author.loginname;
        _$out_.push('<li class="reply-item ', reply.ups.length >= it.reply_up_threshold ? 'reply-highlight' : '', '" data-reply-id="', reply.id, '"> <a class="anchor" id="', reply.id, '"></a> <div class="left-area">');
        _$out_.push('<div class="updown" data-mine="',it.isAuthor,'">');
        _$out_.push('<i class="fa fa-caret-up ',(hasUped ? 'hidden': ''),'" aria-hidden="true"></i>');
        _$out_.push('<div class="count">',reply.ups.length,'</div>');
        _$out_.push('<i class="fa fa-caret-down ',(hasUped ? '': 'hidden'),'" aria-hidden="true"></i></div>');
        if(typeof(it.customerStatus) === 'function'){
          _$out_.push(it.customerStatus(reply));
        }else if(typeof(it.customerStatus) === 'string'){
          _$out_.push(it.customerStatus);
        }
        _$out_.push('</div><div class="main-area"><div class="content-wrap"> ', reply.content, '</div>');

        _$out_.push('<div class="reply-btn-area"><span class="item">', reply.friendly_create_at, '</span>');
        _$out_.push('<span class="item"><span class="sub-count">', reply.subReplies.length, '</span>');
        _$out_.push('<a href="javascript:;"',(it.isLogin?'class="open-sub-reply"':''),'>回复</a></span>');
        if (it.isAdmin || it.isAuthor) {
            _$out_.push('<a href="/reply/', reply.id, '/edit" class="item">编辑</a>');
        }
        if (it.isAdmin || it.isAuthor || it.isParentAuthor) {
            _$out_.push('<a href="javascript:;" class="delete-reply item">删除</a>');
        }
        if(typeof(it.customerIcos) === 'function'){
          _$out_.push(it.customerIcos(reply));
        }else if(typeof(it.customerIcos) === 'string'){
          _$out_.push(it.customerIcos);
        }

        _$out_.push('<div class="user-wrap">');
        _$out_.push('<a href="/user/',reply.author.loginname,'/index" data-name="', name, '" class="user-url"> <img class="avatar js-identicon" src="', reply.author.avatar, '" title="', name, '" />');
        _$out_.push(name,'<span class="score">', reply.author.score, '声望</span></a></div>');
        _$out_.push('</div><div class="reply-edit-area"> <div class="editor-wrap"> <textarea class="editor"></textarea> </div> <div class="editor-actions"> <button class="ui-button sub-reply-submit" type="button">回复</button> </div> </div>');

        _$out_.push('<div class="sub-reply"> <ul class="sub-reply-list"> ', reply.subRepliesHTML || '', '</ul> </div> </div> </li>');
        return _$out_.join('');
    }
}));
