var mailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var util = require('util');
var _ = require('lodash');
var async = require('async');
var config = require('../config');
var transport = mailer.createTransport(smtpTransport(config.mail_opts));
// var transport = mailer.createTransport('SMTP', config.mail_opts);
var SITE_ROOT_URL = 'http://' + config.host;
var MAIL_FOOT = '<p>' + config.name + '社区 谨上。</p>';
var MAIL_FROM = util.format('%s <%s>', config.name, config.mail_opts.auth.user);

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
var sendMail = function(data, callback) {
    // 遍历邮件数组，发送每一封邮件，如果有发送失败的，就再压入数组，同时触发mailEvent事件
    transport.sendMail(data, function(err) {
        if (err) {
            // 写为日志
            console.log(err);
        }
        if (callback) {
            callback();
        }
    });
};
exports.sendMail = sendMail;

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = function (who, token, name) {

  var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + '社区帐号激活';
  var html = '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '社区的注册信息，请点击下面的链接来激活帐户：</p>' +
    '<a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '">激活链接</a>' +
    '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
    '<p>' + config.name + '社区 谨上。</p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendResetPassMail = function (who, token, name) {
  var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + '社区密码重置';
  var html = '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '社区重置密码的请求，请在24小时内单击下面的链接来重置密码：</p>' +
    '<a href="' + SITE_ROOT_URL + '/reset_pass?key=' + token + '&name=' + name + '">重置密码链接</a>' +
    '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
    '<p>' + config.name + '社区 谨上。</p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  });
};

/**
 * 发送邀请邮件
 * @param {String} who 被邀请者邮箱
 * @param {String} token 重置token
 * @param {String} senderName 发出邀请者名字
 * @param {String} phrase 邀请语
 */
