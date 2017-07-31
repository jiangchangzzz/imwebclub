var config = require('../config');
var request = require('request');
var EventProxy = require('eventproxy');
var wechatCenter = require('./wechatCenter');
var User = require('../proxy').User;

exports.bind = function(req, res, next) {
    var code = req.query.code;
    var userId = req.query.state;

    wechatCenter.getUserToken({
        code: code
    }, function(err, result) {
        if (!err && result) {
            var wechatId = result.openid;
            var datas = {
                wechatId : wechatId,
                userId : userId
            };
            User.bindWechatById(datas, function(){
                res.redirect("weixin://profile/gh_19e0a9ccfa31");
            });

        } else {
            console.log(err);
        }
    });
};
