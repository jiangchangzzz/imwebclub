define([
    'lodash',
    '../../../server/common/render_helper',
    '../template/tplReplyItem.js',
    '../template/tplReplySubItem.js',
    '../libs/editor/editor.js',
    '../libs/editor/ext.js',
    '../libs/remarkable.js',
    '../libs/webuploader/webuploader.withoutimage.min.js',
    '../libs/jquery.caret.js',
    '../libs/jquery.atwho.js',
    './md.js'
], function(_, render_helper, tplReplyItem, tplReplySubItem, editor, ext, Remarkable, webuploader){
    window.Editor = editor.Editor;
    var CodeMirror = editor.CodeMirror;
    ext(Editor, Remarkable, webuploader.Webuploader);
    //console.log(Editor);
    window.replyAction = {
        /**
         * 初始化文章评论列表
         */
        initReplyList: function(kind, parentId, parentAuthor, replies, reply_up_threshold, customerIcos, customerStatus) {
            this.kind = kind;
            this.parentId = parentId;
            this.parentAuthor = parentAuthor;
            this.replies = replies || [];
            this.reply_up_threshold = reply_up_threshold || 100;
            this.customerIcos = customerIcos;
            this.customerStatus = customerStatus;
            this.replyListAppend(replies);
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
            var subRepliesHTML = null;
            if(item.subReplies){
              subRepliesHTML = $.map(item.subReplies, function(item, i) {
                  return me.renderSubReplyItem(item, i);
              }).join('');
            }
            item.content = render_helper.markdownRender(item.content);
            //console.log(item);
            return tplReplyItem({
                reply_up_threshold: me.reply_up_threshold,
                index: index,
                user: user,
                markdown: imweb.markdown,
                isAdmin: user && user.is_admin,
                isLogin: user && user.loginname,
                isAuthor: user && user.id === item.author.id,
                isParentAuthor: user && user.loginname === me.parentAuthor.loginname,
                reply: $.extend({}, item, {
                    subReplies: item.subReplies || [],
                    subRepliesHTML: subRepliesHTML
                }),
                customerIcos: me.customerIcos,
                customerStatus: me.customerStatus
            });

        },
        /**
         * 渲染一条二级评论
         * @param {Object} item 评论
         * @param {number} index 评论索引
         * @return {string} html
         */
        renderSubReplyItem: function(item, index) {
            var me = this;
            var user = imweb.user;
            item.text = $(item.content).text();
            return tplReplySubItem({
                reply: item,
                user: imweb.user,
                markdown: imweb.markdown,
                isAdmin: imweb.user && imweb.user.loginname && imweb.user.is_admin,
                isLogin: imweb.user && imweb.user.loginname,
                isAuthor: user && user.loginname === item.author.loginname,
                isParentAuthor: user && user.loginname === me.parentAuthor.loginname,
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
        initEditor: function(selector) {
            var $ele = $(selector);
            if($ele.data('editorInited')){
              return;
            }else{
              $ele.data('editorInited', true);

              var editor = new Editor({
                  status: [],
                  markdown: imweb.markdown
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
            }
        },
        /**
         * 提交评论
         */
        replySubmit: function(e) {
            var me = this;
            var editor = $('.editor-wrap .editor').data('editor');console.log(editor);
            var content = editor.codemirror.getValue();
            if (!content) {
                alert('回复不可为空');
                return;
            }
            imweb.ajax.post('/' + me.kind + '/' + me.parentId + '/reply',{
                data: {
                    content: content
                }
            }).done(function(data) {
                if (data.ret === 0 && data.data) {
                    me.replyListAppend(data.data.reply);
                    editor.codemirror.setValue('');
                    $('.reply-count').html(data.data.reply_count);
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
            var $subCount = $reply.find('.sub-count');
            var replyId = $reply.data('reply-id');
            var $editor = $reply.find('.editor');
            var content = $editor.data('editor').codemirror.getValue() || $editor.val();
            if (!content) {
                alert('回复不可为空');
                return;
            }
            imweb.ajax.post('/' + me.kind + '/' +  me.parentId + '/reply',{
                data: {
                    reply_id: replyId,
                    content: content
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    me.subReplyListAppend($subReplyList, data.data.reply);
                    $subCount.text(parseInt($subCount.text())+1);
                    $editor.data('editor').codemirror.setValue('');
                    $('.reply-count').html(data.data.reply_count);
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
            var replyId = $reply.data('reply-id');
            if (!confirm('确定要删除此回复吗？')) {
                return;
            }
            imweb.ajax.post('/reply/' + replyId + '/delete', {
                data: {
                    reply_id: replyId,
                    parent_id: me.parentId
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    $reply.remove();
                    $('.reply-count').html(data.reply_count);
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
         * 赞评论
         */
        upReply: function(e) {
            var me = this;
            var $ele = $(e.target);
            if (!(imweb.user && imweb.user.loginname)) {
                alert('请登陆。');
                return;
            }
            if($ele.closest('.updown').data('mine').toString() === 'true'){
              alert('您无法对自己的评论点赞。');
              return;
            }
            var $reply = me._getReplyItem($ele);
            var replyId = $reply.data('reply-id');
            var cancel = $ele.hasClass('fa-caret-down');

            imweb.ajax.post('/operate/up', {
                data: {
                    kind: 'reply',
                    object_id: replyId,
                    cancel: cancel
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    $ele.toggleClass('hidden');
                    $ele.siblings('.fa').toggleClass('hidden');
                    $ele.closest('.reply-item').find('.updown .count').text(data.data.count);
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
            } else {
                $editArea.hide();
                $ele.html('回复');
            }
            // 隐藏其它的编辑器
            var $otherEditorAreas = $reply.closest('#reply-list')
                .find('.reply-edit-area').not($editArea);
            $otherEditorAreas.hide();
            var $notActived = $('.open-sub-reply').not($ele);
            for(var i=0,len=$notActived.length;i<len;i++){
                $notActived.eq(i).html('回复');
            }
        },
    };
});
