var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;

$(function(){
    $(".in-title").bind("input propertychange", function(){
        var val = $(this).val();
        if(val.replace(/\s+/g,"").length == 0){
            val = '<span class="empty-title">请在左侧输入文章标题</span>';
        }
        $(".out-title").html(val);
    });

    $(".in-tab").bind("click", function(){
        $(".js-tab-empty").addClass("hide");
        $(".in-tab").removeClass("current-tab");
        $(".out-tab").removeClass("hide").html($(this).addClass("current-tab").html()).attr("href", "/tab/"+$(this).data("val"));
    });
})
// editor
$(function() {
    var editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'gfm',
        lineNumbers: true,
        matchBrackets: true,
        lineWrapping: true,
        theme: 'ryan-dark'
    });

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

    function setOutput(val){
        //// TODO: use image first.

        //console.log(val);
        var es5 = $.support.leadingWhitespace;
        val = val.replace(/\$\$((.*?\n)*?.*?)\$\$/ig, function(a, b){
            return '<img src="http://latex.codecogs.com/png.latex?' + encodeURIComponent(b) + '" />';
        });
        val = marked(val);
        //extend arked by note tag
        val = val.replace(/\{\{tags:(.*)\}\}/ig,function(a,b){
            var ls = b.replace(/(^\s*)|(\s*$)/g,'').split(/[ /|]/).join('</code><code>');
            return '<p class="marked_tag"><code>'+ls+'</code></p>';
        });

        document.getElementById('out').innerHTML = val;
        //console.log(val);
    }

    var exports = _.extend(new EventEmitter(), {
        editor: editor,
        getValue: function() {
            return  editor.getValue();
        },
        setValue: function(content) {
            editor.setValue(content);
        },
        getTitle: function() {
            var match = editor.getValue().match(/# *(.*)([\r\n]|$)/);
            return match ? match[1] : '';
        },
        setTitle: function(title) {
            $('#cur-article-title').val(title);
        },
        setArticle: function(article){
            editor.setValue(article.content);
            //由于editor是由第三方组件生成，对象没有setTitle和setSort的接口，则自己定义
            this.setTitle(article.title);
            this.setSort(article.tab);

        },
        setSort: function (sort) {
            var selector = '.in-tab[data-val="' + sort + '"]';
            $('#top').find(selector).trigger('click');
        },
        getContent: function() {
            return editor.getValue().replace(/^\s*(```)\s*(.*)/g, "$1 $2")
            return editor.getValue().replace(/^\s*(#+)\s*(.*)/g, "$1 $2");
            // return editor.getValue().replace(/^\s*#[^\r\n]*[\r\n]*/, '');
        },
        getHtml: function() {
            return $('#out').html();
        },
        focus: function() {
            editor.focus();
        },
        /**
         * 将当前文本保存起来
         */
        push: function() {
            this._stores = this._stores || [];
            this._stores.push(this.getValue());
        },
        pop: function() {
            this.setValue(this._stores.pop());
        },
        insertImg: function(url) {
            editor.replaceSelection('![](' + url + ')');
        }
    });

    //content change
    editor.on("change", function(cm, change) {
        var val = editor.getValue();
        setOutput(val);
        exports.emit('change', val);
    });

    //scroll bar sync
    editor.on("scroll",function(cm){
        var obj = cm.getScrollInfo();
        var dom = document.getElementById('out');

        var sh = obj.height;
        var ch = obj.clientHeight;
        var ch2 = ch;
        var st = obj.top;
        var sh2 = dom.scrollHeight;

        dom.scrollTop = Math.floor(st * (sh2 - ch) / (sh - ch));
    });

    // drop file to edit
    $(document).on('drop', function(e){
        e.preventDefault();
        e.stopPropagation();

        var theFile = e.dataTransfer.files[0];
        var theReader = new FileReader();
        theReader.onload = function(e){
            editor.setValue(e.target.result);
        };

        theReader.readAsText(theFile);
    }, false);

    window.editorAction = exports;
});

// 文章信息
$(function() {
    var exports = _.extend(new EventEmitter(), {
        draftAutoSaveDisabled: false,
        _context: null,
        getContext: function() {
            return _.extend({}, this._context, {
                title: $(".in-title").val(),
                tab: $(".in-tab.current-tab").data("val"),
                content: editorAction.getContent(),
                html: editorAction.getHtml()
            });
        },
        setContext: function(context) {
            context = $.extend({}, context, {
                title: context.title || '',
                content: context.content || ''
            });
            this._context = context;
            // editorAction.setValue(context.content);
            editorAction.setArticle(context);
            // editorAction.setValue('# ' + context.title + '\n' + context.content);
            if (this._draftAutoSave) {
                this._draftAutoSave.dispose();
            }
            var me = this;
            me._draftAutoSave = new imweb.DraftAutoSave({
                draftId: context.draftId || null,
                topicId: context.topicId || null,
                input: function() {
                    if (me.draftAutoSaveDisabled) {
                        return null;
                    }
                    var context = me.getContext();
                    return {
                        tab: context.tab,
                        title: context.title,
                        content: context.content
                    };
                }
            });
            me._draftAutoSave.on('saved', function(data) {
                me.updateContext('draftId', data.draftId);
                me.emit('draftsaved', data);
            });
        },
        updateContext: function(field, value) {
            this._context[field] = value;
        },
        newFile: function() {
            exports.setContext({
                tab: '',
                title: '',
                content: ''
            });
        },
        saveDraft: function() {
            if (this._draftAutoSave) {
                this._draftAutoSave.save();
            }
        },
        alert: function(msg) {
            var $error = $('#alert-error');
            $error.find('.msg').html(msg);
            sidebarAction.openMask($error);
        },
        publish: function() {
            var context = this.getContext();
            if (!context.title) {
                this.alert('请输入文章标题');
                return;
            }
            if (!context.tab) {
                //sidebarInfoAction.open({}, _.bind(this.publish, this));
                this.alert('请选择文章分类');
                return;
            }
            if (!context.content) {
                this.alert('请输入文章内容');
                return;
            }

            var url;
            var data = {
                json: true,
                tab: context.tab,
                title: context.title,
                content: context.content
            };
            if (context.topicId) {
                data.topic_id = context.topicId;
                url = '/topic/' + context.topicId + '/edit';
            } else {
                url = '/topic/save';
            }
            imweb.ajax.post(url, {data: data}).done(function(data) {
                if (data.ret === 0) {
                    if (context.draftId) {
                        imweb.ajax.post('/draft/delete/' + context.draftId)
                            .done(function() {
                                location = '/topic/' + data.data.id;
                            });
                    } else {
                        location = '/topic/' + data.data.id;
                    }
                } else {
                    alert(data.msg || '系统异常');
                }
            });
        },
        saveBlob: function() {
            var code = editorAction.getValue();
            var blob = new Blob([code], { type: 'text/plain' });
            var info = getMarktangInfo();
            var name = info.title +  ".md";
            if(window.saveAs){
                window.saveAs(blob, name);
            }else if(navigator.saveBlob){
                navigator.saveBlob(blob, name);
            }else{
                url = URL.createObjectURL(blob);
                var link = document.createElement("a");
                link.setAttribute("href",url);
                link.setAttribute("download",name);
                var event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                link.dispatchEvent(event);
            }
        }
    });
    /*
    $(document).on('keydown', function(e){
        if(e.keyCode == 83 && (e.ctrlKey || e.metaKey)){
            e.preventDefault();
            return false;
        }
    });

    */
    function saveMarktang(info){
        if (!info){
            info = getMarktangInfo();
        }
        info.type = 'json';
        $.post('/marktang/save',info,function(o){
        });
    }

    function getMarktangInfo(){
        var context = exports.getContext();
        return {
            title : context.title,
            context : context.content,
            html : context.html,
            id : context.id || '',
            guid : context.guid || '',
            _csrf : imweb._csrf
        };
    }
    function postMarktang(url,info){
        var form = $("<form/>").attr('action',url)
            .attr('method','post')
            .attr('target','_blank');

        for (var key in info){
            form.append('<input type="hidden" name="'+key+'" value="" />');
            form.children('[name="'+key+'"]').val(info[key]);
        }
        form.appendTo("body").css('display','none').submit();
    }
    $('#sidebar-save').on('click',function(e){
        var type =  $(e.target).attr('_type');
        var info = getMarktangInfo();
        switch(type){
            case 'publish':
                sidebarAction.closeMask();
                exports.publish();
                break;
            case 'save_draft':
                exports.saveDraft();
                sidebarAction.closeMask();
                break;
            case 'save_md':{
                exports.saveBlob();
            }break;
            case 'save_pdf':{
                alert('保存PDF, 打印目标设为"另存为PDF"即可');
                document.body.innerHTML = $('#out').html();
                window.print();
                window.location.reload();
            }break;
            case 'save_imweb': {
                postMarktang("http://test.imweb.io/topic/create",info);
            }break;
            case 'save_html':{
                postMarktang("http://test.imweb.io/marktang/html",info);
            }break;
            case 'save_evernote':{
                postMarktang("http://test.imweb.io/marktang/evernote_save?type=evernote",info);
            }break;

            case 'save_yinxiang':{
                postMarktang("http://test.imweb.io/marktang/evernote_save?type=yinxiang",info);
            }break;
            case 'mark_new':{
                exports.newFile();
                sidebarAction.closeMask();
            }break;
            case 'mark_sample':
                sidebarAction.enterSample();
                break;
            //这样写不好，但我没时间了……litten
            case 'my_article':
                $(".fa-history").trigger("click");
                break;
            case 'my_draft':
                $(".fa-edit").eq(0).trigger("click");
                break;
        }
    });

    setTimeout(function() {
        // init
        var initedContext = {
            topicId: null,
            draftId: null,
            tab: '',
            title: '',
            content: ''
        };
        var topic = imweb.topic;
        if (topic) {
            $.extend(initedContext, {
                topicId: topic.id,
                tab: topic.tab,
                title: topic.title,
                content: html_decode(topic.content)
            });
        }
        exports.setContext(initedContext);
        if (utils.getQueryString('autoOpenInfo') === 'true') {
            // sidebarInfoAction.open({
            //     noCheckTab: true
            // }, $.noop);
        }
    }, 1);
    window.mainAction = exports;
});

// sidebar
$(function() {
    var exports = _.extend(new EventEmitter(), {
        openMask: function($upper) {
            var $mask = $('#mask');
            $mask.show();
            $upper.show();
            var uppers = $mask.data('uppers') || [];
            uppers.push($upper);
            $mask.data('uppers', uppers);
        },
        closeMask: function() {
            var $mask = $('#mask');
            $mask.hide();
            var uppers = $mask.data('uppers') || [];
            $.each(uppers, function(i, item) {
                item.hide();
            });
        },
        loadMyTopic: function() {
            var $list = $('#sidebar-mytopic-list');
            imweb.ajax.post('/api/v1/topic/listmy',{
                data: {
                    limit: 100,
                    accesstoken: imweb.user.accessToken
                }
            }).done(function(data) {
                var list = data.data;
                var html = $.map(list, function(item, i) {
                    return imweb.template('topic-list-item', {
                        item: item,
                        index: i
                    });
                });
                $list.html(html);
            });
        },
        loadDraft: function() {
            var $list = $('#sidebar-draft-list');
            imweb.ajax.get('/draft/listmy', {
                data: {
                    limit: 100
                }
            }).done(function(data) {
                var list = data.data;
                var html = $.map(list, function(item, i) {
                    return imweb.template('draft-list-item', {
                        item: item,
                        index: i
                    });
                });
                $list.html(html);
            });
        },
        /**
         * 进入样例
         */
        enterSample: function() {
            $('.cmd-list-sample').removeClass('hide');
            $('.cmd-list-normal').addClass('hide');
            mainAction.draftAutoSaveDisabled = true;
            editorAction.push();
            editorAction.setValue($('#marktang_origin').val());
            this.closeMask();
        },
        /**
         * 离开样例
         */
        leaveSample: function() {
            $('.cmd-list-sample').addClass('hide');
            $('.cmd-list-normal').removeClass('hide');
            editorAction.pop();
            mainAction.draftAutoSaveDisabled = false;
        }
    });
    $('.cmd-list').on('click', '.cmd', function(e) {
        var type = $(e.target).data('type');
        var $addr = $('#sidebar-' + type);
        if ($addr.length) {
            exports.openMask($addr);
        }
        switch (type) {
            case 'info':
                sidebarInfoAction.open();
                break;
            case 'publish':
                mainAction.publish();
                break;
            case 'mytopic':
                exports.loadMyTopic();
                break;
            case 'draft':
                exports.loadDraft();
                break;
            case 'leave-sample':
                exports.leaveSample();
                break;
        }
        return false;
    });
    $('#mask').on('click', _.bind(exports.closeMask, exports));
    window.sidebarAction = exports;
});

/**
 * 文章信息
 */
$(function() {
    var exports = {
        $main: $('#sidebar-info'),
        open: function(options, callback) {
            options = options || {};
            sidebarAction.openMask(this.$main);
            var infos = mainAction.getContext();
            this.$main.find('.topic-title').html(infos.title);
            this.$main.find('.topic-tab').val(infos.tab);
            //todo 优化
            $(".out-title").html(infos.title);
            $(".in-title").val(infos.title);

            if (!options.noCheckTab) {
                this._checkTab();
            }
            callback
                ? this.$main.find('.step-continue').show()
                : this.$main.find('.step-continue').hide();
            this._continueCallback = callback;
        },
        tabChange: function() {
            this._checkTab();
            mainAction
                .updateContext('tab', this.$main.find('.topic-tab').val());
        },
        stepContinue: function() {
            $('#mask').hide();
            this.$main.hide();
            this._continueCallback && this._continueCallback();
        },
        _checkTab: function() {
            var $select = this.$main.find('.topic-tab');
            var val = $select.val();
            var $group = $select.closest('.control-group');
            val ? $group.removeClass('error') : $group.addClass('error');
        }
    };
    exports.$main.find('.topic-tab')
        .change(_.bind(exports.tabChange, exports));
    exports.$main.find('.step-continue')
        .click(_.bind(exports.stepContinue, exports));
    window.sidebarInfoAction = exports;
});

function html_decode(str){
  var s = "";
  if (str.length == 0) return "";
  s = str.replace(/&gt;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&#39;/g, "\'");
  s = s.replace(/&quot;/g, "\"");
  s = s.replace(/<br>/g, "\n");
  return s;
}
/**
 * 文章&草稿列表
 */
$(function(){
    var exports = {
        deleteDraft: function(e) {
            var me = this;
            var $item = $(e.target).closest('.sidebar-list-item');
            var id = $item.data('draftId');
            imweb.ajax.post('/draft/delete/' + id).done(function(data) {
                if (data.ret === 0) {
                    $item.remove();
                    me.updateDraftCount(data.count);
                }
            });
            return false;
        },
        editTopic: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $item = $ele.hasClass('sidebar-list-item')
                ? $ele : $ele.closest('.sidebar-list-item');
            var id = $item.data('id');
            var draftId = $item.data('draftId');
            // delete draft
            if (draftId) {
                imweb.ajax.post('/draft/delete/' + draftId).done(function(data) {
                    if (data.ret === 0) {
                        me.updateDraftCount(data.count);
                    }
                });
            }
            imweb.ajax.get('/api/v1/topic/' + id + '/get').done(function(data) {
                if (data.ret === 0) {
                    var item = data.data.topic;
                    mainAction.setContext({
                        topicId: item.id,
                        tab: item.tab,
                        title: item.title,
                        content: html_decode(item.content)
                    });
                    $item.removeClass('edit-draft').addClass('edit-topic');
                    //sidebarAction.closeMask();
                }
            });
        },
        editDraft: function(e) {
            var me = this;
            var $ele = $(e.target);
            var $item = $ele.hasClass('sidebar-list-item')
                ? $ele : $ele.closest('.sidebar-list-item');
            var id = $item.data('draftId');
            imweb.ajax.get('/draft/get/' + id).done(function(data) {
                if (data.ret === 0) {
                    var item = data.data;
                    mainAction.setContext({
                        draftId: item.id,
                        tab: item.tab,
                        title: item.title,
                        content: item.content
                    });
                    //sidebarAction.closeMask();
                }
            });
        },
        showDraftSavedHint: function() {
            var $hint = $('#autosave-hint');
            $hint.find('.time').html(moment().format('HH:mm'));
            $hint.css({
                display: 'block',
                opacity: 0
            }).animate(
                {
                    opacity: 1
                },
                300,
                function() {
                    setTimeout(function() {
                        $hint.animate(
                            {
                                opacity: 0
                            },
                            300,
                            function() {
                                $hint.css({
                                    display: 'none'
                                });
                            }
                        );
                    }, 2000);
                }
            );
            var $count = $('.draft-count');
            function beat(callback) {
                $count.animate({
                    opacity: 0.1
                }, 500, function() {
                    setTimeout(function() {
                        $count.animate({
                            opacity: 1
                        }, 500, function() {
                            setTimeout(function() {
                                callback && callback();
                            }, 200);
                        });
                    }, 200);
                });
            };
            beat(beat);
        },
        updateDraftCount: function(count) {
            function setCount() {
                var $count = $('.draft-count');
                $count.text(count);
                count ? $count.removeClass('hide') : $count.addClass('hide');
            }
            if (count === undefined) {
                imweb.ajax.get('/draft/countmy').done(function(data) {
                    if (data.ret === 0) {
                        count = data.count;
                        setCount();
                    }
                });
            } else {
                setCount();
            }
        }
    };

    $(document)
        .on('click','.delete-draft', _.bind(exports.deleteDraft, exports))
        .on('click', '.edit-topic', _.bind(exports.editTopic, exports))
        .on('click', '.edit-draft', _.bind(exports.editDraft, exports));

    mainAction.on('draftsaved', function(data) {
        exports.showDraftSavedHint();
        exports.updateDraftCount(data.draftCount);
    });
    exports.updateDraftCount();
});

// 图片上传
$(function() {
    var fileUploader = WebUploader.create({
        pick: '#file-picker',
        auto: true,
        server: '/upload?_csrf=' + imweb._csrf,
        fileVal: 'file',
        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });
    fileUploader.on('uploadSuccess', function(file, response) {
        editorAction.insertImg(response.url);
    });
    var coverUploader = WebUploader.create({
        pick: '#cover-picker',
        auto: true,
        multiple: false,
        server: '/upload?_csrf=' + imweb._csrf,
        fileVal: 'file',
        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });
    coverUploader.on('uploadSuccess', function(file, response) {
        $('#top .cover').css('background-image','url("'+response.url+'")');
    });
});
