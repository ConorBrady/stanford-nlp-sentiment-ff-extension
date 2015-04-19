
var host = "stanford-nlp.conorbrady.com";

String.prototype.getSentanceMarkers = function() {

    var delim = /([.?!])\s*(?=[A-Z]|<)/g;
    var lookbehind = /(?:\w\.\w)|(?:[A-Z][a-z])/g; // e.g. Mr Dr etc.

    var matches = Array();
    matches.push(0);
    while ((match = delim.exec(this)) != null) {
        if (this.substring(match.index-2, match.index).match(lookbehind) === null) {
            matches.push(match.index+1);
        }
    }
    matches.push(this.length)
    return matches
}

console.log("Content script started...");

var paras = Array();

Array.forEach($('article p, [class*=content] p, [class*=article] p, [id*=content] p, [id*=article] p, .body p, p.tweet-text'),function(e) {
    if( e.querySelectorAll('p,script,textarea').length == 0 ) {
        paras.push(e)
    }
});

function getRGB(sentiment) {
    var red   = Math.floor(
        Math.max(0, -510 * sentiment + 255))
        .toString(16);

    var green = Math.floor(
        Math.max(0,  510 * sentiment - 255))
        .toString(16);

    return '#' + ( red.length == 2 ? red   : "0" + red )
             + ( green.length == 2 ? green : "0" + green ) + '00';
}

var BUCKET_COUNT = 11;

var sentimentBuckets = new Array(BUCKET_COUNT);

for(var i = 0; i < BUCKET_COUNT; i++) {
    sentimentBuckets[i] = {
        y: 0,
        color: getRGB(i/BUCKET_COUNT)
    }
}


var chartShown = false;

function updateChart() {
    if (chartShown === false) {

        $("body").append("<div id='sentiment-chart' style='position:fixed; bottom: 0; right: 0; width: 350px; height: 200px; background-color: transparent; opacity: 0.9; z-index: 100000000000000;'></div>");

        $('#sentiment-chart').highcharts({
            chart: {
                type: 'column',
            },
            xAxis: {

                labels: {
                    enabled: false
                }
            },
            yAxis: {
                labels: {
                    enabled: false
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                data: sentimentBuckets
            }],
            title: "Page Sentiment"
        });
        chartShown = true;
    }
    $('#sentiment-chart').highcharts().series[0].setData(sentimentBuckets);
};

function doParagraph(paragraphs, index) {

    var para = paragraphs[index]
    if( para != undefined && para.innerHTML.length > 50 ) {
        var markers = para.innerHTML.getSentanceMarkers();

        var sendingTokens = Array();
        var illAllowIt = false;

        for (var i = 0; i < markers.length-1; i++) {

            var token = para.innerHTML
                .substring(markers[i],markers[i+1])
                .replace(/(<[^>]*>|\n)/g, "")
                .replace(/&nbsp;/g, " ")
                .trim();

            sendingTokens.push(token);
            if(token !== "") {
                illAllowIt = true;
            }

        }
        if(illAllowIt) {

            var xmlhttp = new XMLHttpRequest();

            var url = location.protocol + "//"+host+"/sentiment?" + sendingTokens.map( function(token) {
                return "lines="+encodeURI(token);
            }).join("&") + ( sendingTokens.length < 2 ? "&lines=": "" );

            xmlhttp.open( "GET", url, true );

            xmlhttp.onreadystatechange = function() {

                if (xmlhttp.readyState==4) {

                    if( xmlhttp.status==200) {

                        var response = JSON.parse(xmlhttp.response);

                        if(response[0] !== undefined) {

                            var replacement = "";

                            for (var i = 0; i < markers.length-1; i++) {

                                if( response[i].sentiment != undefined ) {

                                    sentimentBuckets[Math.floor(response[i].sentiment*BUCKET_COUNT)].y += 1;

                                    updateChart();

                                    replacement += '<span style=\'color:'
                                            + getRGB(response[i].sentiment) + '\'>'
                                            + para.innerHTML
                                                .substring(markers[i],markers[i+1])
                                            + '</span>';
                                } else {
                                    replacement += para.innerHTML
                                        .substring(markers[i],markers[i+1]);
                                }
                            }

                            para.innerHTML = replacement
                        }

                        if(paragraphs.length > index+1) {
                            doParagraph(paragraphs,index+1);
                        }
                    } else {
                        doParagraph(paragraphs,index);
                    }
                }
            }
            xmlhttp.send();
        } else if(paragraphs.length > index+1) {
            doParagraph(paragraphs,index+1);
        }
    } else if(paragraphs.length > index+1) {
        doParagraph(paragraphs,index+1);
    }
}

doParagraph(paras,0);
