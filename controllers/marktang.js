/*
 * marktang - controllers/marktang.js
 *
 * info: used for md.imweb.io
 * author: henry
 * date: 2015-1-22
 */

var _ = require('lodash');
var juice = require('juice');
var fs = require('fs');
var EventProxy = require('eventproxy');
var Evernote = require('evernote').Evernote; 
var extend = require('extend');
var User = require('../proxy').User;
var Ever = require('../proxy').Evernote;
var Marktang = require('../proxy').Marktang;
var Topic = require('../proxy').Topic;
var enmlOfHtml = require('../common/enmlOfHtml');
var dataAdapter = require('../common/dataAdapter');
var tools = require('../common/tools');

//global evernote client
var evernoteParam = {
    consumerKey: 'webryan',
    consumerSecret: '24fa5e95e99acd7e',
    sandbox: false,
    serviceHost  : 'app.yinxiang.com'
};

var evernoteMap = {
    "evernote": {
        token : 'evernoteAccessToken',
        host : 'www.evernote.com'
    },
    "yinxiang" : {
        token :'yinxiangAccessToken',
        host : 'app.yinxiang.com'
    }
}
/**
 *   if (this.sandbox) {
    var defaultServiceHost = 'sandbox.evernote.com';
  } else {
    var defaultServiceHost = 'www.evernote.com';
 }
 * */

//准备把md.imweb.io首页用这个函数包裹一下
function index(req, res, next){
    var user = req.session.user;
    var ep = new EventProxy();
    ep.fail(next);
    ep.on('fail', function() {
        ep.unbind();
        res.render('error', {msg: '出错啦'});
    });
    var topic_id = req.query.topic_id;
    if (topic_id) {
        Topic.getTopicById(topic_id, ep.done(function(topic) {
            if (!topic 
                || (!tools.idEqual(user._id, topic.author_id) && !user.is_admin)
            ) {
                return ep.emit('fail');
            }
            ep.emit('topic', topic);
        }));
    } else {
        ep.emitLater('topic', null);
    }
    
    // 获取草稿
    Marktang.getRecently(user._id, ep.done('marktang'));

    // User.getUserById(user._id, ep.done('user'));

    ep.all('topic', 'marktang',  function(topic, marktang) {
        res.render('marktang/index', _.extend({
            _layoutFile: false,
            // accessToken: user.accessToken,
            topic: topic ? dataAdapter.outTopic(topic, {content: true}) : null,
            title: '',
            _id: '',
            guid: '',
            html_encode: html_encode
        }, marktang || {}));
    });
}

function md2html(req, res, next){
    var content = req.body.html;
    if (!content){
        res.render('error', {msg: '没有可以转换的内容'});
        return;
    }

    var css = fs.readFileSync('public/marktang/css/combo.css');
    juice.juiceContent(content, {extraCss:css,url:'http://'}, function(err, html) {
        if (err){
            res.render('error', {msg: '渲染异常'});
            return;
        }
        res.render('marktang/show',{msg:html});

    });
}

/* *
 * 
 *  用于获取evernote授权页面
 *
 * */
function evernote(req, res, next){
    req.session.fromURL = req.query.url || req.session.fromURL || '/';

    //TODO: 验证过则直接调回url参数
    var type = req.session.evernoteType || req.query.type || 'yinxiang';
    if (!evernoteMap[type]){
        ret("",{msg:'evernote type is wrong'},res);
        return;
    }
    console.log('type:'+type);

    if (evernoteMap[type] && evernoteMap[type]['token'] && req.session.user[evernoteMap[type]['token']]){
        res.redirect(req.session.fromURL);
        req.session.fromURL = null;
        return;
    }

    var host = evernoteMap[type]['host'];
    evernoteParam.serviceHost = host;

    var evernoteClient = new Evernote.Client(evernoteParam);
    evernoteClient.getRequestToken('http://test.imweb.io/marktang/evernote_callback', function(error, oauthToken, oauthTokenSecret, results) {
        // store tokens in the session
        // and then redirect to client.getAuthorizeUrl(oauthToken)
        if (error){
            res.render('error', {msg: '获取evernote oauthToken异常...'});
            return;
        }

        var url = evernoteClient.getAuthorizeUrl(oauthToken);
        req.session.evernote_oauthToken = oauthToken;
        req.session.evernote_oauthTokenSecret = oauthTokenSecret;
        res.redirect(url);
    });
}

