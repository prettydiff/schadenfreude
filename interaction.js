/*global document, location, window, console, localStorage, JSON, setTimeout, XMLHttpRequest, ActiveXObject, navigator*/
/*jslint for:true*/
(function dash() {
    "use strict";
    var data = {
            body       : document.getElementsByTagName("body")[0],
            icon       : {
                grow    : "\u25f1",
                maximize: "\u25ae",
                shrink  : "\u25ac",
                unmax   : "\u25a0"
            },
            loadtest   : true,
            minCount   : -1,
            textBody   : document.getElementsByTagName("scratch-body"),
            settings   : {},
            spawn      : false,
            windows    : [],
            winLen     : 0,
            winsettings: {
                "main-menu": {
                    data    : {
                        name: "",
                        service: "",
                        frequency: ""
                    },
                    minimize: "normal",
                    id      : "main-menu",
                    position: {
                        height: 20.5,
                        left  : 10,
                        top   : 10,
                        width : 41.5,
                        zIndex: 1
                    },
                    shape   : "normal",
                    type    : "window",
                    value   : ""
                }
            },
            zIndex     : 1
        },
        apps = {};
    apps.changeConfig = function dash_changeConfig(value) { // text configuration
        var parsed = JSON.parse(value),
            keys   = Object.keys(parsed),
            zindex = 0,
            a      = keys.length - 1;
        if (value.length < JSON.stringify(data.winsettings["main-menu"]).length) {
            return apps.reset();
        }
        do {
            if (parsed[keys[a]].position !== undefined && parsed[keys[a]].position.zIndex > zindex) {
                zindex = parsed[keys[a]].position.zIndex;
            }
            a -= 1;
        } while (a > -1);
        data.zIndex = zindex;
        data.loadtest = true;
        apps.save(value, "winsettings");
        location.reload();
    };
    apps.delete      = function dash_delete(self) { // deletes the active window
        var win = self.parentNode.parentNode,
            id  = win.getAttribute("id"),
            a   = 0;
        win.parentNode.removeChild(win);
        for (a = data.winLen; a > -1; a -= 1) {
            if (data.windows[a] === win) {
                data.windows.splice(a, 1);
                break;
            }
        }
        data.winLen -= 1;
        delete data.winsettings[id];
        apps.save(data.winsettings, "winsettings");
    };
    apps.fixMinCount = function dash_fixMinCount() { //determine first available location to hold minimized windows
        var a = data.winLen + 1,
            c = 0,
            d = [],
            e = {},
            f = 0;
        for (c = 0; c < a; c += 1) {
            e = data
                .windows[c]
                .getElementsByTagName("h2")[0];
            f = data.windows[c].offsetLeft - 10;
            if (e.clientWidth === 175 && f % 190 === 0) {
                d.push(f / 190);
            }
        }
        d = d.sort(function dash_fixMinCount_sort(first, second) {
            return first - second;
        });
        a = d.length;
        for (c = 0; c < a; c += 1) {
            if (d[c] !== c) {
                data.minCount = c;
                return;
            }
        }
        data.minCount = c;
    };
    apps.getService  = function dash_getService(win) { // build a service request
        var body   = win.getElementsByTagName("div")[0],
            h2     = win.getElementsByTagName("h2")[0],
            id     = win.getAttribute("id"),
            parent = {},
            inputs = [],
            req    = "",
            name   = "",
            freq   = 0,
            text   = "",
            stest  = "",
            ajax   = function dash_getService_ajax() {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            text = xhr.responseText;
                            body.innerHTML = apps.parse(xhr.responseText);
                        }
                    }
                };
                xhr.open("GET", location.href + "?address=" + req);
                xhr.send();
            };
        if (data.loadtest === true) {
            name = data.winsettings[id].data.name;
            req  = data.winsettings[id].data.service;
            freq = data.winsettings[id].data.frequency;
        } else {
            parent = body.getElementsByTagName("div")[0];
            inputs = parent.getElementsByTagName("input");
            name   = inputs[0].value;
            req    = inputs[1].value;
            freq   = Number(inputs[2].value);
        }
        stest = apps.serviceTest(req, {
            body: body,
            name: name,
            freq: freq
        });
        if (isNaN(freq) === true) {
            return console.error("Frequency is not a number.");
        }
        if (stest === "") {
            return console.error("Service end point does not appear to be a valid URI or known function name.  Expecting HTTP(S) or an available function.");
        }
        if (name === "") {
            return console.error("Name cannot be empty.");
        }
        data.winsettings[id].data = {
            name: name,
            service: req,
            frequency: freq
        }
        apps.save(data.winsettings, "winsettings");
        h2.innerHTML = "<span>" + name + "</span>";
        if (data.loadtest === false && parent.parentNode === body) {
            body.removeChild(parent);
        }
        if (stest === "ajax") {
            ajax();
        }
        setInterval(ajax, freq * 1000);
    };
    apps.grab        = function dash_grab(e, x) { //basic drag and drop for the report windows
        var a       = (x.parentNode.nodeName.toLowerCase() === "h2")
                ? x.parentNode.parentNode
                : x.parentNode,
            parent  = a.getElementsByTagName("p")[0],
            b       = parent.style.display,
            c       = {},
            d       = a.lastChild,
            h       = parent.lastChild,
            j       = a.getAttribute("id"),
            ax      = a.offsetLeft,
            ay      = a.offsetTop,
            drop    = function dash_grab_drop() {
                document.onmousemove              = null;
                ax                                = a.offsetLeft;
                ay                                = a.offsetTop;
                document.onmouseup                = null;
                a.style.height                    = "auto";
                h.style.display                   = "block";
                data.winsettings[j].position.left = (a.offsetLeft / 10);
                data.winsettings[j].position.top  = (function dash_grab_drop_top() {
                    var top = a.offsetTop;
                    if (top < 0) {
                        a.style.top = "1em";
                        return 1;
                    }
                    return a.offsetTop / 10;
                }());
                d.style.opacity                   = "1";
                apps.save(data.winsettings, "winsettings");
                if (typeof e === "object" && e !== null && typeof e.preventDefault === "function") {
                    e.preventDefault();
                }
                return false;
            },
            boxmove = function dash_grab_boxmove(f) {
                f                  = f || window.event;
                a.style.right      = "auto";
                a.style.left       = ((ax + (f.clientX - a.mouseX)) / 10) + "em";
                a.style.top        = ((ay + (f.clientY - a.mouseY)) / 10) + "em";
                document.onmouseup = drop;
                if (typeof e === "object" && e !== null && typeof e.preventDefault === "function") {
                    e.preventDefault();
                }
                return false;
            };
        e = e || window.event;
        if (b === "none") {
            c = a.getElementsByTagName("button")[0];
            apps.minimize({
                button: c,
                event : e
            });
            return false;
        }
        apps.top(a);
        if (d.nodeType !== 1) {
            do {
                d = d.previousSibling;
            } while (d.nodeType !== 1);
        }
        if (h.nodeType !== 1) {
            do {
                h = h.previousSibling;
            } while (h.nodeType !== 1);
        }
        d.style.opacity      = "0.75";
        h.style.display      = "none";
        a.style.height       = ".1em";
        a.mouseX             = e.clientX;
        a.mouseY             = e.clientY;
        document.onmousemove = boxmove;
        document.onmousedown = null;
        if (typeof e === "object" && e !== null && typeof e.preventDefault === "function") {
            e.preventDefault();
        }
        return false;
    };
    apps.id          = function dash_id(x) { // alias for document.getElementById()
        if (document.getElementById === undefined) {
            return null;
        }
        return document.getElementById(x);
    };
    apps.parse       = function dash_parse(string) { // universal one-stop shop for parsing
        string = string.replace(/^(\s+)/, "").replace(/(\s+)$/, "");
        if (string.charAt(0) === "[") {
            string = "{\"array\":" + string + "}";
        }
        if (string.charAt(0) === "{") {
            return JSON.parse(string);
        }
        if (string.charAt(0) === "<") {
            return (new window.DOMParser()).parseFromString(string, "application/xml");
        }
        //if (string.split(",").length > 2) { csv parser will go here }
        console.error("UNKNOWN FORMAT for input to apps.parse,\n" + string.slice(0, 200));
    };
    apps.maximize    = function dash_maximize(x) { //maximize report window to available browser window
        var parent = x.parentNode,
            a      = parent.parentNode,
            b      = a.getElementsByTagName("h2")[0],
            c      = (function dash_maximize_findBody() { //window body
                var aa = a.childNodes,
                    bb = 0;
                for (bb = aa.length - 1; bb > -1; bb -= 1) {
                    if (aa[bb].nodeType === 1 && aa[bb].getAttribute("class") !== null && aa[bb].getAttribute("class").indexOf("window-body") > -1) {
                        return aa[bb];
                    }
                }
                return a.getElementsByTagName("div")[0];
            }()),
            d      = (data.body.parentNode.scrollTop > data.body.scrollTop)
                ? data.body.parentNode.scrollTop
                : data.body.scrollTop,
            e      = (data.body.parentNode.scrollLeft > data.body.scrollLeft)
                ? data.body.parentNode.scrollLeft
                : data.body.scrollLeft,
            f      = a.getAttribute("id"),
            g      = parent.getElementsByTagName("button"),
            del    = (g[0].getAttribute("class") === "window-delete"),
            h      = g[g.length - 1],
            h2diff = 0;
        apps.top(a);
        if (x.innerHTML === data.icon.maximize) {
            h2diff = (del === true)
                ? 15.25
                : 12;
            x.innerHTML = data.icon.unmax;
            x.setAttribute("title", "Return this dialogue to its prior size and location.");
            data.winsettings[f].position.top    = (a.offsetTop / 10);
            data.winsettings[f].position.left   = (a.offsetLeft / 10);
            data.winsettings[f].position.height = (c.clientHeight / 12) - 1.55;
            data.winsettings[f].position.width  = (c.clientWidth / 12) + 0.375;
            data.winsettings[f].position.zIndex = a.style.zIndex;
            a.style.top                         = (d / 10) + "em";
            a.style.left                        = (e / 10) + "em";
            c.style.height                      = ((window.innerHeight / 12) - 4.75) + "em";
            b.style.width                       = ((window.innerWidth / 10) - h2diff) + "em";
            c.style.width                       = ((window.innerWidth / 12) - 2.75) + "em";
            h.style.display                     = "none";
            b.onmousedown                       = null;
            b.style.cursor                      = "default";
            data.winsettings[f].shape           = "maximize";
            apps.save(data.winsettings, "winsettings");
        } else {
            h2diff = (del === true)
                ? 12
                : 8.75;
            x.innerHTML = data.icon.maximize;
            x.setAttribute("title", "Maximize this dialogue to the browser window.");
            if (typeof data.winsettings[f].position.top === "number") {
                a.style.top    = data.winsettings[f].position.top + "em";
                a.style.left   = data.winsettings[f].position.left + "em";
                b.style.width  = ((data.winsettings[f].position.width * 1.2) - h2diff) + "em";
                c.style.width  = data.winsettings[f].position.width + "em";
                c.style.height = data.winsettings[f].position.height + "em";
            }
            h.style.display           = "block";
            b.onmousedown             = function dash_maximize_bindGrab(event) {
                apps.grab(event, b);
            };
            b.style.cursor            = "move";
            data.winsettings[f].shape = "normal";
            apps.save(data.winsettings, "winsettings");
        }
    };
    apps.minimize    = function dash_minimize(arg) { //minimize windows to the default size and location
        var a         = arg.button.parentNode, //button parent
            b         = a.parentNode, //window
            c         = (function dash_minimize_findBody() { //window body
                var aa = b.childNodes,
                    bb = 0;
                for (bb = aa.length - 1; bb > -1; bb -= 1) {
                    if (aa[bb].nodeType === 1 && aa[bb].getAttribute("class") === "window-body") {
                        return aa[bb];
                    }
                }
                return b.getElementsByTagName("div")[0];
            }()),
            d         = b.getElementsByTagName("h2")[0], //window heading
            f         = b.getAttribute("id"), //window id
            buttons   = a.getElementsByTagName("button"),
            del       = (buttons[0].getAttribute("class") === "window-delete"),
            g         = (del === true) //minimize
                ? buttons[1]
                : buttons[0],
            h         = (del === true) // maximize
                ? buttons[2]
                : buttons[1],
            i         = b.offsetLeft / 10,
            j         = b.offsetTop / 10,
            k         = (del === true) // resize
                ? buttons[3]
                : buttons[2],
            step      = (typeof arg.step !== "number")
                ? 50
                : (arg.step < 1)
                    ? 1
                    : arg.step,
            textarea  = (c.nodeName.toLowerCase() === "textarea"),
            minWidth  = 17,
            growth    = function dash_minimize_growth(w, v, x) {
                var aa   = c, //window body
                    bb   = d, //window heading
                    gg   = minWidth,
                    hh   = 3,
                    ii   = 0,
                    jj   = 0,
                    kk   = 0,
                    ll   = 0,
                    m    = 0,
                    n    = 0,
                    q    = 0,
                    r    = 0,
                    mult = 1.2,
                    s    = (del === true)
                        ? 12.5
                        : 8.75,
                    grow = function dash_minimize_growth_grow() {
                        gg              += m;
                        hh              += n;
                        w               += q;
                        v               += r;
                        aa.style.width  = gg + "em";
                        aa.style.height = hh + "em";
                        bb.style.width  = ((gg * mult) - s) + "em";
                        x.style.left    = w + "em";
                        x.style.top     = v + "em";
                        if (gg + m < kk || hh + n < ll) {
                            setTimeout(dash_minimize_growth_grow, 1);
                        } else {
                            aa.style.width               = kk + "em";
                            aa.style.height              = ll + "em";
                            b.style.left                 = ii + "em";
                            b.style.top                  = jj + "em";
                            bb.style.width               = ((kk * mult) - s) + "em";
                            data.winsettings[f].minimize = "normal";
                            return false;
                        }
                    };
                if (typeof data.winsettings[f].position.left === "number") {
                    ii = data.winsettings[f].position.left;
                    jj = data.winsettings[f].position.top;
                    kk = data.winsettings[f].position.width;
                    ll = data.winsettings[f].position.height;
                    if (ii < 1) {
                        ii = 5;
                    }
                    if (jj > v) {
                        jj = v;
                    }
                } else {
                    data.winsettings[f].position.left   = 20;
                    data.winsettings[f].position.top    = v;
                    data.winsettings[f].position.width  = 75;
                    data.winsettings[f].position.height = 20;
                    ii                                  = 20;
                    jj                                  = v;
                    kk                                  = 75;
                    ll                                  = 20;
                }
                if (textarea === true) {
                    s += 1.25;
                }
                if (typeof arg.event === "object" && arg.event !== null && typeof arg.event.preventDefault === "function") {
                    arg
                        .event
                        .preventDefault();
                }
                if (step === 1) {
                    x.style.left    = ii + "em";
                    x.style.top     = jj + "em";
                    aa.style.width  = kk + "em";
                    aa.style.height = ll + "em";
                    bb.style.width  = ((kk * mult) - s) + "em";
                    return false;
                }
                m                = (kk > gg)
                    ? ((kk - gg) / step)
                    : ((gg - kk) / step);
                n                = (ll > hh)
                    ? ((ll - hh) / step)
                    : ((hh - ll) / step);
                q                = (ii - w) / step;
                r                = (jj - v) / step;
                aa.style.display = "block";
                grow();
                return false;
            },
            shrinkage = function dash_minimize_shrinkage(w, x, y, z) {
                // x = window y = body z = heading appears to shift up because its based upon
                // the location of the bottom edge of the div window that appears to start at
                // the terminal location
                var aa     = i,
                    bb     = ((window.innerHeight - (b.offsetTop + b.clientHeight)) / 10),
                    cc     = y.clientWidth / 10,
                    dd     = y.clientHeight / 10,
                    ee     = (w - aa) / step,
                    ff     = bb / step,
                    gg     = (cc === minWidth)
                        ? 0
                        : (cc > minWidth)
                            ? ((cc - minWidth) / step)
                            : ((minWidth - cc) / step),
                    hh     = dd / step,
                    shrink = function dash_minimize_shrinkage_shrink() {
                        aa             += ee;
                        bb             += ff;
                        cc             -= gg;
                        dd             -= hh;
                        y.style.width  = cc + "em";
                        z.style.width  = cc + "em";
                        y.style.height = dd + "em";
                        x.style.left   = aa + "em";
                        x.style.bottom = bb + "em";
                        if (cc - gg > (minWidth - 0.2)) {
                            setTimeout(dash_minimize_shrinkage_shrink, 1);
                        } else {
                            y.style.display              = "none";
                            x.style.bottom               = "4em";
                            x.style.left                 = w + "em";
                            data.winsettings[f].minimize = "mini";
                            return false;
                        }
                    };
                if (typeof arg.event === "object" && arg.event !== null && typeof arg.event.preventDefault === "function") {
                    arg
                        .event
                        .preventDefault();
                }
                shrink();
                return false;
            };
        k.style.display = "block";
        if (c.innerHTML.length > 200000) {
            step = 1;
        }
        if (d.onmousedown === null) {
            d.onmousedown = function dash_minimize_bindGrab(event) {
                apps.grab(event, d);
            };
        }
        //shrink
        if (arg.button.innerHTML === data.icon.shrink) {
            if (data.loadtest === true) {
                data.minCount += 1;
            } else {
                apps.fixMinCount();
            }
            data.winsettings[f].position.top    = (b.offsetTop / 10);
            data.winsettings[f].position.left   = (b.offsetLeft / 10);
            data.winsettings[f].position.height = (textarea === true)
                ? ((c.clientHeight - 19) / 12) + 3
                : ((c.clientHeight - 19) / 12) - 1.45;
            data.winsettings[f].position.width  = (textarea === true)
                ? ((c.clientWidth - 14) / 12) + 2.5834
                : ((c.clientWidth - 14) / 12) + 0.2;
            g.innerHTML     = data.icon.grow;
            a.style.display = "none";
            b.style.top     = "auto";
            b.style.bottom  = "1em";
            b.style.zIndex  = "5";
            d.style.cursor  = "pointer";
            shrinkage(((19 * data.minCount) + 1), b, c, d);
            if (data.zIndex > data.winLen + 1) {
                data.zIndex    -= data.winLen;
                b.style.zIndex = data.zIndex;
            }
            data.winsettings[f].shape = "minimize";

            //grow
        } else {
            apps.top(b);
            g.innerHTML     = data.icon.shrink;
            a.style.display = "block";
            c.style.display = "block";
            d.style.cursor  = "move";
            b.style.bottom  = "auto";
            if (j > (window.innerHeight / 10) - 6) {
                j = (window.innerHeight / 10) - 8;
            }
            growth(i, j, b);
            data.winsettings[f].minimize = "normal";
            data.winsettings[f].shape    = "normal";
        }
        apps.save(data.winsettings, "winsettings");
        if (typeof arg.event === "object" && arg.event !== null && typeof arg.event.preventDefault === "function") {
            arg
                .event
                .preventDefault();
        }
        return false;
    };
    apps.reset       = function dash_reset() { //delete all saved data and reload the page
        data.winsettings = {
            "main-menu": {
                data    : {
                    name: "",
                    service: "",
                    frequency: ""
                },
                minimize: "normal",
                id      : "main-menu",
                position: {
                    height: 20.5,
                    left  : 10,
                    top   : 10,
                    width : 41.5,
                    zIndex: 1
                },
                shape   : "normal",
                type    : "window"
            }
        };
        apps.save(data.winsettings, "winsettings");
        localStorage.zIndex = "1";
        location.reload();
    };
    apps.resize      = function dash_resize(e, x) { //resize report window to custom width and height on drag
        var parent     = x.parentNode,
            a          = parent.parentNode,
            b          = (function dash_resize_findBody() { //window body
                var aa = a.childNodes,
                    bb = 0;
                for (bb = aa.length - 1; bb > -1; bb -= 1) {
                    if (aa[bb].nodeType === 1 && aa[bb].getAttribute("class") !== null && aa[bb].getAttribute("class").indexOf("window-body") > -1) {
                        return aa[bb];
                    }
                }
                return a.getElementsByTagName("div")[0];
            }()),
            textarea   = (b.nodeName.toLowerCase() === "textarea"),
            textheader = (textarea === true)
                ? 1.25
                : 0,
            c          = a.getElementsByTagName("h2")[0],
            del        = (parent.getElementsByTagName("button")[0].getAttribute("class") === "window-delete"),
            h2diff     = (del === true)
                ? 12
                : 8.75,
            d          = a.getAttribute("id"),
            bx         = b.clientWidth,
            by         = b.clientHeight,
            drop       = function dash_resize_drop() {
                document.onmousemove = null;
                bx                   = b.clientWidth;
                by                   = b.clientHeight;
                document.onmouseup   = null;
                if (textarea === true) {
                    data.winsettings[d].position.width  = (b.clientWidth / 12) + 1.44;
                    data.winsettings[d].position.height = (b.clientHeight / 12) + 1.44;
                } else {
                    data.winsettings[d].position.width  = (b.clientWidth / 12) - 1;
                    data.winsettings[d].position.height = (b.clientHeight / 12) - 3;
                }
                apps.save(data.winsettings, "winsettings");
            },
            boxsize    = function dash_resize_boxsize(f) {
                f                  = f || window.event;
                b.style.width      = ((bx + ((f.clientX + 4) - b.mouseX)) / 12) + "em";
                c.style.width      = (((bx + (f.clientX - b.mouseX)) / 10) - h2diff - textheader) + "em";
                b.style.height     = ((by + ((f.clientY - 18) - b.mouseY)) / 12) + "em";
                document.onmouseup = drop;
            };
        b
            .style
            .removeProperty("max-height");
        apps.top(a);
        e                    = e || window.event;
        b.mouseX             = (textarea === true)
            ? e.clientX - 15
            : e.clientX + 15;
        b.mouseY             = (textarea === true)
            ? e.clientY - 36
            : e.clientY + 20;
        document.onmousemove = boxsize;
        document.onmousedown = null;
    };
    apps.save        = function dash_save(x, name) { // save an object to localStorage
        if (typeof x === "object") {
            localStorage[name] = JSON.stringify(x);
        } else {
            localStorage[name] = String(x);
        }
        if (name === "winsettings") {
            localStorage.zIndex = String(data.zIndex);
        }
    };
    apps.serviceTest = function dash_serviceTest(string, details) { // determine if service is valid
        var args = "";
        string = string.replace(/^(\s+)/, "");
        if ((/^(\https?:\/\/)/).test(string) === true) {
            return "ajax";
        }
        if (string.indexOf("apps.") === 0) {
            string = string.slice(5);
            if (string.indexOf("(") > 0) {
                args   = string.slice(string.indexOf("(") + 1);
                args   = args.replace(/(\)?;?\s*)$/, "");
                string = string.slice(0, string.indexOf("("));
            }
            if (typeof apps[string] === "function") {
                if (details.body.nodeType === 1) {
                    apps[string](args.split(","), details);
                }
                return string;
            }
        }
        return "";
    }
    apps.spawn       = function dash_spawn(type, id) { // creates new artifacts in the DOM
        var win = document.createElement("div"),
            buttons = [],
            inner = [],
            h2    = {},
            display = 10;
        data.winLen += 1;
        inner.push("<h2><span>");
        if (type === "export") {
            inner.push("Import/Export Configuration");
        } else {
            if (type === "terminal") {
                inner.push("Terminal");
            } else if (type === "textpad") {
                inner.push("Textpad");
            } else {
                inner.push("Window");
            }
            inner.push(" ");
            if (data.loadtest === true) {
                inner.push(id.slice(id.indexOf("-") + 1));
            } else {
                inner.push(data.zIndex);
            }
        }
        inner.push("</span></h2>");
        inner.push("<p class=\"buttons\">");
        inner.push("<button class=\"window-delete\" aria-describedby=\"window-delete\">\u20e0</button>");
        inner.push("<button class=\"window-minimize\" aria-describedby=\"window-minimize\">\u25ac</button>");
        inner.push("<button class=\"window-maximize\" aria-describedby=\"window-maximize\">\u25ae</button>");
        inner.push("<button class=\"window-resize\" aria-describedby=\"window-resize\">\u2194</button>");
        inner.push("</p>");
        if (type === "textpad" || type === "terminal") {
            inner.push("<textarea class=\"window-body");
            if (type === "terminal") {
                inner.push(" terminal");
            }
            inner.push("\" style=\"height:20em;width:40em\">\u000d\u000d\u000d</textarea>");
        } else {
            inner.push("<div class=\"window-body\" style=\"height:20em;width:40em\">");
            if (data.loadtest === false && type === "window") {
                inner.push("<div class=\"service-prep\">");
                inner.push("<p><label>Name <input type=\"text\"/></label></p>");
                inner.push("<p><label>Service Endpoint <input type=\"text\"/></label></p>");
                inner.push("<p><label>Frequency in seconds <input type=\"text\"/></label></p>");
                inner.push("<p><button type=\"button\" id=\"getService-");
                inner.push(data.zIndex);
                inner.push("\">Get Service</button></p>");
                inner.push("</div>");
            } else if (type === "export") {
                inner.push("<label>Configuration Data <textarea class=\"config\">");
                inner.push(JSON.stringify(data.winsettings).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
                inner.push("</textarea></label>");
                inner.push("<p><button id=\"config-");
                inner.push(data.zIndex);
                inner.push("\">Save Changes</button></p>");
            }
            inner.push("</div>");
        }
        win.innerHTML    = inner.join("");
        if (type === "window") {
            (function dash_spawn_servicePrep() {
                var a = 0,
                    id = "";
                inner = win.getElementsByTagName("button");
                a = inner.length - 1;
                do {
                    id = inner[a].getAttribute("id");
                    if (id !== null && id.indexOf("getService") === 0) {
                        inner[a].onclick = function dash_spawn_servicePrep_event() {
                            apps.getService(win);
                        };
                    }
                    if (inner[a].parentNode.getAttribute("class") === "buttons") {
                        break;
                    }
                    a -= 1;
                } while (a > 0);
            }());
        } else if (type === "export") {
            (function dash_spawn_servicePrep() {
                var a = 0,
                    id = "";
                inner = win.getElementsByTagName("button");
                a = inner.length - 1;
                do {
                    id = inner[a].getAttribute("id");
                    if (id !== null && id.indexOf("config-") === 0) {
                        inner[a].onclick = function dash_spawn_servicePrep_event() {
                            apps.changeConfig(win.getElementsByTagName("textarea")[0].value);
                        };
                    }
                    if (inner[a].parentNode.getAttribute("class") === "buttons") {
                        break;
                    }
                    a -= 1;
                } while (a > 0);
            }());
        }
        win.setAttribute("class", "window");
        if (data.loadtest === true) {
            win.setAttribute("id", id);
            win.style.zIndex = data.winsettings[id].position.zIndex;
            win.style.left   = data.winsettings[id].position.left + "em";
            win.style.top    = data.winsettings[id].position.top + "em";
            if (type === "textpad" || type === "terminal") {
                h2 = win.getElementsByTagName("textarea")[0];
            } else {
                h2 = win.getElementsByTagName("div")[0];
            }
            h2.style.width = data.winsettings[id].position.width + "em";
            h2.style.height = data.winsettings[id].position.height + "em";
        } else {
            display += data.zIndex;
            win.setAttribute("id", "window-" + data.zIndex);
            win.style.zIndex = data.zIndex;
            win.style.left   = (10 + data.winLen) + "em";
            win.style.top    = (10 + data.winLen) + "em";
            data.winsettings["window-" + data.zIndex] = {
                data    : {
                    name: "",
                    service: "",
                    frequency: ""
                },
                minimize: "normal",
                id      : "window-" + data.zIndex,
                position: {
                    height: 20,
                    left  : 10 + data.winLen,
                    top   : 10 + data.winLen,
                    width : 40,
                    zIndex: data.zIndex
                },
                shape   : "normal",
                type    : type,
                value   : ""
            };
        }
        data.windows.push(win);
        h2 = win.getElementsByTagName("h2")[0];
        h2.onmousedown = function dash_spawn_bindGrab(e) {
            apps.grab(e, h2);
        };
        buttons = win.getElementsByTagName("button");
        (function dash_spawn_buttons() {
            var a = 0,
                len = buttons.length,
                classy = "";
            for (a = 0; a < len; a += 1) {
                classy = buttons[a].getAttribute("class");
                if (classy === "window-delete") {
                    buttons[a].onclick = function dash_spawn_buttons_delete(e) {
                        apps.delete(this);
                    }
                } else if (classy === "window-minimize") {
                    buttons[a].onclick = function dash_spawn_buttons_minimize(e) {
                        apps.minimize({
                            button: this,
                            event : e
                        });
                    }
                } else if (classy === "window-maximize") {
                    buttons[a].onclick = function dash_spawn_buttons_maximize(e) {
                        apps.maximize(this);
                    }
                } else if (classy === "window-resize") {
                    buttons[a].onmousedown = function dash_spawn_buttons_resize(e) {
                        apps.resize(e, this);
                    }
                }
            }
        }());
        data.body.appendChild(win);
        apps.top(win);
        win.onclick = function () {
            apps.top(win);
        };
        h2.style.width = ((win.clientWidth - 140) / 10) + "em";
        if (data.loadtest === true) {
            if (data.winsettings[id].data.name !== "" && isNaN(data.winsettings[id].data.frequency) === false && apps.serviceTest(data.winsettings[id].data.service, {}) !== "") {
                apps.getService(win);
            }
        } else {
            apps.save(data.winsettings, "winsettings");
        }
    };
    apps.tags        = function dash_tags(x, y, z, event) { // getElementsByTagName utility
        // * x = ancestor node
        // * y = tag name
        // * z = qualifier
        // * event = event to bind
        var a    = [],
            e    = false,
            f    = false,
            exec = function dash_tags_exec(cond1, cond2) {
                var b    = [],
                    c    = a.length,
                    d    = 0,
                    node = "";
                for (d = 0; d < c; d += 1) {
                    if (f === false) {
                        if (cond1 === "class") {
                            node = a[d].getAttribute("class");
                        }
                        if (cond1 === "parent") {
                            node = a[d]
                                .parentNode
                                .nodeName
                                .toLowerCase();
                        }
                    }
                    if (f === true || node === cond2) {
                        if (e === false) {
                            if (event[0] === "") {
                                event[1](a[d]);
                            }
                            if (event[0] === "onclick") {
                                a[d].onclick = event[1];
                            }
                            if (event[0] === "onkeyup") {
                                a[d].onkeyup = event[1];
                            }
                            if (event[0] === "onkeydown") {
                                a[d].onkeydown = event[1];
                            }
                        }
                        b.push(a[d]);
                    }
                }
                return b;
            };
        if (document.getElementsByTagName === undefined || y === undefined) {
            return [];
        }
        if (z === undefined || typeof z !== "object" || z.length === undefined || z.length !== 2 || (z[0] !== "class" && z[0] !== "parent")) {
            f = true;
        }
        if (event === undefined || typeof event !== "object" || event.length === undefined || event.length !== 2 || (event[0] !== "" && event[0] !== "onclick" && event[0] !== "onkeyup")) {
            e = true;
        }
        if (x === undefined || x === "") {
            x = document;
        }
        a = x.getElementsByTagName(y);
        if (f === true) {
            return exec();
        }
        if (z[0] === "class") {
            return exec(z[0], z[1]);
        }
        if (z[0] === "parent") {
            return exec(z[0], z[1].toLowerCase());
        }
    };
    apps.top         = function dash_top(x) { //intelligently raise the z-index of the windows
        var a = data.zIndex,
            b = a + 1,
            c = 0,
            d = b;
        if (data.loadtest === true || x.parentNode === null || (data.spawn === true && x === apps.id("main-menu"))) {
            data.spawn = false;
            return;
        }
        for (c = data.winLen; c > -1; c -= 1) {
            b = Number(data.windows[c].style.zIndex);
            if (b > d) {
                d = b;
            }
        }
        data.zIndex    = d;
        x.style.zIndex = d;
        data.winsettings[x.getAttribute("id")].position.zIndex = d;
        apps.save(data.winsettings, "winsettings");
    };
    (function dash_load() {
        var a        = document.getElementsByTagName("button"),
            b        = 0,
            minimize = function dash_load_minimize(e, x) {
                apps.minimize({
                    button: this,
                    event : e,
                    step  : x
                });
            },
            maximize = function dash_load_maximize() {
                apps.maximize(this);
            },
            resize   = function dash_load_resize(event) {
                apps.resize(event, this);
            };
        if (localStorage.zIndex !== undefined) {
            data.zIndex = Number(localStorage.zIndex);
        }
        data.body.style.backgroundSize  = "100% " + window.innerHeight + "px";
        //data.body.style.backgroundImage = "url(\"images/" + Math.round(Math.random() * 10) + ".jpg\")";
        window.onresize                 = function dash_load_resize() {
            data.body.style.backgroundSize = "100% " + window.innerHeight + "px";
        };
        if (apps.id("spawn-window") !== null) {
            apps.id("spawn-window").onclick = function dash_load_spawnWindow() {
                var node = apps.spawn("window", "");
                data.spawn = true;
            };
        }
        if (apps.id("spawn-textpad") !== null) {
            apps.id("spawn-textpad").onclick = function dash_load_spawnTextpad() {
                var node = apps.spawn("textpad", "");
                data.spawn = true;
            };
        }
        if (apps.id("spawn-terminal") !== null) {
            apps.id("spawn-terminal").onclick = function dash_load_spawnTerminal() {
                var node = apps.spawn("terminal", "");
                data.spawn = true;
            };
        }
        if (apps.id("spawn-export") !== null) {
            apps.id("spawn-export").onclick = function dash_load_spawnExport() {
                var node = apps.spawn("export", "");
                data.spawn = true;
            };
        }
        for (b = a.length - 1; b > -1; b -= 1) {
            if (a[b].getAttribute("class") === "window-minimize") {
                a[b].onclick = minimize;
            }
            if (a[b].getAttribute("class") === "window-maximize") {
                a[b].onclick = maximize;
            }
            if (a[b].getAttribute("class") === "window-resize") {
                a[b].onmousedown = resize;
            }
        }
        /*data.textBody.onkeyup   = function dash_load_textpadBind() {
            localStorage.textpad = data.textBody.value;
        };
        data.textBody.onkeydown = function dash_load_fixtabs(e) {
            var start = "",
                end   = "",
                val   = "",
                sel   = 0,
                event = e || window.event,
                that  = this;
            if (typeof event !== "object" || event.type !== "keydown" || event.keyCode !== 9 || typeof that.selectionStart !== "number" || typeof that.selectionEnd !== "number") {
                return true;
            }
            val                 = that.value;
            sel                 = that.selectionStart;
            start               = val.substring(0, sel);
            end                 = val.substring(sel, val.length);
            that.value          = start + "\t" + end;
            that.selectionStart = sel + 1;
            that.selectionEnd   = sel + 1;
            return false;
        };
        */
        if (localStorage.winsettings !== undefined) {
            data.winsettings = JSON.parse(localStorage.winsettings);
        }
        data.windows = apps.tags("", "div", [
            "class",
            "window"
        ], [
            "",
            function dash_load_windows(self) {
                var aa = self.getAttribute("id"),
                    bb = {};
                if (data.winsettings[aa] === undefined) {
                    data.winsettings[aa]          = {};
                    data.winsettings[aa].position = {};
                }
                if (data.winsettings[aa].shape === undefined || data.winsettings[aa].minimize === undefined) {
                    if ((self.offsetLeft - 10) % 190 === 0 && self.getElementsByTagName("h2")[0].clientWidth === 175) {
                        data.winsettings[aa].shape    = "minimized";
                        data.winsettings[aa].minimize = "mini";
                    }
                }
                bb = self.lastChild;
                if (bb.nodeType !== 1 || bb.getAttribute("class") !== "window-body") {
                    do {
                        bb = bb.previousSibling;
                    } while (bb !== self.firstChild && (bb.nodeType > 1 && bb.getAttribute("class") !== "window-body"));
                    bb.onclick = function dash_load_windows_bindTop() {
                        apps.top(self);
                    };
                }
                self.getElementsByTagName("h2")[0].onmousedown = function dash_load_windows_bindGrab(e) {
                    apps.grab(e, self.getElementsByTagName("h2")[0]);
                };
            }
        ]);
        data.winLen  = data.windows.length - 1;
        apps
            .id("master-reset")
            .onclick = apps.reset;
        if (localStorage.winsettings !== undefined) {
            (function dash_load_winsettings() {
                var aa = [],
                    bb = 0,
                    cc = [],
                    d  = [],
                    e  = [],
                    f  = {},
                    g  = [],
                    h  = 0;
                data.winsettings = JSON.parse(localStorage.winsettings);
                aa = Object.keys(data.winsettings);
                for (bb = aa.length - 1; bb > -1; bb -= 1) {
                    if (aa[bb] === "main-menu") {
                        apps.id("main-menu").getElementsByTagName("h2")[0].style.width = ((apps.id("main-menu").getElementsByTagName("div")[0].clientWidth - 105) / 10) + "em";
                        if (data.winsettings[aa[bb]].shape === "minimize") {
                            apps.id(data.winsettings[aa[bb]].id).getElementsByTagName("button")[0].click();
                        }
                    } else {
                        apps.spawn(data.winsettings[aa[bb]].type, data.winsettings[aa[bb]].id);
                        if (data.winsettings[aa[bb]].shape === "minimize") {
                            apps.id(data.winsettings[aa[bb]].id).getElementsByTagName("button")[1].click();
                        }
                    }
                }
                for (bb = aa.length - 1; bb > -1; bb -= 1) {
                    if (aa[bb].nodeType === 1 && aa[bb].getAttribute("class") === "window") {
                        cc.push(aa[bb]);
                        d.push(aa[bb].getAttribute("id"));
                        g.push(aa[bb].getElementsByTagName("h2")[0]);
                        f = aa[bb].lastChild;
                        if (f.nodeType !== 1 || f.getAttribute("class") !== "window-body") {
                            do {
                                f = f.previousSibling;
                            } while (f !== aa[bb].firstChild && f.nodeType !== 1 && f.getAttribute("class") !== "window-body");
                            if (f.nodeType === 1 && f.getAttribute("class") === "window-body") {
                                e.push(f);
                            }
                        }
                    }
                }
                for (bb = cc.length - 1; bb > -1; bb -= 1) {
                    if (e[bb].parentNode === cc[bb] && d[bb] !== null && data.winsettings[d[bb]] !== undefined) {
                        if (data.winsettings[d[bb]].position.zIndex !== undefined && isNaN(data.winsettings[d[bb]].position.zIndex) === false) {
                            cc[bb].style.zIndex = data.winsettings[d[bb]].position.zIndex;
                            if (Number(data.winsettings[d[bb]].position.zIndex) > Number(data.zIndex)) {
                                data.zIndex = data.winsettings[d[bb]].position.zIndex;
                            }
                        }
                        if (data.winsettings[d[bb]].shape === undefined || data.winsettings[d[bb]].shape === "normal") {
                            if (isNaN(data.winsettings[d[bb]].position.top) === false) {
                                cc[bb].style.top = data.winsettings[d[bb]].position.top + "em";
                            }
                            if (isNaN(data.winsettings[d[bb]].position.left) === false) {
                                cc[bb].style.left = data.winsettings[d[bb]].position.left + "em";
                            }
                            if (isNaN(data.winsettings[d[bb]].position.width) === false) {
                                e[bb].style.width = data.winsettings[d[bb]].position.width + "em";
                            }
                            if (isNaN(data.winsettings[d[bb]].position.height) === false) {
                                e[bb].style.height = data.winsettings[d[bb]].position.height + "em";
                            }
                            if (e[bb].style.display === "none") {
                                f = cc[bb]
                                    .getElementsByTagName("p")[0]
                                    .getElementsByTagName("button")[0];
                                if (f.getAttribute("class") === "window-minimize") {
                                    apps.minimize({
                                        button: f,
                                        event : f.onclick,
                                        step  : 1
                                    });
                                }
                            } else {
                                g[bb].style.width = ((e[bb].clientWidth / 10) - (8.25 + h)) + "em";
                            }
                        } else if (data.winsettings[d[bb]].shape === "minimize") {
                            f = cc[bb]
                                .getElementsByTagName("p")[0]
                                .getElementsByTagName("button")[0];
                            if (f.parentNode.nodeName.toLowerCase() === "a") {
                                f = cc[bb]
                                    .getElementsByTagName("p")[0]
                                    .getElementsByTagName("button")[1];
                            }
                            if (f.nodeType !== 1 || f.getAttribute("class") !== "window-minimize") {
                                do {
                                    f = f.nextSibling;
                                } while (f !== f.parentNode.lastChild && (f.nodeType > 1 || f.getAttribute("class") !== "window-minimize"));
                            }
                            if (f.getAttribute("class") === "window-minimize") {
                                if (data.winsettings[d[bb]].minimize === "normal") {
                                    h = 0;
                                } else {
                                    apps.minimize({
                                        button: f,
                                        event : f.onclick,
                                        step  : 1
                                    });
                                }
                            }
                        } else if (data.winsettings[d[bb]].shape === "maximize") {
                            f = cc[bb]
                                .getElementsByTagName("p")[0]
                                .getElementsByTagName("button")[0];
                            if (f.parentNode.nodeName.toLowerCase() === "a") {
                                f = cc[bb]
                                    .getElementsByTagName("p")[0]
                                    .getElementsByTagName("button")[1];
                            }
                            if (f.nodeType !== 1 || f.getAttribute("class") !== "window-maximize") {
                                do {
                                    f = f.nextSibling;
                                } while (f !== f.parentNode.lastChild && (f.nodeType > 1 || f.getAttribute("class") !== "window-maximize"));
                            }
                            if (f.getAttribute("class") === "window-maximize") {
                                f.click();
                            }
                            g[bb].style.width = ((e[bb].clientWidth / 10) - (8.25 + h)) + "em";
                        }
                    } else {
                        cc.pop();
                        d.pop();
                        if (e[bb].parentNode === cc[bb]) {
                            e.pop();
                        }
                    }
                    cc.pop();
                    d.pop();
                    e.pop();
                }
            }());
            apps.save(data.winsettings, "winsettings");
        }
        if (localStorage.textpad !== undefined) {
            (function dash_load_textpad() {
                var space  = "\n\n\n",
                    stored = localStorage.textpad;
                if (stored.indexOf(space) !== 0) {
                    data.textBody.value = space + localStorage.textpad;
                } else {
                    data.textBody.value = localStorage.textpad;
                }
            }());
        }
        (function () {
            var main     = document.getElementById("main-menu"),
                body     = main.getElementsByTagName("div")[0],
                settings = data.winsettings["main-menu"].position;
            main.style.left = settings.left + "em";
            main.style.top = settings.top + "em";
            body.style.height = settings.height + "em";
            body.style.width = settings.width + "em";
        }());
        // loadtest is just a flag to prevent execution of apps.top, due to button
        // fires, during page load. restoring minimized/maximized state indirectly calls
        // apps.top which disrupts the saved zIndex state of the windows
        data.loadtest = false;
    }());
}());
