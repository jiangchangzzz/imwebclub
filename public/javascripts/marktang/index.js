webpackJsonp([1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(20);


/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(21);

	__webpack_require__(24);

	__webpack_require__(26);

	__webpack_require__(28);

	__webpack_require__(30);

	__webpack_require__(31);

/***/ },
/* 21 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 22 */,
/* 23 */,
/* 24 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 25 */,
/* 26 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 27 */,
/* 28 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 29 */,
/* 30 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _config = __webpack_require__(32);

	var config = _interopRequireWildcard(_config);

	__webpack_require__(33);

	__webpack_require__(34);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	(function () {
	    var imweb = window.imweb = window.imweb || {};

	    // markdown
	    var md = new Remarkable();
	    md.set({
	        html: false, // Enable HTML tags in source
	        xhtmlOut: false, // Use '/' to close single tags (<br />)
	        breaks: false, // Convert '\n' in paragraphs into <br>
	        linkify: true, // Autoconvert URL-like text to links
	        typographer: true });
	    md.renderer.rules.fence = function (tokens, idx) {
	        var token = tokens[idx];
	        var language = token.params && 'language-' + token.params || '';
	        language = _.escape(language);
	        return '<pre class="prettyprint ' + language + '">' + '<code>' + _.escape(token.content) + '</code>' + '</pre>';
	    };
	    md.renderer.rules.code = function (tokens, idx /*, options*/) {
	        var token = tokens[idx];
	        var language = token.params && 'language-' + token.params || '';
	        language = _.escape(language);
	        if (token.block) {
	            return '<pre class="prettyprint ' + language + '">' + '<code>' + _.escape(tokens[idx].content) + '</code>' + '</pre>';
	        }
	        return '<code>' + _.escape(tokens[idx].content) + '</code>';
	    };
	    imweb.md = md;
	    imweb.markdown = function (text) {
	        return md.render(text || '');
	    };

	    // set underscore template
	    _.templateSettings = _.extend(_.templateSettings || {}, config.templateSettings);
	    imweb.template = function (id, data) {
	        return _.template(document.getElementById(id).innerHTML)(_.extend({
	            _: _,
	            csrf: imweb._csrf || '',
	            markdown: imweb.markdown,
	            md: md,
	            user: imweb.user || null,
	            isLogin: !!imweb.user,
	            isAdmin: imweb.user && imweb.user.is_admin
	        }, data || {}));
	    };
	    imweb.template.compile = function (source) {
	        return _.template(source);
	    };

	    // user common function
	    imweb.userUtils = imweb.userUtils || {};
	    $.extend(imweb.userUtils, {
	        isLogin: function isLogin() {
	            return imweb.user && imweb.user.loginname;
	        },
	        checkLogin: function checkLogin() {
	            var logined = this.isLogin();
	            if (!logined) {
	                alert('请先登录!');
	            }
	            return logined;
	        }
	    });

	    // ajax common
	    imweb.ajax = imweb.ajax || {};
	    $.extend(imweb.ajax, {
	        post: function post(url, options) {
	            options = options || {};
	            options.data = $.extend({
	                _csrf: imweb._csrf
	            }, options.data || {});
	            return $.ajax(url, $.extend({
	                method: 'post'
	            }, options));
	        },
	        get: function get(url, options) {
	            options = options || {};
	            return $.ajax(url, $.extend({
	                method: 'get'
	            }, options));
	        },
	        fail: function fail(xhr) {
	            if (xhr.status === 403) {
	                alert('请先登录，登陆后即可点赞。');
	            } else if (xhr.status >= 500) {
	                alert('系统异常，请稍候重试。');
	            } else {
	                alert('系统错误，请稍候重试。');
	            }
	        }
	    });

	    $(function () {
	        // add csrf to form 
	        $('form').submit(function () {
	            if (!$(this).find('*[name=_csrf]').length) {
	                $('<input type="hidden" name="_csrf" />').val(imweb._csrf).appendTo($(this));
	            };
	        });
	    });
	})();

	/**
	 * auto complete
	 */
	$(function () {
	    $('.email-autocomplete').each(function () {
	        $(this).autocomplete({
	            appendTo: $('<div></div>').addClass('email-autocomplete-content').appendTo($(document.body)),
	            source: function source(req, resp) {
	                var term = req.term;
	                var match = term.match(/([^@]*)@([\s\S]*)$/);
	                if (!match || !match[1]) {
	                    resp([]); // not got a @ or empty
	                    return;
	                }
	                var prefix = match[1];
	                var domain = match[2] || '';
	                var items = [];
	                $.each(config.MAIL_DOMAIN, function (i, item) {
	                    if (!domain || item.indexOf(domain) === 0) {
	                        items.push([prefix, '@', item].join(''));
	                    }
	                });
	                resp(items);
	            }
	        });
	    });
	    $('.company-autocomplete').each(function () {
	        $(this).autocomplete({
	            minLength: 1,
	            appendTo: $('<div></div>').addClass('company-autocomplete-content').appendTo($(document.body)),
	            source: function source(req, resp) {
	                var $ele = $(this.element);
	                var term = req.term;
	                $.ajax('/team/companyComplete', {
	                    data: { company: term },
	                    dataType: 'json',
	                    success: function success(data) {
	                        if ($ele.val() === term) {
	                            resp(data.items);
	                        }
	                    }
	                });
	            }
	        });
	    });
	    $('.team-autocomplete').each(function () {
	        $(this).autocomplete({
	            minLength: 0,
	            appendTo: $('<div></div>').addClass('team-autocomplete-content').appendTo($(document.body)),
	            source: function source(req, resp) {
	                var companyId = $(this.element).data('teamCompanyId') || '';
	                var company = $('#' + companyId).val();
	                if (!company) {
	                    return;
	                }
	                var $ele = $(this.element);
	                var term = req.term;
	                $.ajax('/team/teamComplete', {
	                    data: { company: company, team: term },
	                    dataType: 'json',
	                    success: function success(data) {
	                        if ($ele.val() === term) {
	                            resp(data.items);
	                        }
	                    }
	                });
	            }
	        }).focus(function () {
	            $(this).autocomplete('search', $(this).val());
	        });
	    });
	});

	/**
	 * user card
	 */
	$(function () {
	    var userCardAction = {
	        follow: function follow(e) {
	            var me = this;
	            var $userCard = $(e.target).closest('.user-card');
	            var masterId = $userCard.data('id');
	            var hasFollowed = $userCard.data('hasFollowed') || false;
	            imweb.ajax.post('/follow/follow', {
	                data: {
	                    master: masterId,
	                    cancel: hasFollowed
	                }
	            }).done(function (data) {
	                if (data.ret === 0) {
	                    me.setFollowInfo($userCard, data.data);
	                }
	            });
	            return false;
	        },
	        loadFollowInfo: function loadFollowInfo($userCard) {
	            var me = this;
	            var masterId = $userCard.data('id');
	            imweb.ajax.post('/follow/masterFollowInfo', {
	                data: { master: masterId }
	            }).done(function (data) {
	                me.setFollowInfo($userCard, data.data);
	            });
	        },
	        setFollowInfo: function setFollowInfo($userCard, data) {
	            var btnText = data.hasFollowed ? '取消关注' : '关注';
	            $userCard.find('.user-card-follow-btn').html(btnText);
	            $userCard.find('.follower-count').html(data.masterFollowerCount);
	            $userCard.data('hasFollowed', data.hasFollowed);
	        }
	    };
	    var me = userCardAction;
	    $(document).on('click', '.user-card-follow-btn', _.bind(me.follow, me));
	    $('.user-card').each(function () {
	        me.loadFollowInfo($(this));
	    });
	});

	// nav bar
	$(function () {
	    ui.attachDropdownLayer($('#nav-user-menu'), {
	        layer: '#nav-user-menu-layer',
	        offset: {
	            top: 50,
	            left: 84
	        },
	        enter: function enter() {
	            $(this).closest('.user-sidebar-item').addClass('user-sidebar-item-active');
	        },
	        leave: function leave() {
	            $(this).closest('.user-sidebar-item').removeClass('user-sidebar-item-active');
	        }
	    });
	});

	$(function () {
	    if ($('.not-sign').length) {
	        window.Signin && window.Signin.init();
	    }
	    if ($(".fancybox").length) {
	        $(".fancybox").fancybox();
	    }
	    if ($("#topic_list").length) {
	        $("#topic_list").lazyload({
	            size: [200, 120]
	        });
	    }

	    ui.identicon();
	    window.Reprint && window.Reprint.init();
	});

