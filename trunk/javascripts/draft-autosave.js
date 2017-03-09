import '../libs/EventEmitter.min.js';
(function() {
    imweb.DraftAutoSave = Class(EventEmitter, {
        /**
         * 自动保存草稿
         * @construtor
         * @param {Object} options 
         */
        constructor: function (options) {
            var DEFAULT_INTERVAL = 1000 * 60 * 0.05;
            this.options = options;
            this.draftId = options.draftId || null;
            this.topicId = options.topicId || null;
            this.input = this.options.input();
            this._intervalId = setInterval(
                _.bind(this.autosave, this),
                options.interval || DEFAULT_INTERVAL
            );
        },
        autosave: function() {
            var me = this;
            var input = me.options.input();
            if (!input) {
                return;
            }
            if (me.input.tab === input.tab 
                && me.input.title === input.title 
                && me.input.content === input.content
            ) {
                return;
            }
            // 新文章输入一定数目之后才开始保存
            if (!me.draftId && me.input.content.length < 30) {
                return;
            }
            me.save();
        },
        save: function() {
            var me = this;
            var input = me.options.input();
            if (!input) {
                return;
            }
            imweb.ajax.post('/draft/autosave', {
                data: _.extend({
                    draft_id: me.draftId,
                    topic_id: me.topicId,
                }, input)
            }).done(function(data) {
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
        showHint: function() {
            var $hint = $('#draft-autosave-hint');
            if (!$hint.length) {
                $hint = $('<div id="draft-autosave-hint"></div>')
                    .appendTo(document.body);
            }
            $hint.css({
                display: 'block',
                opacity: 0
            }).animate(
                {
                    opacity: 0.7
                }, 
                500, 
                function() {
                    setTimeout(function() {
                        $hint.animate(
                            {
                                opacity: 0
                            }, 
                            500, 
                            function() {
                                $hint.css({
                                    display: 'none'
                                });
                            }
                        );
                    }, 1200);
                }
            );
        },
        dispose: function() {
            this.removeEvent();
            if (this._intervalId) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }
        }
    });
})();
