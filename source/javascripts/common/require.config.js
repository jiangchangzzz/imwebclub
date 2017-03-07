var __require = function(path) {return path || ''};
var requirejs = {
	baseUrl: './public/javascripts/',
	paths: {
		jquery: 'http://7.url.cn/edu/jslib/jquery/1.9.1/jquery.min',
		base: 'common/base'
	}
}

if(typeof global != 'undefined') global.requirejs = requirejs;