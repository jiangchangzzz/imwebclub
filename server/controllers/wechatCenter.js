var url = require('url');
var crypto = require('crypto');
var config = require('../config');
var wechat = require('wechat');
var WechatAPI = require('wechat-api');
var request = require('request');
var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var Topic = require('../proxy').Topic;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
var renderHelper = require('../common/render_helper');
var cache = require('../common/cache');
var sha1=require('sha1');

var wechatValidate = config.wechat_validate;
var api = new WechatAPI(wechatValidate.appid, wechatValidate.appsecret);

exports.all = function(req, res, next) {
    // 微信输入信息都在req.weixin上
    var message = req.weixin;
    var ep = new EventProxy();
    var recommendNum = 30;
    var pushOpt = {
        num: 1,
        defaultPicurl: 'http://imweb.io/public/images/sign-banner.png',
        scene: 'massSend',
        sort: '-top -last_reply_at'
    };

    var customOpt = {
        num: 1,
        scene: 'custom',
        sort: '-create_at'
    };

    //回复消息
    // if (message.MsgType === 'text' && message.Content === 'massSend') {
    //     res.reply('massSend');

    //     var mediaDownloadArr = [];
    //     var mediaUploadArr = [];
    //     for (var n = 0; n < pushOpt.num; n++) {
    //         mediaDownloadArr.push('mediaDownload' + n);
    //         mediaUploadArr.push('mediaUpload' + n);
    //     }

    //     getArticle(pushOpt, function(result) {
    //         result.forEach(function(item, i) {
    //             var picurl = item.thumb_media_id;
    //             var tempPath = './public/images/wechatTemp' + i + '.png';
    //             request(picurl, function(error, response, body) {
    //                 if (!error) {
    //                     item.thumb_media_id = tempPath;
    //                     ep.emit('mediaDownload' + i, item);
    //                 } else {
    //                     console.log(error);
    //                 }
    //             }).pipe(fs.createWriteStream(tempPath));
    //         });

    //         ep.all(mediaDownloadArr, function(item0, item1, item2) {
    //             var topicList = [item0, item1, item2].slice(0, pushOpt.num);
    //             topicList.forEach(function(item, i) {
    //                 mediaUpload({
    //                     filepath: item.thumb_media_id,
    //                     type: 'image'
    //                 }, function(err, result) {
    //                     if (!err) {
    //                         item.thumb_media_id = result.media_id;
    //                         ep.emit('mediaUpload' + i, item);
    //                     } else {
    //                         console.log(err);
    //                     }
    //                 });
    //             });
    //         });
    //     });

    //     ep.all(mediaUploadArr, function(image0, image1, image2) {
    //         var news = [image0, image1, image2].slice(0, pushOpt.num);
    //         upload_news({
    //             "articles": news
    //         }, function(err, result) {
    //             if (!err) {
    //                 sendAllNews(result, function(err, result) {
    //                     if (!err) {

    //                     } else {
    //                         console.log(err);
    //                     }
    //                 });
    //             } else {
    //                 console.log(err);
    //             }
    //         });
    //     });

    // //预览
    // } else if (message.MsgType === 'text' && message.Content === 'preview') {
    //     res.reply('preview:' + reqPath);

    //     var mediaDownloadArr1 = [];
    //     var mediaUploadArr1 = [];
    //     for (var n1 = 0; n1 < pushOpt.num; n1++) {
    //         mediaDownloadArr1.push('mediaDownload' + n1);
    //         mediaUploadArr1.push('mediaUpload' + n1);
    //     }

    //     getArticle(pushOpt, function(result) {
    //         result.forEach(function(item, i) {
    //             var picurl = item.thumb_media_id;
    //             var tempPath = './public/images/wechatTemp' + i + '.png';
    //             request(picurl, function(error, response, body) {
    //                 if (!error) {
    //                     item.thumb_media_id = tempPath;
    //                     ep.emit('mediaDownload' + i, item);
    //                 } else {
    //                     console.log(error);
    //                 }
    //             }).pipe(fs.createWriteStream(tempPath));
    //         });

    //         //所有图片都下载完成
    //         ep.all(mediaDownloadArr1, function(item0, item1, item2) {
    //             var topicList = [item0, item1, item2].slice(0, pushOpt.num);
    //             topicList.forEach(function(item, i) {
    //                 mediaUpload({
    //                     filepath: item.thumb_media_id,
    //                     type: 'image'
    //                 }, function(err, result) {
    //                     if (!err) {
    //                         item.thumb_media_id = result.media_id;
    //                         ep.emit('mediaUpload' + i, item);
    //                     } else {
    //                         console.log(err);
    //                     }
    //                 });
    //             });
    //         });
    //     });

    //     //所有媒体上传完成
    //     ep.all(mediaUploadArr1, function(image0, image1, image2) {
    //         var news = [image0, image1, image2].slice(0, pushOpt.num);
    //         upload_news({
    //             "articles": news
    //         }, function(err, result) {
    //             if (!err) {
    //                 result.openId = message.FromUserName;
    //                 massPreview(result, function(err, result) {
    //                     if (!err) {

    //                     } else {
    //                         console.log(err);
    //                     }
    //                 });
    //             } else {
    //                 console.log(err);
    //             }
    //         });
    //     });

    //创建菜单
    if (message.MsgType === 'text' && message.Content === 'createMenu') {
        res.reply('createMenu');
        var menu = {
            "button": [{
                "name": "IMWEB",
                "sub_button": [{
                    "type": "view",
                    "name": "IMWEB社区",
                    "url": "http://imweb.io/"
                }, {
                    "type": "view",
                    "name": "Lego",
                    "url": "http://lego.imweb.io/"
                }, {
                    "type": "view",
                    "name": "GitHub",
                    "url": "https://github.com/imweb/"
                }]
            }, {
                "type": "view",
                "name": "招聘",
                "url": "http://www.lagou.com/jobs/3252673.html"
            }, {
                "type": "view",
                "name": "关于我们",
                "url": "http://imweb.github.io/"
            }]
        };
        api.createMenu(menu, function(err, result) {
            if (!err) {

            } else {
                console.log(err);
            }
        });

    //用户
    // } else if (message.MsgType === 'text' && message.Content === 'custom') {
    //     res.reply('custom');
    //     customOpt.num = parseInt(Math.random() * recommendNum);
    //     getArticle(customOpt, function(result) {
    //         ["oWBY7wPLFxVPIwXApCrIFXTRk2GM", "oWBY7wLUXRX_OJtT0sjFN_01L7Iw"].forEach(function(id) {
    //             var opt = {
    //                 openId: id,
    //                 articles: result
    //             };

    //             customSend(opt, function(err, result) {
    //                 if (!err) {

    //                 } else {
    //                     console.log(err);
    //                 }
    //             });
    //         });
    //     });
        
    //订阅事件
    // } else if ((message.MsgType == 'event') && (message.Event == 'subscribe')) {
    //     //新用户关注
    //     res.reply([{
    //         title: 'welcome to imweb!',
    //         description: 'imweb前端团队，前端可以更有意思，点击前往团队社区imweb.io。',
    //         picurl: 'http://imweb.io/public/images/logo-cover.png',
    //         url: 'http://imweb.io/'
    //     }]);
    } else {
        //默认回复
        // customOpt.num = parseInt(Math.random() * recommendNum);
        // getArticle(customOpt, function(result) {
        //     res.reply(result);
        // });
        res.reply('');
    }
};

