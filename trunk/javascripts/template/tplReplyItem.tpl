<% var name = reply.author.name || reply.author.loginname ;%>
<li class='reply-item
    <%= reply.ups.length >= topic.reply_up_threshold ? 'reply-highlight' : ''  %>'
    data-reply-id="<%= reply.id %>">

    <a class="anchor" id="<%= reply.id %>"></a>

    <div class="user-area">
        <div class="user-avatar-wrap">
            <a href="javascript:void(0);" class="user-avatar user-slider-btn" data-name="<%= name %>">
                <img class="ui-avatar ui-avatar-38 js-identicon" src="<%= reply.author.avatar %>"
                    title="<%= name %>" />
            </a>
        </div>
    </div>
    <div class="main-area">
        <div class="user-url-wrap ">
            <a href="javascript:void(0);" title="<%= name %>"
                class="user-url user-slider-btn" data-name="<%= name %>"><%= name %></a>
            <span class="create-at"><%= reply.friendly_create_at%></span>
            <div class="actions btn-wrap">
                <% if(isAdmin || isAuthor) { %>
                <a href="/reply/<%= reply.id %>/edit" class="btn-ico">
                <i class="fa fa-lg fa-pencil-square-o" title="编辑"></i></a>
                <% } %>
                <% if(isAdmin || isAuthor || isTopicAuthor) { %>
                <a href="javascript:;" class="btn-ico delete-reply">
                 <i class="fa fa-lg fa-trash" title="删除"></i></a>
                <% } %>
            </div>
        </div>
        <div class="content-wrap">
            <%= reply.content %>
        </div>
        <div class="info-area">
            <div class="edit-at"><%= reply.friendly_edit_at%></div>

        </div>
        <% if(isLogin){ %>
        <div class="reply-btn-area">
            <% if (isLogin && _.contains(reply.ups, user.id)) { %>
                <span class="act up-reply uped" data-cancel="true">取消感谢</span>
            <% } else { %>
                <span class="act up-reply" data-cancel="false">感谢<span class="up-count">(<%= reply.ups.length %>)</span></span>
            <% } %>
            <span class="act open-sub-reply" data-count="<%=reply.subReplies.length%>">回复(<%=reply.subReplies.length%>)</span>
        </div>
        <div class="reply-edit-area">
            <div class="editor-wrap">
                <textarea class="editor"></textarea>
            </div>
            <div class="editor-actions">
                <button class="ui-button sub-reply-submit" type="button">回复</button>
            </div>
        </div>
        <% } %>
    
        <div class="sub-reply">
            <ul class="sub-reply-list">
               <%= reply.subRepliesHTML || '' %> 
            </ul>
        </div>
        </div> 
</li>
