<li class="sub-reply-item" data-reply-id="<%= reply.id %>">
    <span class='content-wrap'>
        <%= reply.text %>
    </span>
    <span class="minus">–</span>
    <a href="javascript:void(0);" title="<%= reply.author.loginname %>"
                class="user-url user-slider-btn" data-name="<%= reply.author.loginname %>"><%= reply.author.loginname %></a>
    <% if(isAdmin || isAuthor || isTopicAuthor) { %>
    <span class="act delete-reply">删除</span>
    <% } %>
    <span class="create-at"><%- reply.friendly_create_at %></span>
</li>