exports.handle=function(req,res,next){
    var input={
        timestamp: req.query.timestamp,
        nonce: req.query.nonce,
        token: config.wechat_test.token
    };
    var keys=Object.keys(input);
    keys.sort();
    var sign='';
    keys.forEach(function(key){
        sign+=input[key];
    });
    sign=sha1(sign);

    if(sign===req.query.signature){
        res.send(req.query.echostr);
    }
    else{
        next();
    }
}

//取出社区文章
function getArticle(options, callback) {
    var ep = new EventProxy();
    var opt = {
        limit: options.num,
        sort: options.sort
    };
    Topic.getTopicsByQuery({}, opt, function(err, topics) {
        if (err) {
            return;
        }
        var topicList = [];

        //信息推送
        if (options.scene == 'massSend') {
            var count = 0;
            topics.forEach(function(topic, k) {
                var coverUrl = tools.genTopicPic(topic.content);
                var content = codeStyleAdd(renderHelper.markdown(topic.content));
                var count0 = 0,
                    count1 = 0;
                var transferUrl = [],
                    wechatUrl = [];
                
                //图片上传
                ep.all('imageUpload' + k, function(wechatUrl) {
                    var $ = cheerio.load(content);
                    var $img = $("img");
                    for (var j = 0, len = $img.length; j < len; j++) {
                        $("img").eq(j).attr('src', wechatUrl[j] || '');
                    }

                    var wechatTopic = {
                        "thumb_media_id": coverUrl[0] || options.defaultPicurl,
                        "author": topic.author.loginname,
                        "title": renderHelper.html_decode(topic.title),
                        "content_source_url": config.rss.link + '/topic/' + topic._id,
                        "content": $.html(),
                        "digest": '作者：' + topic.author.loginname + ' | 简介：' +  $('p').eq(0).text().substring(0, 50),
                        "show_cover_pic": "0"
                    };

                    //有封面则放在首页
                    if (coverUrl.length > 0) {
                        topicList.unshift(wechatTopic);
                    } else {
                        topicList.push(wechatTopic);
                    }

                    count++;
                    if (count === topics.length) {
                        // ep.emit('contentReady', topicList);
                        cache.set('topicList', topicList, 1000 * 60 * 5);
                        callback(topicList);
                    }
                });

                if (coverUrl.length > 0) {
                    coverUrl.forEach(function(item, i) {
                        var innerUrlPath = './public/images/wechatTemp' + k + i + '.png';
                        request(item, function(error, response, body) {
                            if (!error) {
                                transferUrl[i] = innerUrlPath;

                            } else {
                                console.log(error);
                                transferUrl[i] = '';
                            }

                            count0++;
                            if (count0 === coverUrl.length) {
                                ep.emit('imageDownload' + k, transferUrl);
                            }
                        }).pipe(fs.createWriteStream(innerUrlPath));
                    });

                    //图片下载
                    ep.all('imageDownload' + k, function(transferUrl) {
                        transferUrl.forEach(function(item, i) {
                            uploadImage({
                                filepath: item
                            }, function(err, result) {
                                if (!err) {
                                    wechatUrl[i] = result.url;
                                } else {
                                    wechatUrl[i] = '';
                                }
                                count1++;
                                if (count1 === coverUrl.length) {
                                    ep.emit('imageUpload' + k, wechatUrl);
                                }
                            });
                        });
                    });
                } else {
                    ep.emit('imageUpload' + k, wechatUrl);
                }
            });
        } else {
            var topic = topics[topics.length - 1];
            var coverUrl = tools.genTopicPic(topic.content);
            topicList.push({
                "description": '作者:' + topic.author.loginname,
                "title": renderHelper.html_decode(topic.title),
                "url": config.rss.link + '/topic/' + topic._id,
                "picurl": coverUrl[0]
            });

            cache.set('topicList', topicList, 1000 * 60 * 5);
            callback(topicList);
        }
    });
}

