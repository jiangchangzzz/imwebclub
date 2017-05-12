var utils = {
    getQueryString: function (name) {
        name = name.replace(/[\[\]]/, '\\$0');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
        return results === null 
            ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
};
