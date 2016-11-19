(function srv() {
    "use strict";
    var node = {
            fs   : require("fs"),
            http : require("http"),
            https: require("https"),
            mime : require("./mime.js"),
            path : require("path")
        },
        flag = {
            cert: false,
            key : false
        },
        cert = "",
        key  = "",
        merge = function srv_merge(array) {
            if ((/[\u0002-\u0008]|[\u000e-\u001f]/).test(array[0]) === true) {
                return Buffer.concat(array);
            }
            return array.join("");
        },
        error = function srv_error(err, name) {
            var stack = new Error().stack;
            console.log("\u001b[36mFunction:\u001b[39m " + name);
            console.log("\u001b[31mError:\u001b[39m " + err);
            console.log("");
            console.log(stack);
            process.exit(1);
        },
        request = {
            secure: function srv_req_secure(x, callback) {
                node.https.get(x, function srv_req_secure_request(res) {
                    var datapackage = [],
                        errorstate  = false;
                    res.on("data", function srv_req_secure_request_data(chunk) {
                        datapackage.push(chunk);
                    });
                    res.on("error", function srv_req_secure_request_error(err) {
                        errorstate = true;
                        return error(err, "srv_req_secure_request_error");
                    });
                    if (errorstate === true) {
                        return;
                    }
                    res.on("end", function srv_req_secure_request_end() {
                        callback(merge(datapackage));
                    });
                });
            },
            http  : function srv_req_http(x, callback) {
                node.http.get(x, function srv_req_http_request(res) {
                    var datapackage = [],
                        errorstate  = false;
                    res.on("data", function srv_req_http_request_data(chunk) {
                        datapackage.push(chunk);
                    });
                    res.on("error", function srv_req_http_request_error(err) {
                        errorstate = true;
                        return error(err, "srv_req_http_request_error");
                    });
                    if (errorstate === true) {
                        return;
                    }
                    res.on("end", function srv_req_http_request_end() {
                        callback(merge(datapackage));
                    });
                });
            }
        },
        server = {
            secure: function srv_serverSecure() {
                node.https.createServer({
                    cert: cert,
                    key : key
                }, function srv_serverSecure_callback(req, res) {
                    var url        = req.url,
                        readStream = {},
                        filedata   = [],
                        errorflag  = false,
                        proxyflag  = false;
                    if (url.charAt(0) === "/") {
                        url = url.slice(1);
                    }
                    if (url === "") {
                        url = "index.html";
                    }
                    if (url.indexOf("?address=") > -1) {
                        proxyflag = true;
                        url = url.split("?address=")[1];
                    }
                    res.setHeader("Content-Type", node.mime.lookup(url));
                    res.writeHead(200);
                    if (proxyflag === true) {
                        if (url.indexOf("https") === 0) {
                            request.secure(url, function srv_serverHttp_createServer_unsecure_secureProxyrequest(response) {
                                console.log(response.length + " " + url);
                                res.end(response);
                            });
                        } else {
                            request.http(url, function srv_serverHttp_createServer_unsecure_httpProxyrequest(response) {
                                console.log(response.length + " " + url);
                                res.end(response);
                            });
                        }
                    } else {
                        readStream = node.fs.createReadStream(url);
                        readStream.on("error", function srv_serverSecure_callback_readError(error) {
                            errorflag = true;
                            console.log(error);
                        });
                        if (errorflag === true) {
                            return;
                        }
                        readStream.on("data", function srv_serverSecure_callback_ondata(chunk) {
                            filedata.push(chunk);
                        });
                        readStream.once("end", function srv_serverSecure_callback_readEnd() {
                            var page = merge(filedata);
                            console.log(url + " " + page.length);
                            res.end(page);
                        });
                    }
                }).listen(9001);
            },
            http  : function srv_serverHttp() {
                var server = node.http.createServer(function srv_serverHttp_createServer_unsecure(req, res) {
                    var url        = req.url,
                        readStream = {},
                        filedata   = [],
                        errorflag  = false,
                        proxyflag  = false;
                    if (url.charAt(0) === "/") {
                        url = url.slice(1);
                    }
                    if (url === "") {
                        url = "index.html";
                    }
                    if (url.indexOf("?address=") > -1) {
                        proxyflag = true;
                        url = url.split("?address=")[1];
                    }
                    res.setHeader("Content-Type", node.mime.lookup(url));
                    res.writeHead(200);
                    if (proxyflag === true) {
                        if (url.indexOf("https") === 0) {
                            request.secure(url, function srv_serverHttp_createServer_unsecure_secureProxyrequest(response) {
                                console.log(response.length + " " + url);
                                res.end(response);
                            });
                        } else {
                            request.http(url, function srv_serverHttp_createServer_unsecure_httpProxyrequest(response) {
                                console.log(response.length + " " + url);
                                res.end(response);
                            });
                        }
                    } else {
                        readStream = node.fs.createReadStream(url);
                        readStream.on("error", function srv_serverHttp_createServer_readError(error) {
                            errorflag = true;
                            console.log(error);
                        });
                        if (errorflag === true) {
                            return;
                        }
                        readStream.on("data", function srv_serverHttp_createServer_ondata(chunk) {
                            filedata.push(chunk);
                        });
                        readStream.once("end", function srv_serverHttp_createServer_readEnd() {
                            var page = merge(filedata);
                            console.log(url + " " + page.length);
                            res.end(page);
                        });
                    }
                });
                server.on('clientError', function srv_serverHttp_unsecureError(err, socket) {
                    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                });
                server.listen(9000);
            }
        };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    server.http();
    node.fs.readFile("tls" + node.path.sep + "localhost.crt", function srv_readCert(err, filedata) {
        if (err !== null && err !== undefined) {
            return error(err, "srv_readCert");
        }
        cert = filedata;
        flag.cert = true;
        if (flag.key === true) {
            server.secure();
        }
    });
    node.fs.readFile("tls" + node.path.sep + "localhost.key", function srv_readKey(err, filedata) {
        if (err !== null && err !== undefined) {
            return error(err, "srv_readKey");
        }
        key = filedata;
        flag.key = true;
        if (flag.cert === true) {
            server.secure();
        }
    });
}());
