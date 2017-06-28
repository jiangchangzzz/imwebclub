'use strict';

$(document).ready(function(){
    $('#columnForm').on('submit',function(e){
        var title=$('#title').val().trim();
        if(!title){
            $('titleGroup').addClass('has-error');
            return false;
        }
    });
});



