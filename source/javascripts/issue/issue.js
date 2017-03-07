//首页入口逻辑

define([], function(){
    
    var $issueList = $('#issue-list');

    $issueList.on('click','.issue-list-item', function(){
    	window.open($(this).data('href'))
    });
});