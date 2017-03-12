(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root['tplPublishBtn'] = factory();
  }
}(this, function (){
  return function (it, opt) {
    it = it || {};
    with(it) {
        var _$out_= [];
        _$out_.push('<div class="post-tab-switching finish-animating"> <div class="tab-post-types count-7"> <div class="tab-post-type item" data-index="1" data-post-type="topic"> <div class="post-type-icon icon-text"><i class="icon iconfont post-type-icon-overlay">&#xe60d;</i></div> <div class="post-type-name"><span class="post-type-name-span">文章</span> </div> </div> <div class="tab-post-type item" data-index="2" data-post-type="reprint"> <div class="post-type-icon icon-text"><i class="icon iconfont post-type-icon-overlay">&#xe61e;</i></div> <div class="post-type-name"><span class="post-type-name-span">转载</span> </div> </div> <div class="tab-post-type item" data-index="3" data-post-type="githubPro"> <div class="post-type-icon icon-text"><i class="icon iconfont post-type-icon-overlay">&#xe617;</i></div> <div class="post-type-name"><span class="post-type-name-span">项目</span> </div> </div> <div class="tab-post-type item" data-index="4" data-post-type="text"> <div class="post-type-icon icon-text"><i class="icon iconfont post-type-icon-overlay">&#xe60b;</i></div> <div class="post-type-name"><span class="post-type-name-span">(尚未开放)</span> </div> </div> <div class="tab-post-type item" data-index="5" data-post-type="text"> <div class="post-type-icon icon-text"><i class="icon iconfont post-type-icon-overlay">&#xe620;</i></div> <div class="post-type-name"><span class="post-type-name-span">(尚未开放)</span> </div> </div> </div></div>');
        return _$out_.join('');
    }
}
}));