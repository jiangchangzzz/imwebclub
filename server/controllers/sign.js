var validator      = require('validator');
var eventproxy     = require('eventproxy');
var config         = require('../config');
var User           = require('../proxy').User;
var mail           = require('../common/mail');
var tools          = require('../common/tools');
var utility        = require('utility');
var authMiddleWare = require('../middlewares/auth');
var uuid           = require('uuid');

//sign up
exports.showSignup = function (req, res) {
  res.render('sign/signup');
};

exports.signup = function(req, res, next) {
    var name = validator.trim(req.body.name || req.body.loginname);
    var loginname = validator.trim(req.body.loginname).toLowerCase();
    var email = validator.trim(req.body.email).toLowerCase();
    var pass = validator.trim(req.body.pass);
    var comp = validator.trim(req.body.comp);
    var comp_mail = validator.trim(req.body.comp_mail || '');

    var ep = new eventproxy();
    ep.fail(next);
    ep.on('prop_err', function(msg) {
        res.status(422);
        res.render('sign/signup', {
            error: msg,
            name: name,
            loginname: loginname,
            email: email,
            comp: comp,
            comp_mail: comp_mail
        });
    });

    if (!loginname || !pass || !email) {
        return ep.emit('prop_err', '信息不完整。');
    }
    if (loginname.length < 2) {
        return ep.emit('prop_err', '用户名至少需要2个字符。');
    }
    // if (!comp_mail) {
    //     return ep.emit(
    //         'prop_err',
    //         '公司邮箱输入为空，请一并填写公司邮箱和常用邮箱，'
    //             + '公司邮箱只用于激活验证公司信息，'
    //             + '常用邮箱用于接受文章更新等。'
    //     );
    // }
    if (!validator.isEmail(email)) {
        return ep.emit('prop_err', '邮箱不合法。');
    }

    User.getUsersByQuery(
        {
            '$or': [
                { 'loginname': loginname },
                { 'email': email }
            ]
        },
        {},
        ep.done(function(users) {
            if (users.length > 0) {
                ep.emit('prop_err', '用户名或邮箱已被使用。');
            } else {
                tools.bhash(pass, ep.done(function(passhash) {
                    var avatarUrl = User.makeGravatar(email);
                    User.newAndSave(
                        name, loginname, passhash, email, comp, comp_mail, avatarUrl, false,
                        ep.done('saved')
                    );
                }));
            }
        })
    );
    ep.on('saved', function(user) {
        mail.sendActiveMail(
            email,
            utility.md5(email + user.pass + config.session_secret),
            loginname
        );
        res.render('sign/signup', {
            success: true,
            appName: config.name,
            loginname: loginname,
            comp_mail: comp_mail,
            email: email
        });
    });
};

/**
 * Show user login page.
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 */
exports.showLogin = function (req, res) {
  req.session._loginReferer = req.headers.referer;
  res.render('sign/signin');
};

/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
var notJump = [
  '/active_account', //active page
  '/reset_pass',     //reset password page, avoid to reset twice
  '/signup',         //regist page
  '/search_pass',    //serch pass page
  '/signin'
];

