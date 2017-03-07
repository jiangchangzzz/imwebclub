define([
	'require',
	'jquery',
	'common/pnglib',
	'common/identicon'
], function(require){

	return {
		init: function(){
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
	}
});