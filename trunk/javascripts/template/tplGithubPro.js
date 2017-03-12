(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root['tplGithubPro'] = factory();
  }
}(this, function (){
  return function (it, opt) {
    it = it || {};
    with(it) {
        var _$out_= [];
        _$out_.push('<div class="reprint-wrap reprint-github-wrap" style="display:none"><div class="reprint-head"> <span class="head-title">分享github项目</span></div><div class="reprint-body"> <div class="body-link">粘贴github项目url</div> <input class="body-input required" type="text"/></div><div class="reprint-area"> <textarea id="githubDes" placeholder="推荐语或组件/项目简介"></textarea></div><div class="reprint-foot"> <p class="head-title">选择合适的标签：</p> <div> ');
       tabs.forEach(function (pair) {
      var value = pair[0];
      var text = pair[1]; 
      _$out_.push(' <a href="javascript:void(0);" class="topic-tab margin-thin" data-val="', value, '">',  text , '</a> ');
       }) 
      _$out_.push(' </div> <div class="foot-btn"> <div class="ui-button-white js-reprint-cancel">取消</div> <div class="ui-button ui-disabled fr js-reprint-publish">发布</div> </div></div></div>');
        return _$out_.join('');
    }
}
}));