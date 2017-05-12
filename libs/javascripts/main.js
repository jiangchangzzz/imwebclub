(function() {
    var imweb = window.imweb = window.imweb || {};

    // markdown
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

    // set underscore template
    _.templateSettings = _.extend(_.templateSettings || {}, config.templateSettings);
    imweb.template = function(id, data) {
        return _.template(document.getElementById(id).innerHTML)(_.extend({
            _        : _,
            csrf     : imweb._csrf || '',
            markdown : imweb.markdown,
            md       : md,
            user     : imweb.user || null,
            isLogin  : !!imweb.user,
            isAdmin  : imweb.user && imweb.user.is_admin
        }, data || {}));
    }
    imweb.template.compile = function(source) {
        return _.template(source);
    }

    // user common function
    imweb.userUtils = imweb.userUtils || {};
    $.extend(imweb.userUtils, {
        isLogin: function() {
            return imweb.user && imweb.user.loginname;
        },
        checkLogin: function() {
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
        post: function(url, options) {
            options = options || {};
            options.data = $.extend({
                _csrf: imweb._csrf
            }, options.data || {});
            return $.ajax(url, $.extend({
                method: 'post'
            }, options));
        },
        get: function(url, options) {
            options = options || {};
            return $.ajax(url, $.extend({
                method: 'get'
            }, options));
        },
        fail: function(xhr) {
            if (xhr.status === 403) {
                alert('请先登录，登陆后即可点赞。');
            } else if(xhr.status >= 500) {
                alert('系统异常，请稍候重试。');
            } else {
                alert('系统错误，请稍候重试。');
            }
        }
    });

    $(function() {
        // add csrf to form 
        $('form').submit(function() {
            if (!$(this).find('*[name=_csrf]').length) {
                $('<input type="hidden" name="_csrf" />').val(imweb._csrf)
                    .appendTo($(this));
            };
        });
    });
})();

/**
 * auto complete
 */
$(function() {
    $('.email-autocomplete').each(function() {
        $(this).autocomplete({
            appendTo: $('<div></div>').addClass('email-autocomplete-content')
                .appendTo($(document.body)),
            source: function(req, resp) {
                var term = req.term; 
                var match = term.match(/([^@]*)@([\s\S]*)$/);
                if (!match || !match[1]) {
                    resp([]); // not got a @ or empty
                    return;
                }
                var prefix = match[1];
                var domain = match[2] || '';
                var items = [];
                $.each(config.MAIL_DOMAIN, function(i, item) {
                    if (!domain || item.indexOf(domain) === 0) {
                        items.push([prefix, '@', item].join(''));
                    }
                });
                resp(items);
            }
        });
    });
    $('.company-autocomplete').each(function() {
        $(this).autocomplete({
            minLength: 1,
            appendTo: $('<div></div>').addClass('company-autocomplete-content')
                .appendTo($(document.body)),
            source: function(req, resp) {
                var $ele = $(this.element);
                var term = req.term;
                $.ajax('/team/companyComplete', {
                    data: {company: term},
                    dataType: 'json',
                    success: function(data) {
                        if ($ele.val() === term) {
                            resp(data.items);
                        }
                    }
                });
            }
        });
    });
    $('.team-autocomplete').each(function() {
        $(this).autocomplete({
            minLength: 0,
            appendTo: $('<div></div>').addClass('team-autocomplete-content')
                .appendTo($(document.body)),
            source: function(req, resp) {
                var companyId = $(this.element).data('teamCompanyId') || '';
                var company = $('#' + companyId).val();
                if (!company) {
                    return;
                }
                var $ele = $(this.element);
                var term = req.term;
                $.ajax('/team/teamComplete', {
                    data: {company: company, team: term},
                    dataType: 'json',
                    success: function(data) {
                        if ($ele.val() === term) {
                            resp(data.items);
                        }
                    }
                });
            }
        }).focus(function() {
            $(this).autocomplete('search', $(this).val());
        });
    });
});

/**
 * user card
 */
$(function() {
    var userCardAction = {
        follow: function(e) {
            var me = this;
            var $userCard = $(e.target).closest('.user-card');
            var masterId = $userCard.data('id');
            var hasFollowed = $userCard.data('hasFollowed') || false;
            imweb.ajax.post('/follow/follow', {
                data: {
                    master: masterId,
                    cancel: hasFollowed
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    me.setFollowInfo($userCard, data.data);
                }
            });
            return false;
        },
        loadFollowInfo: function($userCard) {
            var me = this;
            var masterId = $userCard.data('id');
            imweb.ajax.post('/follow/masterFollowInfo', {
                data: {master: masterId}
            }).done(function(data) {
                me.setFollowInfo($userCard, data.data);
            });
        },
        setFollowInfo: function($userCard, data) {
            var btnText = data.hasFollowed ? '取消关注' : '关注';
            $userCard.find('.user-card-follow-btn').html(btnText);
            $userCard.find('.follower-count').html(data.masterFollowerCount);
            $userCard.data('hasFollowed', data.hasFollowed);
        }
    };
    var me = userCardAction;
    $(document).on('click', '.user-card-follow-btn', _.bind(me.follow, me));
    $('.user-card').each(function() {
        me.loadFollowInfo($(this));
    });
});

// nav bar
$(function() {
    ui.attachDropdownLayer($('#nav-user-menu'), {
        layer: '#nav-user-menu-layer',
        offset: {
            top: 50,
            left: 84
        },
        enter: function() {
            $(this).closest('.user-sidebar-item')
                .addClass('user-sidebar-item-active');
        },
        leave: function() {
            $(this).closest('.user-sidebar-item')
                .removeClass('user-sidebar-item-active');
        }
    }); 
});

$(function() {
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
