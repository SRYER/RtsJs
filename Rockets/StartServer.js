﻿/*!
* RtsJs
* Copyright(c) 2012 Stephan Ryer <stephanryer@hotmail.com>
* MIT Licensed
*/

// Provide the necesary ressources (Just an ugly hack to make things run)
var fs = require('fs');
var multiroomHtml = fs.readFileSync(__dirname + '/multiroom.html');
var multiplayerHtml = fs.readFileSync(__dirname + '/multiplayer.html');
var singleplayerHtml = fs.readFileSync(__dirname + '/singleplayer.html');
var replayHtml = fs.readFileSync(__dirname + '/replay.html');
var rtsClientHtml = fs.readFileSync(__dirname + '/../RtsJs/rtsClient.js');
var gameLogicHtml = fs.readFileSync(__dirname + '/rockets-logic.js');
var gameUiHtml = fs.readFileSync(__dirname + '/rockets-ui.js');
var httpServer = require('http').createServer(function (req, res) {
    if (req.url.toLowerCase().indexOf("multiroom.html") > 0) {
        res.end(multiroomHtml);
    } else if (req.url.toLowerCase().indexOf("multiplayer.html") > 0) {
        res.end(multiplayerHtml);
    } else if (req.url.toLowerCase().indexOf("singleplayer.html") > 0) {
        res.end(singleplayerHtml);
    } else if (req.url.toLowerCase().indexOf("replay.html") > 0) {
        res.end(replayHtml);
    } else if (req.url.toLowerCase().indexOf("rtsclient.js") > 0) {
        res.end(rtsClientHtml);
    } else if (req.url.toLowerCase().indexOf("rockets-logic.js") > 0) {
        res.end(gameLogicHtml);
    } else if (req.url.toLowerCase().indexOf("rockets-ui.js") > 0) {
        res.end(gameUiHtml);
    } else {
        res.end("No such file: " + req.url.toLowerCase());
    }
});
// End of ugly hack

var rtsServer = require("../RtsJs").createServer(httpServer);
httpServer.listen(8080);
rtsServer.init();
