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
        _$out_.push('<li class="sub-reply-item" data-reply-id="', reply.id, '"> <span class=\'content-wrap\'> ', reply.text, ' </span> <span class="minus">–</span> <a href="javascript:void(0);" title="', reply.author.loginname, '" class="user-url user-slider-btn" data-name="', reply.author.loginname, '">', reply.author.loginname, '</a> ');
        if (it.isAdmin || it.isAuthor || it.isTopicAuthor) {
            _$out_.push(' <span class="act delete-reply">删除</span> ');
        }
        _$out_.push(' <span class="create-at">'); -
        reply.friendly_create_at
        _$out_.push('</span></li>');
        return _$out_.join('');
    }
}));
