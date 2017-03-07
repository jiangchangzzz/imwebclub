var t = $;
t.fn.lazyload = function(i) {
    return this.each(function() {
        i = i || {};
        var e = {}, r = t.extend({}, e, i), a = t(this), o = this, c = i.srcSign || "lazy-src", s = i.errCallBack || function() {
        }, f = i.sussCallBack || function() {
        }, l = i.container || t(window), u = i.size, g = i.errPic, h = function(i, t) {
            f(t)
        }, d = function(i) {
            var t = i.width(), n = i.height(), e = u[0], r = u[1];
            if (t + n != 0)
                if (t / n > e / r) {
                    var a = r * t / n, o = (e - a) / 2;
                    i.height(r).css({"margin-left": o})
                } else {
                    var c = e * n / t, o = (r - c) / 2;
                    i.width(e).css({"margin-top": o})
                }
        }, m = function(i, t, e) {
            if (!t[0].src || !(t[0].src.indexOf("img-err.png") > 0 || t[0].src.indexOf("img-err2.png") > 0)) {
                if (g) {
                    if (t[0].src.indexOf(g) > 0)
                        return;
                    t[0].src = g
                } else {
                    var r = t.width(), a = t.height();
                    t[0].src = r / a == 1 ? "//9.url.cn/edu/img/img-err.png" : "http://9.url.cn/edu/img/img-err2.png"
                }
                e()
            }
        }, p = function(i) {
            var t = i.width(), n = i.height(), e = (i.offset().top, i.offset().left, i.clone().addClass("lazy-loding").insertBefore(i));
            u && e.width(u[0]).height(u[1]), e[0].src = t / n == 1 ? "//9.url.cn/edu/img/img-loading.png" : "//9.url.cn/edu/img/img-loading2.png", i.hide()
        }, w = function(i, t, n) {
            if (!i.attr("src")) {
                p(i);
                var e = i.attr(t);
                i[0].onerror = function(t) {
                    m(t, i, n, e)
                }, i[0].onload = function(t) {
                    u && d(i), i.parent().find(".lazy-loding").remove(), i.show(), h(t, i)
                }, i[0].src = e
            }
        };
        if (r.cache = [], "IMG" == o.tagName) {
            var v = {obj: a,tag: "img",url: a.attr(c)};
            r.cache.push(v)
        } else {
            var j = a.find("img");
            j.each(function(i) {
                var n = this.nodeName.toLowerCase(), e = t(this).attr(c), a = {obj: j.eq(i),tag: n,url: e};
                r.cache.push(a)
            })
        }
        var y = function() {
            var i, n = l.height();
            i = t(window).get(0) === window ? t(window).scrollTop() : l.offset().top, t.each(r.cache, function(t, e) {
                var r, a, o = e.obj, f = e.tag, l = e.url;
                o && (r = o.offset().top - i, r + o.height(), (r >= 0 && n > r || a > 0 && n >= a) && (l && "img" === f && w(o, c, s), e.obj = null))
            })
        };
        y(), l.bind("scroll", y), l.bind("resize", y)
    })
}
