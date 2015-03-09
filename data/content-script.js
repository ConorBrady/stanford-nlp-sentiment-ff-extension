
String.prototype.getSentanceMarkers = function() {
    var delim = /((?:(?!Dr)|(?!Mr)|(?!Mrs)|(?!Ms))[\.?!](?:(<|([ ]+[^a-z]))))/g;
    var matches = Array();
    matches.push(0);
    while ((match = delim.exec(this)) != null) {
        matches.push(match.index+1);
    }
    matches.push(this.length)
    return matches
}

console.log("Content script started...");

var paras = Array();

Array.forEach(document.querySelectorAll('p'),function(e) {
    if( e.querySelectorAll('p,script,textarea').length == 0 ) {
        paras.push(e)
    }
})

// remove citations

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

            var url = location.protocol + "//stanford-nlp.conorbrady.com:8080/sentiment?" + sendingTokens.map( function(token) {
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

                                    var red   = Math.floor(
                                        Math.max(0, -510 * response[i].sentiment + 255))
                                        .toString(16);

                                    var green = Math.floor(
                                        Math.max(0,  510 * response[i].sentiment - 255))
                                        .toString(16);

                                    replacement += '<span style=\'color:#'
                                            + ( red.length == 2 ? red : "0"+red )
                                            + ( green.length == 2 ? green : "0"+green )
                                            + '00\'>'
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