function codeStyleAdd(content) {
    var $ = cheerio.load(content);
    var cssMap = {
        'blockquote': 'padding: 15px 20px;margin-top: 10px;border-left: 5px solid #657b83;background: #f6f6f6;',
        '.hljs': 'display:block; overflow-x:auto;font-size:12px;-webkit-text-size-adjust:none;font-family:Source Code Pro,Consolas,Monaco,Menlo,Consolas,monospace;color:#f8f8f2;',
        'pre': 'margin:0;padding:0;border:0;vertical-align:baseline;background: #272822;color: #fff;line-height: 22px;margin: 10px 0;overflow: auto;padding: 15px 20px;border-radius: 6px;font-size: 14px;',
        'p': 'margin-bottom: 10px;',
        '.hljs-function': 'color:#f92672;',
        '.hljs-pragma': 'color:#f8f8f2;',
        '.hljs-tag': 'color:#a6e22e;',
        '.hljs-strong': 'color:#a8a8a2;font-weight:700;',
        '.hljs-strongemphasis': 'color:#a8a8a2;font-weight:700;font-style:italic;',
        '.hljs-keyword': 'color:#f92672;',
        '.hljs-blockquote': 'color:#ae81ff;',
        '.hljs-bullet': 'color:#ae81ff;',
        '.hljs-hexcolor': 'color:#ae81ff;',
        '.hljs-horizontal_rule': 'color:#ae81ff;',
        '.hljs-literal': 'color:#ae81ff;',
        '.hljs-number': 'color:#ae81ff;',
        '.hljs-regexp': 'color:#ae81ff;',
        '.hljs-class': 'color:#a6e22e;font-style:italic;',
        '.hljs-class .hljs-title:last-child': 'color:#a6e22e;font-style:italic;',
        '.hljs-code': 'color:#a6e22e;',
        '.hljs-value': 'color:#f92672;',
        '.hljs-title': 'color:#a6e22e;',
        '.hljs-link_url': 'font-size:80%;color:#e6db74;',
        '.hljs-addition': 'color:#e6db74;',
        '.hljs-attr_selector': 'color:#e6db74;',
        '.hljs-built_in': 'color:#e6db74;',
        '.hljs-envvar': 'color:#e6db74;',
        '.hljs-link_label': 'color:#e6db74;',
        '.hljs-prompt': 'color:#e6db74;',
        '.hljs-pseudo': 'color:#e6db74;',
        '.hljs-string': 'color:#e6db74;',
        '.hljs-subst': 'color:#e6db74;',
        '.hljs-type': 'color:#e6db74;',
        '.hljs-stream': 'color:#e6db74;',
        '.hljs-attribute': 'color:#f92672;',
        '.hljs-change': 'color:#f92672;',
        '.hljs-emphasis': 'font-style:italic;',
        '.hljs-typename': 'font-style:italic;color:#66d9ef;',
        '.alias': 'color:#f92672;',
        '.hljs-keyword:first-child': 'color:#f92672;',
        '.hljs-flow': 'color:#f92672;',
        '.hljs-header': 'color:#f92672;',
        '.hljs-symbol': 'color:#f92672;',
        '.hljs-symbol .hljs-string': 'color:#f92672;',
        '.hljs-tag .hljs-title': 'color:#f92672;',
        '.hljs-winutils': 'color:#f92672;',
        '.hljs-aspect': 'color:#66d9ef;',
        '.hljs-aspect .hljs-keyword:first-child': 'color:#66d9ef;',
        '.hljs-class .hljs-keyword:first-child': 'color:#66d9ef;',
        '.hljs-constant': 'color:#66d9ef;',
        '.hljs-function .hljs-keyword': 'color:#66d9ef;',
        '.hljs-aspect .hljs-title': 'color:#f8f8f2;',
        '.hljs-class .hljs-title': 'color:#f8f8f2;',
        '.hljs-params': 'color:#f8f8f2;',
        '.hljs-variable': 'color:#f8f8f2;',
        '.hljs-annotation': 'color:#75715e;',
        '.hljs-comment': 'color:#75715e;',
        '.hljs-decorator': 'color:#75715e;',
        '.hljs-deletion': 'color:#75715e;',
        '.hljs-doctype': 'color:#75715e;',
        '.hljs-shebang': 'color:#75715e;',
        'a': 'color:#333;text-decoration:none;',
        'h1': 'font-size:1.5em;margin: 10px 0;color: #FF0000;',
        'h2': 'font-size:1.4em;margin: 10px 0;color: #FF0000;',
        'h3': 'font-size:1.3em;margin: 10px 0;color: #0020FF;',
        'h4': 'font-size:1.2em;margin: 10px 0;color: #1D7B37;',
        'h5': 'font-size:1.1em;margin: 10px 0;',
        '.hide': 'display:none!important;',
        '.fl': 'float:left;',
        '.fr': 'float:right;',
        '.pull-right': 'float:right;',
        '.css .hljs-id': 'color:#e6db74;',
        '.css .hljs-function .hljs-preprocessor': 'color:#f8f8f2;',
        '.css .hljs-value': 'color:#f8f8f2;',
        '.css .hljs-rules': 'color:#f8f8f2;',
        '.css .hljs-important': 'color:#f92672;',
        '.css .hljs-tag': 'color:#f92672;',
        '.css .unit': 'color:#f92672;',
        '.css .hljs-attribute': 'color:#66d9ef;',
        '.apache .hljs-cbracket': 'color:#e6db74;',
        '.apache .hljs-tag': 'color:#e6db74;',
        '.apache .hljs-sqbracket': 'color:#75715e;',
        '.django .hljs-filter .hljs-argument': 'color:#e6db74;',
        '.django .hljs-template_tag': 'color:#e6db74;',
        '.django .hljs-variable': 'color:#e6db74;',
        '.smalltalk .hljs-array': 'color:#e6db74;',
        '.smalltalk .hljs-class': 'color:#e6db74;',
        '.smalltalk .hljs-localvars': 'color:#e6db74;',
        '.nginx .hljs-title': 'color:#f92672;',
        '.ruby .hljs-class .hljs-parent': 'color:#e6db74;',
        '.ruby .hljs-class .hljs-keyword:first-child': 'color:#f92672;',
        '.tex .hljs-command': 'color:#e6db74;',
        '.tex .hljs-formula': 'color:#75715e;',
        '.tex .hljs-special': 'color:#f92672;',
        'ul': 'padding: 15px 20px;margin-top: 10px;background: #f6f6f6;'
    };

    for (var name in cssMap) {
        for (var i = 0, length = $(name).length; i < length; i++) {
            var style = $(name).eq(i).attr('style') || '';
            $(name).eq(i).attr('style', style + cssMap[name]);
        }
    }

    return $.html();
}