exports.sendInviteMail = function(who, token, senderName, phrase) {
    var from = util.format('%s <%s>', config.name, config.mail_opts.auth.user);
    var to = who;
    var subject = senderName + '邀请您加入' + config.name + '社区';
    var html = ['<p>您好：</p>',
        '<p>' + senderName + '邀请您加入' + config.name + '社区，请点击以下链接完善信息加入社区：</p>',
        '<p>' + phrase + '</p>', 
        '<a href="' + SITE_ROOT_URL + '/invite/accept?key=' + token + '">加入社区链接</a>',
        '<p>' + config.name + '社区 谨上。</p>'
    ].join('');

    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送一级回复给文章作者
 */
exports.sendReplyMail = function(topic, topicAuthor, reply, replyAuthor) {
    var to = topicAuthor.email;
    var data = {
        authorName: topicAuthor.name || topicAuthor.loginname,
        topicId: topic._id,
        topicTitle: topic.title,
        replyAuthorName: replyAuthor.name || replyAuthor.loginname,
        replyContent: reply.content,
        siteUrl: SITE_ROOT_URL
    };
    var subjectTpl = '<%=replyAuthorName%>回复了您的文章<%=topicTitle%>';
    var subject = _.template(subjectTpl)(data);
    var htmlTpl = [
        '<p><%=authorName%> 您好:</p>',
        '<p><%=replyAuthorName%>回复了您的文章',
            '<a href="<%=siteUrl%>/topic/<%=topicId%>"><%=topicTitle%></a>',
        '</p>',
        '<p><%=replyContent%></p>',
        MAIL_FOOT
    ].join('');
    var html = _.template(htmlTpl)(data);

    exports.sendMail({
        from: MAIL_FROM,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送二级回复给文章作者
 */
exports.sendSubReplyMail = function(
    topic, topicAuthor, pReply, pAuthor, reply, replyAuthor
) {
    var to = topicAuthor.email;
    var data = {
        authorName: topicAuthor.name || topicAuthor.loginname,
        topicId: topic._id,
        topicTitle: topic.title,
        replyAuthorName: replyAuthor.name || replyAuthor.loginname,
        replyContent: reply.content,
        siteUrl: SITE_ROOT_URL
    };
    var subjectTpl = '<%=replyAuthorName%>回复了您的文章<%=topicTitle%>';
    var subject = _.template(subjectTpl)(data);
    var htmlTpl = [
        '<p><%=authorName%> 您好:</p>',
        '<p><%=replyAuthorName%>回复了您的文章',
            '<a href="<%=siteUrl%>/topic/<%=topicId%>"><%=topicTitle%></a>',
        '</p>',
        '<p><%=replyContent%></p>',
        MAIL_FOOT
    ].join('');
    var html = _.template(htmlTpl)(data);

    exports.sendMail({
        from: MAIL_FROM,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送二级回复给一级回复者
 */
exports.sendSubReplyForParentReplyMail = function(
    topic, topicAuthor, pReply, pAuthor, reply, replyAuthor
) {
    var to = pAuthor.email;
    var data = {
        pAuthorName: pAuthor.name || pAuthor.loginname,
        topicId: topic._id,
        topicTitle: topic.title,
        replyAuthorName: replyAuthor.name || replyAuthor.loginname,
        replyContent: reply.content,
        siteUrl: SITE_ROOT_URL
    };
    var subjectTpl = '<%=replyAuthorName%>在文章<%=topicTitle%>中回复了您';
    var subject = _.template(subjectTpl)(data);
    var htmlTpl = [
        '<p><%=pAuthorName%> 您好:</p>',
        '<p>',
            '<%=replyAuthorName%>在文章',
            '<a href="<%=siteUrl%>/topic/<%=topicId%>"><%=topicTitle%></a>',
            '中回复了您',
        '</p>',
        '<p><%=replyContent%></p>',
        MAIL_FOOT
    ].join('');
    var html = _.template(htmlTpl)(data);

    exports.sendMail({
        from: MAIL_FROM,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 用户发布了新文章，邮件通知同一team的小伙伴
 */
exports.sendNewTopicToTeamMembers = function (data) {
    var users = [];
    _.each(data.members, function(item) {
        if (item._id !==  data.user._id && item.email) {
            users.push(item);
        }
    });
    var subjectTpl = '<%= user.name || user.loginname %>' 
        + '发布了新文章<%=topic.title%>';
    var htmlTpl = [
        '<p><%= me.name || me.loginname %> 您好:</p>',
        '<p>',
            '<%= user.name || user.loginname %> 发布了新文章：',
            '<a href="<%=siteUrl%>/topic/<%=topic._id%>"><%=topic.title%></a>',
        '</p>',
        '<p>快去围观吧~~</p>',
        MAIL_FOOT
    ].join('');

    async.eachLimit(users, 20, function(user, callback) {
        var tplData = _.extend({}, data || {}, {
            siteUrl: SITE_ROOT_URL,
            me: user
        });
        var subject = _.template(subjectTpl)(tplData);
        var html = _.template(htmlTpl)(tplData);
        exports.sendMail({
            from: MAIL_FROM,
            to: user.email,
            subject: subject,
            html: html
        }, callback);
    });
};

/**
 * 每日推送
 */
exports.sendDailyPush = function (data) {
    data = _.extend({}, data || {}, {
        siteUrl: SITE_ROOT_URL
    });
    var to = data.user.email;
    var subjectTpl = 'imweb每日精化';
    var subject = _.template(subjectTpl)(data);
    var htmlTpl = [
        '<p>imweb团队新文章TOP</p>',
        '<% for(var i in teamTopic) { var topic = teamTopic[i]; %>',
        '<p>',
            '<a href="<%=siteUrl%>/topic/<%=topic._id%>"><%=topic.title%></a>',
        '</p>',
        '<% } %>',
        MAIL_FOOT
    ].join('');
    var html = _.template(htmlTpl)(data);

    exports.sendMail({
        from: MAIL_FROM,
        to: to,
        subject: subject,
        html: html
    });
};
