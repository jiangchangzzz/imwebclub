(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root['tplUserSliderList'] = factory();
  }
}(this, function (){
  return function (it, opt) {
    it = it || {};
    with(it) {
        var _$out_= [];
        _$out_.push('<div class="cd-timeline-block"> <div class="cd-timeline-img cd-', type, '"><i class="icon iconfont">',  icon , '</i></div> <div class="cd-timeline-content"> <h2><a href="/topic/', id, '" target="_blank" title=', title, '>', title, '</a></h2> <p>',  summary , '</p> <a href="/topic/', id, '" target="_blank" class="cd-read-more">阅读更多</a> <span class="cd-date">',  create_at , '，', action, '</span> </div> </div>');
        return _$out_.join('');
    }
}
}));