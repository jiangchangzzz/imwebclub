(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root['tplUserSliderMain'] = factory();
  }
}(this, function (){
  return function (it, opt) {
    it = it || {};
    with(it) {
        var _$out_= [];
        _$out_.push('<div class="slider-main"> <div class="slider-headbg"></div> <div class="slider-img-wrap"> <img class="ui-avatar ui-avatar-100 js-identicon" src="', avatar, '"> </div> <p class="user-name user-info-big"><a href="/user/', name, '" target="_blank">', name, '</a></p> <p class="user-info-gray"><span class="info-span iconfont icon-gongsi js-company">', company, '</span><span class="info-span iconfont icon-site js-location">', location, '</span></p> <p class="user-signature js-signature"><i>“</i><span>', signature, '</span><i>”</i></p> <ul class="user-nav"> <li class="user-nav-item"> <p class="item-val">', topic_count, '</p> <p class="item-key">文章</p> </li> <li class="user-nav-item"> <p class="item-val">', following_count, '</p> <p class="item-key">关注</p> </li> <li class="user-nav-item"> <p class="item-val">', follower_count, '</p> <p class="item-key">粉丝</p> </li> </ul> <div class="follorw-wrap"> <div class="hide ui-button ui-button-white more-activity-btn ">关注TA</div> </div> <div class="time-wrap js-topic"> <section id="cd-timeline" class="cd-container cssanimations"> </section>  </div> <ul class="list-wrap"></ul></div>');
        return _$out_.join('');
    }
}
}));