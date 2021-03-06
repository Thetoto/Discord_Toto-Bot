const https = require("https");
var giphy = require('giphy-api')(process.env.GIPHY_API);
var request = require('request');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

const embed = require('./embed');

module.exports.reverseSearch = function (channel, url) {
    var options = {
        url: "https://mrisa-app.herokuapp.com/search",
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            "image_url": url,
            "resized_images": false // Or true
        }
    };

    request(options, (_err, _res, body) => {
        channel.send(embed.makeReverse(body));
    })
}

module.exports.ytSub = function (channel, string) {
    try {
        let ytChannel;
        youtube.searchChannels(string, 1).then(results => {
            ytChannel = results[0];
            console.log(results[0]);
            if (!ytChannel) { channel.send("Je ne trouve pas cette chaîne."); return; }
            youtube.getChannel('https://www.youtube.com/channel/' + ytChannel.id, { part: "statistics" })
                .then(results => {
                    let name = ytChannel.raw.snippet.channelTitle;
                    let img = ytChannel.raw.snippet.thumbnails.high;
                    let desc = ytChannel.raw.snippet.description;
                    let view = results.raw.statistics.viewCount;
                    let date = new Date(ytChannel.raw.snippet.publishedAt);
                    let sub;
                    if (!results.raw.statistics.hiddenSubscriberCount) {
                        sub = results.raw.statistics.subscriberCount;
                    } else {
                        sub = -1;
                    }
                    channel.send(embed.makeYT(sub, view, date, name, desc, img, ytChannel.id)).then().catch(console.error);
                    console.log(results);
                })
        }).catch(console.log);

    } catch (error) {
        console.error(error);
        channel.send("Je ne trouve pas cette chaîne. (Erreur inconnue)");
    }
}

module.exports.qwantSearch = function (channel, string) {
    channel.send('Cette fonction est cassée.');
}

module.exports.giphySearch = function (channel, string) {
    var i = Math.floor(Math.random() * 10);
    giphy.search({
        q: string,
        limit: '1',
        offset: i
    }, function (err, res) {
        if (res.data[0] == undefined) {
            channel.send("J'ai rien trouvé :c");
            console.log("Nothing.");
        } else {
            channel.send(embed.makeGiphy(res.data[0].images.downsized_large.url));
        }
    });

}

module.exports.giphyRandom = function (channel, string) {
    giphy.random({
        tag: string,
        limit: '1'
    }, function (err, res) {
        if (res.data.image_original_url == undefined) {
            console.log("giphy : nothing found, switch to search\n" + JSON.stringify(res));
            giphySearch(channel, string);
        } else {
            channel.send(embed.makeGiphy(res.data.fixed_height_downsampled_url));
        }
    });

}

module.exports.randomWiki = function (channel) {
    var url = 'https://fr.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&format=json';
    var title;
    var id;
    https.get(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var fbResponse = JSON.parse(body);
            //console.log("First : " + body);
            for (var obj in fbResponse["query"]["pages"]) {
                if (fbResponse["query"]["pages"][obj].title != undefined) {
                    title = fbResponse["query"]["pages"][obj].title;
                    id = fbResponse["query"]["pages"][obj].pageid;
                    break;
                }
            }

            url = "https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + title.replace(' ', '_');
            https.get(url, function (res) {
                var body = '';

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function () {
                    var fbResponse = JSON.parse(body);
                    //console.log("Second : " + body);
                    var contentt;
                    for (var obj in fbResponse["query"]["pages"]) {
                        if (fbResponse["query"]["pages"][obj].title != undefined) {
                            contentt = fbResponse["query"]["pages"][obj].extract;

                            break;
                        }
                    }
                    if (contentt == undefined) {
                        channel.send(embed.makeWiki(title, "_Pas de résumé_", id));
                    } else {
                        channel.send(embed.makeWiki(title, contentt, id));
                    }

                });
            }).on('error', function (e) {
                channel.send("Got an error" + e);
            });

        });
    }).on('error', function (e) {
        channel.send("Got an error: " + e);
    });
}

module.exports.searchWiki = function (channel, string) {
    var url = 'https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + string + '&format=json';
    var title;
    https.get(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var fbResponse = JSON.parse(body);
            //console.log("First : " + body);
            if (fbResponse.query.search[0] == undefined) {
                channel.send("Rien trouvé... :c");
                return;
            }
            title = fbResponse.query.search[0].title;
            id = fbResponse.query.search[0].pageid;

            url = "https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + title.replace(' ', '_');
            https.get(url, function (res) {
                var body = '';

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function () {
                    var fbResponse = JSON.parse(body);
                    //console.log("Second : " + body);
                    var contentt;
                    for (var obj in fbResponse["query"]["pages"]) {
                        if (fbResponse["query"]["pages"][obj].title != undefined) {
                            contentt = fbResponse["query"]["pages"][obj].extract;

                            break;
                        }
                    }
                    if (contentt == undefined || contentt == "" || contentt == " ") {
                        channel.send(embed.makeWiki(title, "_Pas de résumé_", id));
                    } else {
                        channel.send(embed.makeWiki(title, contentt, id));
                    }

                });
            }).on('error', function (e) {
                channel.send("Got an error" + e);
            });

        });
    }).on('error', function (e) {
        channel.send("Got an error: " + e);
    });
}
