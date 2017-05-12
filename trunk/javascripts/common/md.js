define([
	'../libs/remarkable.js'
], function(Remarkable){
	
	var md = new Remarkable();
	
	md.set({
	    html        : false, // Enable HTML tags in source
	    xhtmlOut    : false, // Use '/' to close single tags (<br />)
	    breaks      : false, // Convert '\n' in paragraphs into <br>
	    linkify     : true,  // Autoconvert URL-like text to links
	    typographer : true,  // Enable smartypants and other sweet transforms
	});
	md.renderer.rules.fence = function (tokens, idx) {
	    var token = tokens[idx];
	    var language = token.params && ('language-' + token.params) || '';
	    language = _.escape(language);
	    return '<pre class="prettyprint ' + language + '">'
	        + '<code>' + _.escape(token.content) + '</code>'
	        + '</pre>';
	};
	md.renderer.rules.code = function (tokens, idx /*, options*/) {
	    var token = tokens[idx];
	    var language = token.params && ('language-' + token.params) || '';
	    language = _.escape(language);
	    if (token.block) {
	        return '<pre class="prettyprint ' + language + '">'
	            + '<code>' + _.escape(tokens[idx].content) + '</code>'
	            + '</pre>';
	    }
	    return '<code>' + _.escape(tokens[idx].content) + '</code>';
	};
	imweb.md = md;
	imweb.markdown = function(text) {
	    return md.render(text || '');
	}
});