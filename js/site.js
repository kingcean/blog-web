﻿var site = {};
(function(site) {

    site.query = function (name) {
        url = location.search;
        if (name == null)
            return null;
        try {
            if (typeof name === "string") {
                var result = url.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
                if (result == null || result.length < 1) {
                    return "";
                }
                return notToDecode ? result[1] : decodeURIComponent(result[1]);
            }
            else if (typeof name === "number") {
                var result = url.match(new RegExp("[\?\&][^\?\&]+=[^\?\&]+", "g"));
                if (result == null) {
                    return "";
                }
                return notToDecode ? result[name].substring(1) : decodeURIComponent(result[name].substring(1));
            }
        }
        catch (ex) { }
            return null;
    };

    site.firstQuery = function () {
        var id = location.search;
        if (!!id && id.length > 1) {
            id = id.substring(1);
            var idEndPos = id.indexOf("?");
            if (idEndPos >= 0) id = id.substring(0, idEndPos);
            idEndPos = id.indexOf("&");
            if (idEndPos >= 0) id = id.substring(0, idEndPos);
        }

        return id;
    };

    site.head = function () {
        var cntEle = document.createElement("header");
        cntEle.id = "page_head";
        cntEle.innerHTML = '<section><h1><a href="http://www.kingcean.com/">Kingcean</a><span> &gt; </span><a href="http://github.kingcean.com/">GitHub</a></h1></section>';
        document.body.appendChild(cntEle);

        var cnt2Ele = document.createElement("header");
        cnt2Ele.id = "page_menu";
        cnt2Ele.innerHTML = '<section><ul><li><a href="http://github.kingcean.com/">Home</a></li><li><a href="https://github.com/kingcean?tab=repositories">Repositories</a></li><li><a href="http://github.kingcean.com/blog/dotnet">.Net Dev Blogs</a></li><li><a href="http://github.kingcean.com/blog/web">Web Dev Blogs</a></li><li><a href="http://github.kingcean.com/blog/qianduan">前端开发博客</a></li><li><a href="http://github.kingcean.com/blog/dian-net">.Net 开发博客</a></li></ul></section>';
        document.body.appendChild(cnt2Ele);
    };

    site.blogs = function () {
        var cntEle = document.createElement("section");
        cntEle.id = "blog_content";
        document.body.appendChild(cntEle);
        var id = site.firstQuery();

        var lang = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage;

        $.get(lang.indexOf("zh") === 0 ? "zh-Hans.json" : "en.json").then(function (r) {
            if (!r || !r.list || !(r.list instanceof Array)) return;
            var cntStr = "";
            r.list.reverse().forEach(function (item) {
                if (!item) return;
                if (!item.url || item.url.length < 17) {
                    item.invalid = true;
                    return;
                }

                var fileName = item.url.substring(6);
                var fileDate = item.url.substring(1, 5).replace("/", "").replace("/", "");
                var fileExtPos = fileName.indexOf(".");
                var fileExt = fileExtPos >= 0 ? fileName.substring(fileExtPos + 1) : "";
                fileName = fileExtPos > 0 ? fileName.substring(0, fileExtPos) : "";
                if (!fileName) {
                    item.invalid = true;
                    return;
                }

                if (!item.id) item.id = fileName;
                if (!item.date) item.date = fileDate;
                if (!item.type) item.type = fileExt;
                item.dir = item.url.substring(0, 5);
            });

            var articleStr = "";
            if (!!id) {
                articleStr = "<h1>" + item.name + "</h1><section><em>Loading...</em></section>";
                r.list.some(function (item) {
                    if (!item || item.invalid || item.id !== id) return false;
                    $.get("/blog" + item.url).then(function (r2) {
                        var md = new Remarkable();
                        r2 = r2.replace(/\(.\//g, "(/blog/" + item.dir + "/");
                        cntEle.innerHTML = "<h1>" + item.name + "</h1><section>" + md.render(r2) + "</section>" + cntStr;
                    }, function (r) {
                        cntEle.innerHTML = "<h1>" + item.name + "</h1><section><em>Failed to load.</em></section>" + cntStr;

                    });
                    return true;
                });
            }

            cntStr = "<h1>" + r.name + "</h1><ul>";
            r.list.forEach(function (item) {
                if (!item || item.invalid) return;
                cntStr += "<li><a href='?" + item.id + "'>" + item.name + "</a></li>";
            });
            cntStr += "</ul>";
            cntEle.innerHTML = articleStr + cntStr;
        }, function (r) {
            cntEle.innerHTML = "<em>Failed to load.</em>";
        });
    };
    
})(site || (site = {}));
