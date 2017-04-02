define([], function(){

	var ui = {};
	// more icon 点击切换方向
	$(document).on('click', '.ui-more-down', function() {
	    $(this).removeClass('ui-more-down').addClass('ui-more-up');
	});
	$(document).on('click', '.ui-more-up', function() {
	    $(this).removeClass('ui-more-up').addClass('ui-more-down');
	});
	$(document).on('click', '.ui-more-left', function() {
	    $(this).removeClass('ui-more-left').addClass('ui-more-right');
	});
	$(document).on('click', '.ui-more-right', function() {
	    $(this).removeClass('ui-more-right').addClass('ui-more-left');
	});

	// ui-disabled
	$(document).on('click', '.ui-disabled', function(e) {
	    e.preventDefault();
	    e.stopPropagation();
	});

	$(function() {
	    $('select').each(function() {
	        if (typeof $(this).attr('value') === 'string') {
	            $(this).val($(this).attr('value'));
	        }
	    });
	});

	/**
	 * 隐藏浮沉视觉的停留延时
	 */
	var VIEW_STAY = 100;

	/**
	 * 绑定dropdownlayer hover显示/隐藏layer
	 * @param {Object} $trigger
	 * @param {Object} options
	 * @param {string} options.mode 何时显示hover/click 默认hover
	 * @param {string} options.layer layer的选择器
	 * @param {Object} options.offset
	 *      layer将显示在trigger的正下方，用offset微调layer的位置
	 * @param {number} options.offset.left
	 * @param {number} options.offset.top
	 * @param {function} options.enter 显示layer的回调
	 * @param {function} options.leave 隐藏layer的回调
	 */
	 ui.attachDropdownLayer = function($trigger, options) {
 			var $layer = $(options.layer);
 			options.mode = options.mode || 'click';
 			options.enter = options.enter || $.noop;
 			options.leave = options.leave || $.noop;
			options.left = typeof options.left === 'undefined' ? -40 : options.left;
			options.top = typeof options.top === 'undefined' ? 30 : options.top;
 			var showTimeout = null;
 			var hideTimeout = null;
			$layer.css({
	         left: Math.floor($trigger.position().left + options.left) + 'px',
	         top: Math.floor($trigger.position().top + options.top) + 'px'
	    });
			if(options.width){
				$layer.css({
		         width: options.width + 'px'
		    });
			}
 			var show = function() {
 					if (hideTimeout) {
 							clearTimeout(hideTimeout);
 							hideTimeout = null;
 					}
 					if ($layer.css('display') !== 'none' || showTimeout) {
 							return;
 					}
 					showTimeout = setTimeout(showImmediately, VIEW_STAY);
 			};
 			var hide = function() {
 					if (showTimeout) {
 							clearTimeout(showTimeout);
 							showTimeout = null;
 					}
 					if ($layer.css('display') === 'none' || hideTimeout) {
 							return;
 					}
 					hideTimeout = setTimeout(hideImmediately, VIEW_STAY);
 			};
 			var showImmediately = function() {
 					showTimeout = null;
 					var triggerPos = $trigger.position();
 					// show first
 					$layer.css('display', 'block');

 					options.enter.apply($trigger[0]);
 			};
 			var hideImmediately = function() {
 					hideTimeout = null;
 					$layer.css('display', 'none');
 					options.leave.apply($trigger[0]);
 			};
 			$trigger.hover(show, hide);
 			$layer.hover(show, hide);
 	};

	window.ui = ui;
});
