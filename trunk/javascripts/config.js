module.exports = {
    MAIL_DOMAIN: 'qq.com;163.com;126.com;sohu.com;sina.com;gmail.com;21cn.com;hotmail.com;vip.qq.com;yeah.net'.split(';'),
    regExps: {
        email     : /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/,
        loginname : /^[\w]{5,20}$/,
        pass      : /^[\w~`!@#$%\^&*()\-+=;:'",.<>\/?\\|\[\]{}]{6,20}$/,
        name      : /^[\u4e00-\u9fa5]{2,5}$/,
        company   : /^[\s\S]{1,50}$/,
        team      : /^[\s\S]{0,50}$/
    },
    templateSettings: {
        evaluate    : /\{\{([\s\S]+?)\}\}/g,
        interpolate : /\{\{=([\s\S]+?)\}\}/g,
        escape      : /\{\{-([\s\S]+?)\}\}/g,
    }
};