function mediaUpload(options, callback) {
    api.uploadMedia(options.filepath, options.type, callback);
}

function upload_news(options, callback) {
    api.uploadNews(options, callback);
}

function sendAllNews(options, callback) {
    api.massSendNews(options.media_id, true, callback);
}

function massPreview(options, callback) {
    api.previewNews(options.openId, options.media_id, callback);
}

function sendAllText(options, callback) {
    api.massSendText(options, true, callback);
}

function customSend(options, callback) {
    api.sendNews(options.openId, options.articles, callback);
}

function uploadImage(options, callback) {
    api.uploadImage(options.filepath, function(err, result) {
        callback(err, result);
    });
}

function getUserToken(options, callback) {
    request({
            uri: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            method: 'GET',
            followRedirect: false,
            json: true,
            qs: {
                appid: wechatValidate.appid,
                secret: wechatValidate.encodingAESKey,
                code: options.code,
                grant_type: 'authorization_code'
            }
        },
        function(error, res, data) {
            if (data && !error) {
                callback(null, data);
            } else {
                callback(error, null);
            }
        }
    );
}

function remindSend(options, callback) {
    // var templateId = 'UZG5ge7tdoZJrEi1kHiCkQ__ok27PX1HU_44Jji5iQ8';
    var templateId = options.templateId || 'C90SsdMMbPLp_lewn62WeOT_hO2FDzJG_NxaCeQM75w';
    var topcolor = '#FF0000';
    var url = options.topicLink;
    var wording = "您好，您的文章" + renderHelper.html_decode(options.title) + "收到来自" + options.commentUser + "的新评论:" + options.content;
    if (options.type == 'pReply') {
        wording = "您好，您在文章" + renderHelper.html_decode(options.title) + "中的评论收到来自" + options.commentUser + "的新回复:" + options.content;
    }

    var currentTime = new Date();
    currentTime = currentTime.getFullYear() + '年' + currentTime.getMonth() + '月' + currentTime.getDate() + '日 ' + currentTime.getHours() + ':' + currentTime.getMinutes() + ':' + currentTime.getSeconds();

    var data = options.data || {
        "first": {
            "value": wording,
            "color": "#173177"
        },
        "keynote1": {
            "value": options.commentUser,
            "color": "#173177"
        },
        "keynote2": {
            "value": currentTime,
            "color": "#173177"
        },
        "remark": {
            "value": "点击立刻查看评论。",
            "color": "#173177"
        }
    };

    api.sendTemplate(options.wechatId, templateId, url, topcolor, data, function(err, result) {
        if (!err) {
            callback && callback(result);
        } else {
            console.log(err);
        }
    });
}

exports.remindSend = remindSend;
exports.getUserToken = getUserToken;
