/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		4:0
/******/ 	};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "javascripts/" + chunkId + ".chunk.js?" + {"0":"34711b27144651fcb309","1":"1804e81c0f503e07ad5a","2":"484cc07886296e1f26b9","3":"4e6f3ef72435c7b7715e"}[chunkId] + "";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};

/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/public/";
/******/ })
/************************************************************************/
/******/ ({

/***/ 7:
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },

/***/ 18:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	//首页入口逻辑

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(19)], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    //登陆弹窗
	    if ($('#nav-user-menu').length > 0) {
	        ui.attachDropdownLayer($('#nav-user-menu'), {
	            layer: '#nav-user-menu-layer'
	        });
	    }
	    //展示和隐藏登录框
	    $(document).on('click', '.user-login-btn', function () {
	        $(".login-wrapper").show();
	    });
	    $(document).on('click', '.not-sign-close', function () {
	        $(".login-wrapper").hide();
	    });
	    //注册与登录来回切换
	    $(document).on('click', '.js-to-sign', function () {
	        $(".to-login").fadeOut('fast', function () {
	            $('.to-sign').fadeIn();
	        });
	    });
	    $(document).on('click', '.js-to-login', function () {
	        $(".to-sign").fadeOut('fast', function () {
	            $('.to-login').fadeIn();
	        });
	    });
	    //菜单悬浮效果
	    $(document).on({
	        mouseenter: function mouseenter() {
	            $(this).addClass('active');
	        },
	        mouseleave: function mouseleave() {
	            $(this).removeClass('active');
	        }
	    }, '.menu-list li');
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },

/***/ 19:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {

		var ui = {};
		// more icon 点击切换方向
		$(document).on('click', '.ui-more-down', function () {
			$(this).removeClass('ui-more-down').addClass('ui-more-up');
		});
		$(document).on('click', '.ui-more-up', function () {
			$(this).removeClass('ui-more-up').addClass('ui-more-down');
		});
		$(document).on('click', '.ui-more-left', function () {
			$(this).removeClass('ui-more-left').addClass('ui-more-right');
		});
		$(document).on('click', '.ui-more-right', function () {
			$(this).removeClass('ui-more-right').addClass('ui-more-left');
		});

		// ui-disabled
		$(document).on('click', '.ui-disabled', function (e) {
			e.preventDefault();
			e.stopPropagation();
		});

		$(function () {
			$('select').each(function () {
				if (typeof $(this).attr('value') === 'string') {
					$(this).val($(this).attr('value'));
				}
			});
		});

		/**
	  * 隐藏浮沉视觉的停留延时
	  */
		var VIEW_STAY = 100;

		/**
	  * 绑定dropdownlayer hover显示/隐藏layer
	  * @param {Object} $trigger
	  * @param {Object} options
	  * @param {string} options.mode 何时显示hover/click 默认hover
	  * @param {string} options.layer layer的选择器
	  * @param {Object} options.offset
	  *      layer将显示在trigger的正下方，用offset微调layer的位置
	  * @param {number} options.offset.left
	  * @param {number} options.offset.top
	  * @param {function} options.enter 显示layer的回调
	  * @param {function} options.leave 隐藏layer的回调
	  */
		ui.attachDropdownLayer = function ($trigger, options) {
			var $layer = $(options.layer);
			options.mode = options.mode || 'click';
			options.enter = options.enter || $.noop;
			options.leave = options.leave || $.noop;
			var showTimeout = null;
			var hideTimeout = null;
			$layer.css({
				left: Math.floor($trigger.position().left - 10) + 'px',
				top: Math.floor($trigger.position().top + 30) + 'px'
			});
			var show = function show() {
				if (hideTimeout) {
					clearTimeout(hideTimeout);
					hideTimeout = null;
				}
				if ($layer.css('display') !== 'none' || showTimeout) {
					return;
				}
				showTimeout = setTimeout(showImmediately, VIEW_STAY);
			};
			var hide = function hide() {
				if (showTimeout) {
					clearTimeout(showTimeout);
					showTimeout = null;
				}
				if ($layer.css('display') === 'none' || hideTimeout) {
					return;
				}
				hideTimeout = setTimeout(hideImmediately, VIEW_STAY);
			};
			var showImmediately = function showImmediately() {
				showTimeout = null;
				var triggerPos = $trigger.position();
				// show first
				$layer.css('display', 'block');

				options.enter.apply($trigger[0]);
			};
			var hideImmediately = function hideImmediately() {
				hideTimeout = null;
				$layer.css('display', 'none');
				options.leave.apply($trigger[0]);
			};
			$trigger.hover(show, hide);
			$layer.hover(show, hide);
		};

		window.ui = ui;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }

/******/ });