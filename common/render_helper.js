/*!
 * nodeclub - common/render_helpers.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */
var _ = require('lodash');
var config = require('../config');
var validator = require('validator');
var multiline = require('multiline');
var marked = require('./marked');
var hljs = require('highlight.js');
var xss = require('node-xss').clean;


marked.setOptions({
    highlight: function (code, lang) {
        try {
            return hljs.highlight(lang, code).value;
        } catch (ex) {}
        try {
            return hljs.highlightAuto(code).value;
        } catch (ex) {}
        return '<pre>' + code + '</pre>';
    },
    gfm: true,
    tables: true,
    breaks: false,
    langPrefix:'hljs '
});

exports.markdownRender = function(text) {
    return xss(marked(text || ''));
};

exports.markdown = function (text) {
  return '<div class="markdown-text">' + exports.markdownRender(text) + '</div>';
};


exports.htmlToText = function (text) {
   return html_decode(text.replace(/<[^>]+>/g,""));//去掉所有的html标记
};

function html_decode(str)
{
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&amp;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    s = s.replace(/&nbsp;/g, " ");
    s = s.replace(/&#39;/g, "\'");
    s = s.replace(/&quot;/g, "\"");
    s = s.replace(/<br>/g, "\n");
    return s;
}
exports.html_decode = html_decode;

exports.textDown = function (text) {
    return  exports.htmlToText(exports.markdownRender(text)) ;
}
exports.multiline = multiline;

exports.escapeSignature = function (signature) {
  return signature.split('\n').map(function (p) {
    return _.escape(p);
  }).join('<br>');
};

exports.staticFile = function (filePath) {
  return config.site_static_host + filePath;
};

exports.tabName = function (tab) {
  var pair = _.find(config.tabs, function (pair) {
    return pair[0] === tab;
  });
  if (pair) {
    return pair[1];
  }
};

exports.inlineScript = function(str) {
    return str && str.replace(/</g, '\\x3C') || '';
};

exports._ = _;
