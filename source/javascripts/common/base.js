define('base', [
	'./db.js',
	'./publishBtn.js',
	'./ui.js',
	'./jquery.lazyload.js',
	'./lodash.compat.min.js'
], function(db, publishBtn){

	db.init();

	// user common function
	imweb.userUtils = imweb.userUtils || {};
	$.extend(imweb.userUtils, {
	    isLogin: function() {
	        return imweb.user && imweb.user.loginname;
	    },
	    checkLogin: function() {
	        var logined = this.isLogin();
	        if (!logined) {
	            alert('请先登录!');
	        }
	        return logined;
	    }
	});

	//发布按钮

	publishBtn.init();

	//头部下拉菜单
	ui.attachDropdownLayer($('#nav-user-menu'), {
	    layer: '#nav-user-menu-layer',
	    offset: {
	        top: 50,
	        left: 84
	    },
	    enter: function() {
	        $(this).closest('.user-sidebar-item')
	            .addClass('user-sidebar-item-active');
	    },
	    leave: function() {
	        $(this).closest('.user-sidebar-item')
	            .removeClass('user-sidebar-item-active');
	    }
	}); 
});