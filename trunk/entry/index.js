import '../stylesheets/index.less';
import '../stylesheets/banner.less';
import '../stylesheets/sidebar.less';
import '../javascripts/index/main.js';

$('#hotActivtities .imweb').click(function(e){
    if($('#hotActivtities .imweb').hasClass('active')){
      return;
    }
    $('#hotActivtities .imweb').addClass('active');
    $('#hotActivtities .industry').removeClass('active');
    $('#hotActivtities .activity_imweb').show();
    $('#hotActivtities .activity_industry').hide();
});
$('#hotActivtities .industry').click(function(e){
    if($('#hotActivtities .industry').hasClass('active')){
      return;
    }
    $('#hotActivtities .industry').addClass('active');
    $('#hotActivtities .imweb').removeClass('active');
    $('#hotActivtities .activity_industry').show();
    $('#hotActivtities .activity_imweb').hide();
});
