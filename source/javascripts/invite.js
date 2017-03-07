$(function() {
    var sendInviteForm = $('#send_invite_form');
    new ui.FormValidator(sendInviteForm, [
        new ui.Validator({
            input: sendInviteForm.find('[name=email]'),
            required: true,
            requiredError: '邮箱不可为空',
            regexp: config.regExps.email,
            regexpError: '邮箱格式错误'
        }),
        new ui.Validator({
            input: sendInviteForm.find('[name=name]'),
            required: true,
            requiredError: '真实姓名不可为空',
            regexp: config.regExps.name,
            regexpError: '真实姓名格式错误(2-5位汉字)'
        })
    ]);

    var acceptSendForm = $('#accept_invite_form');
    new ui.FormValidator(acceptSendForm, [
        new ui.Validator({
            input: acceptSendForm.find('[name=loginname]'),
            required: true,
            requiredError: '登录名不可为空',
            regexp: config.regExps.loginname,
            regexpError: '登录名格式错误'
        }),
        new ui.Validator({
            input: acceptSendForm.find('[name=pass]'),
            required: true,
            requiredError: '密码不可为空',
            regexp: config.regExps.pass,
            regexpError: '密码格式错误'
        }),
        new ui.Validator({
            input: acceptSendForm.find('[name=re_pass]'),
            validate: function(text) {
                var pass = acceptSendForm.find('[name=pass]').val();
                if (config.regExps.pass.test(pass)) {
                    if (!text) {
                        return '确认密码不可为空';
                    }
                    if (text !== pass) {
                        return '确认密码不一致';
                    } 
                }
            }
        }),
        new ui.Validator({
            input: acceptSendForm.find('[name=name]'),
            required: true,
            requiredError: '真实姓名不可为空',
            regexp: config.regExps.name,
            regexpError: '真实姓名格式错误(2-5位汉字)'
        }),
        new ui.Validator({
            input: acceptSendForm.find('[name=company]'),
            required: true,
            requiredError: '公司/组织不可为空'
        })
    ]);
});