/***/ },
/* 32 */
/***/ function(module, exports) {

	'use strict';

	module.exports = {
	    MAIL_DOMAIN: 'qq.com;163.com;126.com;sohu.com;sina.com;gmail.com;21cn.com;hotmail.com;vip.qq.com;yeah.net'.split(';'),
	    regExps: {
	        email: /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/,
	        loginname: /^[\w]{5,20}$/,
	        pass: /^[\w~`!@#$%\^&*()\-+=;:'",.<>\/?\\|\[\]{}]{6,20}$/,
	        name: /^[\u4e00-\u9fa5]{2,5}$/,
	        company: /^[\s\S]{1,50}$/,
	        team: /^[\s\S]{0,50}$/
	    },
	    templateSettings: {
	        evaluate: /\{\{([\s\S]+?)\}\}/g,
	        interpolate: /\{\{=([\s\S]+?)\}\}/g,
	        escape: /\{\{-([\s\S]+?)\}\}/g
	    }
	};

/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';

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
	    var offset = options.offset || {};
	    offset.top = offset.top ? +offset.top.toString().replace('px', '') : 0;
	    offset.left = offset.left ? +offset.left.toString().replace('px', '') : 0;
	    options.enter = options.enter || $.noop;
	    options.leave = options.leave || $.noop;
	    var showTimeout = null;
	    var hideTimeout = null;
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
	        // set position
	        // $layer.css({
	        //     left: parseInt(
	        //             triggerPos.left 
	        //                 + ($trigger.width() - $layer.outerWidth()) / 2
	        //                 + offset.left
	        //         ),
	        //     top: parseInt(triggerPos.top + $trigger.height() + offset.top)
	        // });    
	        $layer.css({
	            left: offset.left,
	            top: offset.top
	        });
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
	/**
	* 表单验证器
	* @construtor
	* @param {Object} options 
	* @param {Object} options.input
	* @param {bool} options.required
	* @param {String} options.requiredError
	* @param {RegExp} options.regexp
	* @param {String} options.regexpError
	* @param {function(String):bool} validate 验证函数
	*/
	ui.Validator = function (options) {

	    this.input = options.input;
	    this.$input = $(options.input);
	    this.options = options;
	    var me = this;
	    this.$input.blur(function () {
	        me.check();
	    }).bind('keypress keydown keyup', function () {
	        if (me._checkTimes) {
	            me.check();
	        }
	    });
	    if (this.options.required || this.options.requiredTag) {
	        this.$input.closest('.control-group').addClass('required');
	    }
	};
	ui.Validator.prototype = {
	    check: function check() {
	        this._checkTimes = this._checkTimes || 0;
	        this._checkTimes++;
	        var msg = this._check();
	        if (msg) {
	            this.error(msg);
	            return false;
	        } else {
	            this.succss();
	            return true;
	        }
	    },
	    _check: function _check() {
	        if (this.options.trim !== false) {
	            this.$input.val($.trim(this.$input.val()));
	        }
	        var text = this.$input.val();
	        if (this.options.required && !text) {
	            return this.options.requiredError;
	        }
	        if (this.options.regexp && !this.options.regexp.test(text)) {
	            return this.options.regexpError;
	        }
	        if (this.options.validate) {
	            return this.options.validate(text);
	        }
	    },
	    error: function error(msg) {
	        var container = this.$input.closest('.control-group');
	        this._setErrorMsg(msg);
	        container.addClass('error');
	    },
	    succss: function succss() {
	        var container = this.$input.closest('.control-group');
	        this._setErrorMsg('');
	        container.removeClass('error');
	    },
	    _setErrorMsg: function _setErrorMsg(msg) {
	        var $error = this.$input.nextAll('.error-msg');
	        if (!$error.length) {
	            $error = $('<span></span>').addClass('error-msg');
	            this.$input.after($error);
	        }
	        $error.html(msg);
	    }
	};
	/**
	 * 表单验证器
	 * @construtor
	 * @param {Object} $form
	 * @param {Array.<Validator>} validators
	 */
	ui.FormValidator = function ($form, validators) {

	    if (!$form.length) {
	        return;
	    }
	    this.$form = $form;
	    this.validators = validators;
	    $form.submit(function () {
	        var success = true;
	        $.each(validators, function (i, item) {
	            if (!item.check()) {
	                success = false;
	            }
	        });
	        return success;
	    });
	};

	//生成自动头像
	ui.identicon = function () {
	    var $imgList = $("img.js-identicon");
	    for (var i = 0, len = $imgList.length; i < len; i++) {
	        var src = $imgList.eq(i).attr("src");
	        var result = src.match(/avatar\/.+?\?size/);
	        if (result && result[0]) {
	            src = result[0];
	            src = src.replace("avatar/", "").replace("?size", "");
	            var data = new Identicon(src, 420).toString();
	            $imgList.eq(i).attr("src", "data:image/png;base64," + data);
	        }
	    }
	};
	window.ui = ui;

/***/ },
/* 34 */
/***/ function(module, exports) {

	'use strict';

	imweb.DraftAutoSave = Class(EventEmitter, {
	    /**
	     * 自动保存草稿
	     * @construtor
	     * @param {Object} options 
	     */
	    constructor: function constructor(options) {
	        var DEFAULT_INTERVAL = 1000 * 60 * 0.05;
	        this.options = options;
	        this.draftId = options.draftId || null;
	        this.topicId = options.topicId || null;
	        this.input = this.options.input();
	        this._intervalId = setInterval(_.bind(this.autosave, this), options.interval || DEFAULT_INTERVAL);
	    },
	    autosave: function autosave() {
	        var me = this;
	        var input = me.options.input();
	        if (!input) {
	            return;
	        }
	        if (me.input.tab === input.tab && me.input.title === input.title && me.input.content === input.content) {
	            return;
	        }
	        // 新文章输入一定数目之后才开始保存
	        if (!me.draftId && me.input.content.length < 30) {
	            return;
	        }
	        me.save();
	    },
	    save: function save() {
	        var me = this;
	        var input = me.options.input();
	        if (!input) {
	            return;
	        }
	        imweb.ajax.post('/draft/autosave', {
	            data: _.extend({
	                draft_id: me.draftId,
	                topic_id: me.topicId
	            }, input)
	        }).done(function (data) {
	            if (data.ret === 0) {
	                var info = _.extend({
	                    draftId: data.data.id,
	                    draftCount: data.count
	                }, input);
	                me.input = input;
	                me.draftId = data.data.id;
	                me.topicId = data.data.topic_id || me.topicId;
	                me.emit('saved', info);
	            }
	        });
	    },
	    showHint: function showHint() {
	        var $hint = $('#draft-autosave-hint');
	        if (!$hint.length) {
	            $hint = $('<div id="draft-autosave-hint"></div>').appendTo(document.body);
	        }
	        $hint.css({
	            display: 'block',
	            opacity: 0
	        }).animate({
	            opacity: 0.7
	        }, 500, function () {
	            setTimeout(function () {
	                $hint.animate({
	                    opacity: 0
	                }, 500, function () {
	                    $hint.css({
	                        display: 'none'
	                    });
	                });
	            }, 1200);
	        });
	    },
	    dispose: function dispose() {
	        this.removeEvent();
	        if (this._intervalId) {
	            clearInterval(this._intervalId);
	            this._intervalId = null;
	        }
	    }
	});

/***/ }
]);