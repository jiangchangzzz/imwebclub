(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root['tplReplySubItem'] = factory();
    }
}(this, function() {
    return function(it, opt) {
        it = it || {};
        var _$out_ = [];
        var reply = it.reply;
        var name = reply.author.name || reply.author.loginname;
        _$out_.push('<li class="sub-reply-item" data-reply-id="', reply.id, '"> <div class=\'content-wrap\'> ', reply.text, ' </div>');
        _$out_.push('<div class="foot-wrap"><a href="javascript:void(0);" title="', name, '" class="item user-url user-slider-btn" data-name="', name, '">', name, '</a>');
        _$out_.push(' <span class="item create-at">',reply.friendly_create_at,'</span>');
        if (it.isAdmin || it.isAuthor || it.isTopicAuthor) {
            _$out_.push(' <a href="javascript:;" class="item delete-reply">删除</a> ');
        }
        _$out_.push('</div></li>');
        return _$out_.join('');
    }
}));
