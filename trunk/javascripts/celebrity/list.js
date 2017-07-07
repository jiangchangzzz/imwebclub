'use strict';

$(document).ready(function(){
    //关注用户
    $('.follow-btn').click(function(e){
        var btn=$(this);
        changeFollow(btn,'post');
    });

    //取消关注
    $('.cancel-btn').click(function(e){
        var btn=$(this);
        changeFollow(btn,'delete');
    });

    //改变关注
    function changeFollow(btn,type){
        var uid=btn.parent('.header-btn').data('id');

        $.ajax({
            url: '/user/follow',
            type: type,
            data: {
                followUser_id: uid
            },
            success: function(data){
                if(data.status==='success'){
                    btn.addClass('hide');
                    btn.siblings('.btn').removeClass('hide');

                    //改变关注数目
                    var numEle=btn.parents('.item-header').find('.follow-num');
                    var num=parseInt(numEle.text());
                    if(type==='post'){
                        num++;
                    }else if(type==='delete'){
                        num--;
                    }
                    numEle.text(num);
                }
            }
        })
    }
})