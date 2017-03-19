define([
    'lodash',
    '../../../common/render_helper',
    '../template/tplReplyItem.js',
    '../template/tplReplySubItem.js',
    '../libs/editor/editor.js',
    '../libs/webuploader/webuploader.withoutimage.js',
    './jquery.caret.js',
    './jquery.atwho.js',
    './md.js'
], function(_, render_helper, tplReplyItem, tplReplySubItem, editor){
    var Editor = editor.Editor,
        CodeMirror = editor.CodeMirror;
    //console.log(Editor);
    var topicAction = {
        /**
         * 初始化文章评论列表
         */
        initReplyList: function() {
            this.replyListAppend(imweb.topic.replies || []);
        },
        /**
         * 添加评论
         * @param {Array.<Object>|Object} replies 评论
         */
        replyListAppend: function(replies) {
            replies = $.isArray(replies) ? replies : [replies];
            var me = this;
            var list = $('#reply-list');
            var currLen = list.find('> li').length;
            var html = $.map(replies, function(item, i) {
                return me.renderReplyItem(item, i + currLen);
            }).join('');
            list.append(html);
            $('#topic-reply-panel').removeClass('hide');

            me.changeImgSrc();
        },
        /**
         * 渲染一条评论
         * @param {Object} item 评论
         * @param {number} index 评论索引
         * @return {string} html
         */
        renderReplyItem: function(item, index) {
            //console.log(item);
            var me = this;
            var user = imweb.user;
            var topic = imweb.topic;
            //console.log(topic);
            var subRepliesHTML = null;
            if(item.subReplies){
              subRepliesHTML = $.map(item.subReplies, function(item, i) {
                  return me.renderSubReplyItem(item, i);
              }).join('');
            }
            item.content = render_helper.markdownRender(item.content);
            return tplReplyItem({
                topic: topic,
                index: index,
                user: user,
                markdown: imweb.markdown,
                isAdmin: user && user.loginname && user.is_admin,
                isLogin: user && user.loginname,
                isAuthor: user && user.id === item.author_id,
                isTopicAuthor: user && user.loginname === topic.author.loginname,
                reply: $.extend({}, item, {
                    author: {
                      loginname:'**',
                      avatar: '../../images/avatarDefault.jpg'
                    },
                    subReplies: [],
                    subRepliesHTML: subRepliesHTML
                })
            });

        },
        /**
         * 渲染一天二级评论
         * @param {Object} item 评论
         * @param {number} index 评论索引
         * @return {string} html
         */
        renderSubReplyItem: function(item, index) {
            var user = imweb.user;
            var topic = imweb.topic;

            return tplReplySubItem({
                reply: item,
                user: imweb.user,
                markdown: imweb.markdown,
                isAdmin: imweb.user && imweb.user.loginname && imweb.user.is_admin,
                isLogin: imweb.user && imweb.user.loginname,
                isAuthor: user
                    && user.loginname === item.author.loginname,
                isTopicAuthor: user
                    && user.loginname === topic.author.loginname,
                index: index
            });
        },
        /**
         * 添加二级评论至dom树
         * @param {Object} $list 二级评论list
         * @param {Array.<Object>|Object} replies 二级评论
         */
        subReplyListAppend: function($list, replies) {
            replies = $.isArray(replies) ? replies : [replies];
            var me = this;
            var currLen = $list.find('> li').length;
            var html = $.map(replies, function(item, i) {
                return me.renderSubReplyItem(item, i + currLen);
            }).join('');
            $list.append(html);
            me.changeImgSrc();
        },
        changeImgSrc: function(){
            var __avatarList = $(".user-avatar-wrap img.ui-avatar-38");
                for(var i=0,len=__avatarList.length;i<len;i++){
                    __avatarList.eq(i).attr("src",  __avatarList.eq(i).attr("src").replace('//www.gravatar.com', '//gravatar.com'));
            }
        },
        getAllNames: function() {
            var names = [];
            $('#reply-list .user-url').each(function() {
                var name = $.trim($(this).attr('title'));
                if (name.length) {
                    names.push(name);
                }
            });
            return names;
        },
        /**
         * 初始化一个编辑器
         * @param {Object} $ele textarea
         */
        initEditor: function($ele) {
            if (!$ele.length || $ele.data('editorInited')) {
                return;
            }
            $ele.data('editorInited', true);

            var editor = new Editor({
                status: []
            });
            editor.render($ele[0]);
            $ele.data('editor', editor);

            var $input = $(editor.codemirror.display.input);
            $input.keydown(function(event) {
                if (event.keyCode === 13 && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    $ele.closest('form').submit();
                }
            });

            // at.js 配置
            var allNames = this.getAllNames();
            var codeMirrorGoLineUp = CodeMirror.commands.goLineUp;
            var codeMirrorGoLineDown = CodeMirror.commands.goLineDown;
            var codeMirrorNewlineAndIndent = CodeMirror.commands.newlineAndIndent;
            $input.atwho({
                at: '@',
                data: allNames
            }).on('shown.atwho', function() {
                CodeMirror.commands.goLineUp = _.noop;
                CodeMirror.commands.goLineDown = _.noop;
                CodeMirror.commands.newlineAndIndent = _.noop;
            }).on('hidden.atwho', function() {
                CodeMirror.commands.goLineUp = codeMirrorGoLineUp;
                CodeMirror.commands.goLineDown = codeMirrorGoLineDown;
                CodeMirror.commands.newlineAndIndent = codeMirrorNewlineAndIndent;
            });
        },
        /**
         * 提交评论
         */
        replySubmit: function(e) {
            var me = this;
            var topicId = imweb.topic.id;
            var editor = $('.topic-reply-panel .editor').data('editor');
            var content = editor.codemirror.getValue();
            if (!content) {
                alert('回复不可为空');
                return;
            }
            imweb.ajax.post('/' + topicId + '/reply',{
                data: {
                    content: content
                }
            }).done(function(data) {
                if (data.ret === 0 && data.data) {
                    $(".reply-panel").removeClass("hide");
                    me.replyListAppend(data.data.reply);
                    editor.codemirror.setValue('');
                    $('.topic-reply-count').html(data.data.topic.reply_count);
                }
            }).fail(imweb.ajax.fail);
        },
        /**
         * 提交二级评论
         */
        subReplySubmit: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $reply = $ele.closest('.reply-item');
            var $subReplyList = $reply.find('.sub-reply-list');
            var editor = $reply.find('.editor').data('editor');
            var topicId = imweb.topic.id;
            var replyId = $reply.data('replyId');
            var content = editor.codemirror.getValue();
            if (!content) {
                alert('回复不可为空');
                return;
            }
            imweb.ajax.post('/' + topicId + '/reply',{
                data: {
                    reply_id: replyId,
                    content: content
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    me.subReplyListAppend($subReplyList, data.data.reply);
                    editor.codemirror.setValue('');
                    $('.topic-reply-count').html(data.data.topic.reply_count);
                }
            }).fail(imweb.ajax.fail);
        },
        /**
         * 删除评论
         */
        deleteReply: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $reply = me._getReplyItem($ele);
            var replyId = $reply.data('replyId');
            if (!confirm('确定要删除此回复吗？')) {
                return;
            }
            imweb.ajax.post('/reply/' + replyId + '/delete', {
                data: {
                    reply_id: replyId
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    $reply.remove();
                } else {
                    alert(data.msg || '');
                }
            }).fail(imweb.ajax.fail);
        },
        _getReplyItem: function($child) {
            if ($child.closest('.sub-reply-item').length) {
                return $child.closest('.sub-reply-item');
            } else {
                return $child.closest('.reply-item');
            }
        },
        /**
         * 收藏文章
         */
        collect: function(e) {
            var $ele = $(e.target);
            var cancelVal = $ele.data('cancel');
            var cancel = cancelVal.toString() === 'true';
            var topicId = imweb.topic.id;
            imweb.ajax.post('/topic/collect', {
                data: {
                    cancel: cancel,
                    topic_id: topicId
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    cancel = !cancel;
                    $ele.attr('title', cancel ? '取消收藏' : '收藏');
                    $ele.data('cancel', cancel);
                    cancel
                        ? $ele.addClass('collected')
                        : $ele.removeClass('collected');
                    $('.topic-collect-count').html(data.data.topicCollectCount);
                }
            });
        },

        /**
         * 赞评论
         */
        upReply: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $reply = me._getReplyItem($ele);
            var replyId = $reply.data('replyId');
            var cancelVal = $ele.data('cancel');
            if(!cancelVal) return;

            var cancel = cancelVal.toString() === 'true';
            if (!imweb.userUtils.checkLogin()) {
                return;
            }
            imweb.ajax.post('/reply/' + replyId + '/up', {
                data: {
                    reply_id: replyId,
                    cancel: cancel
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    data = data.data;
                    cancel = !cancel;
                    $ele.data('cancel', cancel);
                    $ele.html(cancel ? '取消赞' : '赞');
                    $ele.closest('.reply-item')
                        .find('.up-count').html(data.reply.ups.length);
                } else if (data.msg) {
                    alert(data.msg);
                }
            }).fail(imweb.ajax.fail);
        },
        /**
         * 打开二级回复
         */
        openSubReply: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $reply = $ele.closest('.reply-item');
            var $subReply = $reply.find('.sub-reply');
            var $editor = $reply.find('.editor');
            if (!$editor.data('editor')) {
                me.initEditor($editor);
            }
            var $editArea = $reply.find('.reply-edit-area');
            if ($editArea.css('display') === 'none') {
                /*$editArea.show('fast', function() {
                    var cm = $editor.data('editor').codemirror;
                    cm.focus();
                });*/
                $editArea.show();
                $editor.data('editor').codemirror.focus();
                $editor.closest(".editor-wrap").find(".editor-toolbar").hide();
                $ele.html('收起');
                $subReply.removeClass("hide");
            } else {
                $editArea.hide();
                $ele.html('回复('+$ele.data("count")+')');
                $subReply.addClass("hide");
            }
            // 隐藏其它的编辑器
            var $otherEditorAreas = $reply.closest('#reply-list')
                .find('.reply-edit-area').not($editArea);
            $otherEditorAreas.hide();
            var $notActived = $('.open-sub-reply').not($ele);
            for(var i=0,len=$notActived.length;i<len;i++){
                $notActived.eq(i).html('回复('+$notActived.eq(i).data("count")+')');
            }
        },
        /**
         * 删除文章
         */
        deleteTopic: function(e) {
            var topicId = imweb.topic.id;
            if (!confirm('确定要删除此话题吗？')) {
                return ;
            }
            imweb.ajax.post('/topic/' + topicId + '/delete')
                .done(function(data) {
                    if (data.ret === 0) {
                        location.href = '/';
                    } else if (data.msg) {
                        alert(data.msg);
                    }
                });
        }
    };

    $(function() {
        var me = topicAction;
        me.initReplyList();
        me.initEditor($('.topic-reply-panel .editor'));
        $('.reply-submit').click(_.bind(me.replySubmit, me));
        $('#content').on(
            'click',
            '.sub-reply-submit',
            _.bind(me.subReplySubmit, me)
        ).on(
            'click',
            '.delete-reply',
            _.bind(me.deleteReply, me)
        ).on(
            'click',
            '.up-reply',
            _.bind(me.upReply, me)
        ).on(
            'click',
            '.open-sub-reply',
            _.bind(me.openSubReply, me)
        );
        $('.collect-topic-btn').click(_.bind(me.collect, me));
        $('.delete-topic-btn').click(_.bind(me.deleteTopic, me));


        //修改rich meta
        var rich_name = $('meta[itemprop = "name"]');
        var rich_description = $('meta[itemprop = "description"]');
        var rich_image = $('meta[itemprop = "image"]');

        rich_name.attr("content","imweb前端社区文章：" + RICH_META.name);
        rich_description.attr("content",RICH_META.author +":" +RICH_META.name);
        rich_image.attr("content",RICH_META.img);
    });
});
