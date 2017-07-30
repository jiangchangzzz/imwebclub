var request = require('superagent');
var Promise = require('bluebird');
var sha1=require('sha1');

var config = {
  appid: 'wxd5841c34c4a7470a',
  secret: 'fcddcc4faa93cb8e5301c62922a72ab7',
  grant_type: 'client_credential'
};

var token = {
  access_token: null,
  expires_in: null,
  time: null
};

var ticket = {
  ticket: null,
  expires_in: null,
  time: null
};

exports.signature = function (req, res, next) {
  var obj = {
    noncestr: req.query.noncestr,
    timestamp: req.query.timestamp,
    url: req.query.url
  };

  getToken()
    .then(function (res) {
      return getTicket(res);
    })
    .then(function (ticket) {
        obj.jsapi_ticket=ticket;

        var str='jsapi_ticket='+obj.jsapi_ticket+
            '&noncestr='+obj.noncestr+
            '&timestamp='+obj.timestamp+
            '&url='+obj.url;
        var signature=sha1(str);

        console.log('signature: '+signature);
        res.jsonp({
            signature: signature
        });
    })
    .catch(function(err){
        console.log('err: '+err);
        res.jsonp({
            err: err
        });
    });
};

/**
 * 获取token
 * @returns 
 */
function getToken() {
  if (!token.access_token || checkTime(token.time, token.expires_in)) {
    return new Promise(function (resolve, reject) {
      request.get('https://api.weixin.qq.com/cgi-bin/token')
        .query(config)
        .end(function (err, res) {
          if (err) {
            reject(err);
          }

          token.access_token = res.body.access_token;
          token.expires_in = res.body.expires_in;
          token.time = new Date();
          resolve(res.body.access_token);
        });
    });
  } else {
    return Promise.resolve(token.access_token);
  }
}

/**
 * 根据token获取ticket
 * @param {any} access_token 
 * @returns 
 */
function getTicket(access_token) {
  if (!ticket.ticket || checkTime(ticket.time, ticket.expires_in)) {
    return new Promise(function (resolve, reject) {
      request.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket')
        .query({
          access_token: access_token,
          type: 'jsapi'
        })
        .end(function (err, res) {
          if (err) {
            reject(err);
          }

          ticket.ticket = res.body.ticket;
          ticket.expires_in = res.body.expires_in;
          ticket.time = new Date();
          resolve(res.body.ticket);
        })
    });
  } else {
    return Promise.resolve(ticket.ticket);
  }
}

//检查时间是否过期
function checkTime(time, expires_in) {
  var now = new Date();
  var res = (now.getTime() - time.getTime()) / 1000;
  if (res >= expires_in) {
    return true;
  } else {
    return false;
  }
}