/**
 * Handle user login.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */
 exports.login = function(req, res, next) {
     var loginname = validator.trim(req.body.name);
     var pass = validator.trim(req.body.pass);
     var ep = new eventproxy();
     var cookieOpt = {
         domain: 'iconfont.imweb.io',
         path: '/',
         maxAge: 1000 * 60 * 60 * 24 * 30, //cookie 有效期30天
         signed: true,
         httpOnly: true
     };

     ep.fail(next);

     if (!loginname || !pass) {
         res.status(422);
         return res.render('sign/signin', {
             error: '信息不完整哦。'
         });
     }

     var getUser;
     if (loginname.indexOf('@') !== -1) {
         getUser = User.getUserByMail;
     } else {
         getUser = User.getUserByLoginName;
     }

     ep.on('login_error', function(login_error) {
         res.status(403);
         res.render('sign/signin', {
             error: '用户名或密码错误'
         });
     });

     getUser(loginname, function(err, user) {
         if (err) {
             return next(err);
         }
         if (!user) {
             return ep.emit('login_error');
         }
         var passhash = user.pass;
         tools.bcompare(pass, passhash, ep.done(function(bool) {
             if (!bool) {
                 return ep.emit('login_error');
             }
             /*if (!user.active) {
                 // 重新发送激活邮件
                 mail.sendActiveMail(user.email, utility.md5(user.email + passhash + config.session_secret), user.loginname);
                 res.status(403);
                 return res.render('sign/signin', {
                     error: '此帐号还没有被激活，激活链接已发送到 ' + user.comp_email + ' 邮箱，请查收。'
                 });
             }*/
             // store session cookie
             authMiddleWare.gen_session(user, res);
             //check at some page just jump to home page
             authMiddleWare.gen_auth('uin', JSON.stringify(user._id).replace(/"/g,''), res);
             authMiddleWare.gen_auth('skey', utility.md5(user.pass), res);
             authMiddleWare.gen_auth('accessToken', user.accessToken, res);
             authMiddleWare.gen_auth('user', user.name, res);
             var refer = req.session._loginReferer || req.headers.referer || '/';
             for (var i = 0, len = notJump.length; i !== len; ++i) {
                 if (refer.indexOf(notJump[i]) >= 0) {
                     refer = '/';
                     break;
                 }
             }
             res.redirect(refer);
         }));
     });
 };

// sign out
exports.signout = function (req, res, next) {
  req.session.destroy();
  res.clearCookie(config.auth_cookie_name, { path: '/' });
  res.redirect('/');
};

exports.activeAccount = function (req, res, next) {
  var key  = validator.trim(req.query.key);
  var name = validator.trim(req.query.name);

  User.getUserByLoginName(name, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error('[ACTIVE_ACCOUNT] no such user: ' + name));
    }
    var passhash = user.pass;
    if (!user || utility.md5(user.email + passhash + config.session_secret) !== key) {
      return res.render('notify/notify', {error: '信息有误，帐号无法被激活。'});
    }
    if (user.active) {
      return res.render('notify/notify', {error: '帐号已经是激活状态。'});
    }
    user.active = true;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render('notify/notify', {success: '帐号已被激活，请登录'});
    });
  });
};

exports.showSearchPass = function (req, res) {
  res.render('sign/search_pass');
};

exports.updateSearchPass = function (req, res, next) {
  var email = validator.trim(req.body.email).toLowerCase();
  if (!validator.isEmail(email)) {
    return res.render('sign/search_pass', {error: '邮箱不合法', email: email});
  }

  // 动态生成retrive_key和timestamp到users collection,之后重置密码进行验证
  var retrieveKey  = uuid.v4();
  var retrieveTime = new Date().getTime();

  User.getUserByMail(email, function (err, user) {
    if (!user) {
      res.render('sign/search_pass', {error: '没有这个电子邮箱。', email: email});
      return;
    }
    user.retrieve_key = retrieveKey;
    user.retrieve_time = retrieveTime;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      // 发送重置密码邮件
      mail.sendResetPassMail(email, retrieveKey, user.loginname);
      res.render('notify/notify', {success: '我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。'});
    });
  });
};

/**
 * reset password
 * 'get' to show the page, 'post' to reset password
 * after reset password, retrieve_key&time will be destroy
 * @param  {http.req}   req
 * @param  {http.res}   res
 * @param  {Function} next
 */
exports.resetPass = function (req, res, next) {
  var key  = validator.trim(req.query.key || '');
  var name = validator.trim(req.query.name || '');

  User.getUserByNameAndKey(name, key, function (err, user) {
    if (!user) {
      res.status(403);
      return res.render('notify/notify', {error: '信息有误，密码无法重置。'});
    }
    var now = new Date().getTime();
    var oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
      res.status(403);
      return res.render('notify/notify', {error: '该链接已过期，请重新申请。'});
    }
    return res.render('sign/reset', {name: name, key: key});
  });
};

exports.updatePass = function (req, res, next) {
  var psw   = validator.trim(req.body.psw) || '';
  var repsw = validator.trim(req.body.repsw) || '';
  var key   = validator.trim(req.body.key) || '';
  var name  = validator.trim(req.body.name) || '';

  var ep = new eventproxy();
  ep.fail(next);

  if (psw !== repsw) {
    return res.render('sign/reset', {name: name, key: key, error: '两次密码输入不一致。'});
  }
  User.getUserByNameAndKey(name, key, ep.done(function (user) {
    if (!user) {
      return res.render('notify/notify', {error: '错误的激活链接'});
    }
    tools.bhash(psw, ep.done(function (passhash) {
      user.pass          = passhash;
      user.retrieve_key  = null;
      user.retrieve_time = null;
      user.active        = true; // 用户激活

      user.save(function (err) {
        if (err) {
          return next(err);
        }
        return res.render('notify/notify', {success: '你的密码已重置。'});
      });
    }));
  }));
};
