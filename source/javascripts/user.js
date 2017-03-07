$(function() {
    var $userDetail = $('#content.user-detail');
    var userDetailAction = {
        loginname: null,
        activityNextBeforeTime: -1,
        activityLimit: 5,
        initActivityList: function(data) {
            if (!data.list.length) {
                var panel = $userDetail.find('.activity-panel');
                panel.find('.panel-empty').removeClass('hide');
                panel.find('.activity-more-container').addClass('hide');
            } else {
                this.activityListAppend(data.list);
                this.setActivityListLoadMoreBtn(data.hasMore);
                this.activityNextBeforeTime = data.nextBeforeTime;
            }
        },
        activityListAppend: function(items) {
            var html = $.map(items, function(item) {
                return imweb.template('user-activity-item', item);
            });
            $userDetail.find('.activity-list').append(html);
        },
        setActivityListLoadMoreBtn: function(hasMore) {
            var $btn = $userDetail.find('.more-activity-btn');
            if (hasMore) {
                $btn.removeClass('ui-disabled').html('加载更多');
            } else {
                $btn.addClass('ui-disabled').html('已加载全部');
            }
        },
        loadMoreActivity: function() {
            var me = this;
            var loginname = this.loginname;
            var beforeTime = this.activityNextBeforeTime;
            var limit = this.activityLimit;
            if (beforeTime <= 0) {
                return;
            }
            imweb.ajax.get('/user/' + loginname + '/activity', {
                data: {
                    beforeTime: beforeTime,
                    limit: limit
                }
            }).done(function(data) {
                if (data.ret === 0) {
                    data = data.data;
                    me.activityListAppend(data.list);
                    me.setActivityListLoadMoreBtn(data.hasMore);
                    me.activityNextBeforeTime = data.nextBeforeTime;
                }
            });
        }
    };
    var me = userDetailAction;
    me.loginname = imweb.viewUser.loginname;
    me.initActivityList(imweb.viewUser.activities);
    $userDetail.find('.more-activity-btn')
        .click(_.bind(me.loadMoreActivity, me));
});