//保存accesstoken
function evernote_callback(req, res, next){

    var oauthToken = req.session.evernote_oauthToken;
    var oauthTokenSecret = req.session.evernote_oauthTokenSecret;
    var oauthVerifier = req.query.oauth_verifier;

    evernoteParam.serviceHost = req.session.user.evernoteHost || evernoteParam.serviceHost;
    var evernoteClient = new Evernote.Client(evernoteParam);

    evernoteClient.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        // store 'oauthAccessToken' somewhere
         if (error){
             console.log('callback_error');

            console.log(error);
            console.log(results);
            res.render('error', {msg: '获取evernote Token失败...'});
            return;
        }

        User.getUserById(req.session.user._id, function (err, user) {
            if (err) {
                console.log(err);
                res.render('error', {msg: 'User异常'});
                return next(err);
            }
            var type = req.session.evernoteType;
            var key = evernoteMap[type]['token'];
            user[key] = oauthAccessToken;
            user.evernoteType = req.session.evernoteType;
            user.save();
            req.session.user[key] = oauthAccessToken;
            evernote_getnote(req, res, next);
        });
    });
}

function evernote_save(req, res, next){
    //check token first
    var etype = req.query.type|| req.session.evernoteType|| 'yinxiang';
    console.log(req.session.user[evernoteMap[etype]['token']]);
    if (evernoteMap[etype] && evernoteMap[etype]['token'] && req.session.user[evernoteMap[etype]['token']]){
        req.session.evernoteType = etype;
        save(req, res, next);
    }else{
        req.session.evernoteType = etype;
        req.session.lastProcess = req.body;
        res.redirect(301,'/marktang/evernote?type='+etype);
    }
}

function ret(type, data, res){
    if (type==="json"){
        res.json(data);
    }else{
        res.render('error',data);
    }
}
/**
*  for ajax evernote saving
* */
function save(req, res, next){
    var note = {};
    note.title = req.body.title.trim() || 'Title from imweb.io';
    note.content = req.body.content || 'test';
    note.html = req.body.html || '<span>test</span>';
    note.id = req.body.id || '';
    note.guid = req.body.guid || '';
    note.author_id = req.session.user._id;

    var type = req.body.type || '' ;
    var etype = req.session.evernoteType || req.session.user.evernoteType;

    if (!evernoteMap[etype]){
        ret(type, {'ret':10000,'msg':'save error'},res);
        return
    }
    var token = req.session.user[evernoteMap[etype].token];
    var isEvernote = !!token;
    //save to marktang model
    Marktang.save(note,function(err, note){
        if (err){
            console.log(err);;
            ret(type, {'ret':10000,'msg':'save error'},res);
            return;
        }else{
            if (!token){
                ret(type,{'ret':0,'msg':'save success','id':note._id},res);
            }
        }
    });

    if (token){
        console.log('host:'+evernoteMap[etype].host);
        var client = new Evernote.Client({token: token, serviceHost:evernoteMap[etype].host});
        var noteStore = client.getNoteStore();
        //var _note = {};

        var _note = new Evernote.Note();
        _note.content = note.html;
        _note.title = note.title;

        //convert to inline html
        var css = fs.readFileSync('public/marktang/css/combo.css');
        juice.juiceContent('<div id="out">'+_note.content+'</div>', {extraCss:css,url:'http://'}, function(err, html) {
            if (err){
                ret(type,{'ret':10001,'msg':'渲染异常'},res);
                return;
            }
            enmlOfHtml.ENMLOfHTML(html,function(err,ENML){
                if (err){
                    ret(type,{'ret':10001,'msg':'渲染异常'},res);
                    return;
                }
                _note.content = ENML;

                //TODO: new or update
                if (note.guid){
                    //update
                    _note.guid = note.guid;
                    console.log(_note);
                    noteStore.updateNote(_note,function(err, retNote){
                         if (err){
                            console.log(err);
                            ret(type,{'ret':10004,'msg':'evernote:updateNote error'},res);
                            return;
                        }

                        ret(type,{'ret':0,'msg':'save all ok'},res);

                    });
                }else{
                    //new
                    noteStore.createNote(_note, function(err, createdNote) {
                        if (err){
                            console.log(err);
                            ret(type,{'ret':10004,'msg':'evernote:createNote error'},res);
                            return;
                        }
                        //save guid
                        note.guid = createdNote.guid;
                        Marktang.save(note,function(err){
                            if (err){
                                console.log(err);;
                                ret(type,{'ret':10002,'msg':'save error'},res);
                                return;
                            }
                            ret(type,{'ret':0,'msg':'保存成功：'+createdNote.guid, 'guid':createdNote.guid, },res);
                        });
                    });

                }
           });

        });
    }

    return;

    //save remote 
    if (note.guid){
        _note = noteStore.getNote(note.guid);
        console.log(_note);
        extend(_note,note);
        noteStore.updateNote(note);
        console.log('updateNote ok');
        Marktang.save(note,function(err){
            if (err){
                res.render('error',{'msg':'save error'});
            }

            res.render('error',{'msg':'save ok'});
        });

    }else{
        _note = new Evernote.Note();
        extend(_note,note);
        noteStore.createNote(note, function(err, createdNote) {
            if (err){
                console.log(err);
                return;
            }
            console.log("Successfully created a new note with GUID: " + createdNote.guid);
            note.guid = createdNote.guid;
            Marktang.save(note,function(err){
                if (err){
                    res.render('error',{'msg':'save error'});
                }

                res.render('error',{'msg':'save ok'});
            });

        });
    }
}


function evernote_getnote(req, res, next){
    var etype = req.session.user.evernoteType;
    if (!etype){
        console.log('evernote 类型错误');
        return ;
    }
    var token = req.session.user[evernoteMap[etype].token];
    var host = evernoteMap[etype].host;

    if (!token){
        console.log('no evernote token');
        return false;
    }

    console.log('token:'+token+'|'+host);

    var client = new Evernote.Client({token: token, serviceHost: host});
    var noteStore = client.getNoteStore();
    // List all of the notebooks in the user's account
    noteStore.listNotebooks(function(err, notebooks) {
        if (err) {
            console.log(err);
            res.render('error', {msg: '获取notebooks异常'});
            return next(err);
        }

        console.log(notebooks);
        var notes = [];
        for (var i in notebooks) {
            notes.push({guid : notebooks[i].guid, name: notebooks[i].name});
        }

        //update mongodb
        Ever.save(req.session.user._id, notes, function (err) {
            if (err) {
                console.log(err);
                res.render('error', {msg: '存储异常'});
                return next(err);
            }

            if (req.session.lastProcess){
                req.body = req.session.lastProcess;
                req.session.lastProcess = null;
                evernote_save(req, res, next);
            }else{
                res.render('error', {msg: 'evernote 笔记本已经更新'});
            }
        });
    });
}
function html_encode(str){   
    var s = "";   
    if (str.length == 0) return "";   
    s = str.replace(/&/g, "&gt;");   
    s = s.replace(/</g, "&lt;");   
    s = s.replace(/>/g, "&gt;");   
    s = s.replace(/\s/g, "&nbsp;");   
    s = s.replace(/\'/g, "&#39;");   
    s = s.replace(/\"/g, "&quot;");   
    s = s.replace(/\n/g, "<br>");   
    return s;   
}
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
module.exports = {
    index : index,
    md2html :md2html,
    evernote :evernote,
    evernote_callback :evernote_callback,
    evernote_save :evernote_save,
    evernote_getnote :evernote_getnote,
    save : save,

    test: function(){}
};
