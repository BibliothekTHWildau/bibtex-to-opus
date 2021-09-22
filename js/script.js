let builder = require("xmlbuilder");

let language = "eng"; // default set language

document.getElementById("dropdown").onchange = function () {
    language = this.value;
}

// Required to make this module visible  to the global javascript window. When browserifying, this cmd has to be typed in:
// browserify script.js --s module > bundle.js . module is an arbitrary name, has not to be module. In the outside javascript
// module is now accesible, (siehe index.html), functions inside the module.exports objects are accesible. 
module.exports = {
    onEnterPressed: function (event) {
        let input = document.getElementById("bibtexInput");
        if (event.code === "Enter" || event.type == "click") {
            if (input.value.trim() != "") {
                let parser = new BibLatexParser(input.value, { processUnexpected: true, processUnknown: true });
                let json = parser.parse();
                input.value = "";
                let result = processToXML(json);
                validateXML(result);
            } else {
                let bibtexFile = document.getElementById("bibtexFile").files[0];
                let reader = new FileReader();
                reader.onload = function (evt) {
                    if (evt.target.readyState != 2) return;
                    if (evt.target.error) {
                        alert('Error while reading file');
                        return;
                    }

                    let parser = new BibLatexParser(evt.target.result, { processUnexpected: true, processUnknown: true });
                    let json = parser.parse();
                    input.value = "";
                    let result = processToXML(json);
                    validateXML(result);
                }
                reader.readAsText(bibtexFile);
            }
        }
    }
}

async function validateXML(resultObj){
    let data = await fetch("https://publister.th-wildau.de/bibliothek/opus/validate.php",{
        method: 'POST',
        headers: {
            "Content-Type": "text/xml"
        },
        body: resultObj.raw
    });
    let dataPromise = data.json();
    dataPromise.then(function(theData){
        console.log(theData);
        if(theData.valid){
            document.getElementById("error-box").style = "display:none;"
            generateDownloadButton(resultObj.formatted);
            document.getElementById("result-xml-box").innerHTML = resultObj.escaped;
        }else{
            if(document.getElementById("downloadBtn")){
                document.getElementById("downloadBtn").remove();
            }
            document.getElementById("result-xml-box").innerHTML = "";
            document.getElementById("error-box").innerHTML = "";
            document.getElementById("error-box").style = "display: block;"
            for(let i in theData.error){
                document.getElementById("error-box").innerHTML += "<p>" + theData.error[i] + "</p>";
            }
        }
    });
}

function generateDownloadButton(xml) {
    if(document.getElementById("downloadBtn")){
        document.getElementById("downloadBtn").remove();
    }
    let btnElement = document.createElement("button");
    btnElement.classList.add("btn");
    btnElement.classList.add("btn-primary");
    btnElement.classList.add("button");
    btnElement.innerText = "Download OPUS4 XML file";
    let hrefElement = document.createElement('a');
    hrefElement.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xml));
    hrefElement.setAttribute('download', "opus4.xml");
    hrefElement.setAttribute("id", "downloadBtn");
    hrefElement.appendChild(btnElement);
    document.getElementById("inputs").appendChild(hrefElement);
}

function processToXML(obj) {
    let bibTexObj = obj.entries["1"];
    console.log(obj);
    if (obj.errors.length > 0) {
        //handle errors
    }
    if (obj.warnings.length > 0) {
        //handle warnings
    }
    // uses xml-builder just like in Java. https://github.com/oozcitak/xmlbuilder-js/wiki
    let xml = builder.create("import", {encoding: 'UTF-8'}).
        ele("opusDocument", {
            "publisherName": "Technische Hochschule Wildau",
            "publisherPlace": "Hochschulring 1, 15745 Wildau",
            "serverState": "unpublished",
            "language": language,
            "type": bibTexObj.bib_type,
            "oldId": bibTexObj.entry_key,
            "pageLast": (bibTexObj.fields.pages) ? (bibTexObj.fields.pages[0][1]) ? bibTexObj.fields.pages[0][1]["0"].text : "" : "",
            "pageFirst": (bibTexObj.fields.pages) ? bibTexObj.fields.pages[0][0]["0"].text : "",
            "edition": (bibTexObj.fields.edition) ? bibTexObj.fields.edition[0].text : "",
            "volume": (bibTexObj.fields.volume) ? bibTexObj.fields.volume[0].text : "",
            "issue": (bibTexObj.fields.issue) ? bibTexObj.fields.issue[0].text : "",
            "creatingCorporation": (bibTexObj.fields.corporation) ? bibTexObj.fields.corporation[0].text : "",
            "contributingCorporation": (bibTexObj.fields.contributing_corporation) ? bibTexObj.fields.contributing_corporation[0].text : "",
            "belongsToBibliography": (bibTexObj.fields.bibliography) ? bibTexObj.fields.bibliography[0].text : "false"
        }).ele("titlesMain");
    for (let title in bibTexObj.fields.title) {
        xml.ele("titleMain", {
            "language": language
        }, bibTexObj.fields.title[title].text).up();
    }
    xml = xml.up();
    if (bibTexObj.fields.journaltitle) {
        xml = xml.ele("titles");
        for (let title in bibTexObj.fields.journaltitle) {
            xml.ele("title", { "type": "parent", "language": language }, bibTexObj.fields.journaltitle[title].text).up();
        }
        xml = xml.up();
    }
    if (bibTexObj.fields.abstract) {
        xml = xml.ele("abstracts");
        for (let abstract in bibTexObj.fields.abstract) {
            xml.ele("abstract", { "language": language }, bibTexObj.fields.abstract[abstract].text).up();
        }
        xml = xml.up();
    }
    xml = xml.ele("persons");
    for (let person in bibTexObj.fields.author) {
        xml = xml.ele("person", {
            "role": "author",
            "firstName": bibTexObj.fields.author[person].given[0].text,
            "lastName": bibTexObj.fields.author[person].family[0].text
        }).up();
    }
    xml = xml.up();
    if (bibTexObj.fields.keywords) {
        xml = xml.ele("keywords");
        for (let keyword in bibTexObj.fields.keywords) {
            xml = xml.ele("keyword", {
                "type": "uncontrolled",
                "language": language
            }, bibTexObj.fields.keywords[keyword]).up();
        }
        xml = xml.up();
    }
    if (bibTexObj.fields.date) {
        let dateObj = { "type": "completed", "year": bibTexObj.fields.date.substring(0, 4) };
        if (bibTexObj.unknown_fields) {
            if (bibTexObj.unknown_fields.day)
                dateObj["monthDay"] = "--" + bibTexObj.fields.date.substring(5) + "-" + bibTexObj.unknown_fields.day[0].text;
        }
        xml = xml.ele("dates")
            .ele("date", dateObj).up();
        xml = xml.up();
    }

    if (bibTexObj.fields.doi || bibTexObj.fields.issn) {
        xml = xml.ele("identifiers");
        if (bibTexObj.fields.doi)
            xml = xml.ele("identifier", { "type": "doi" }, bibTexObj.fields.doi).up();
        if (bibTexObj.fields.issn)
            xml = xml.ele("identifier", { "type": "issn" }, bibTexObj.fields.issn[0].text).up();
        xml = xml.up();
    }
    let xmlFormatted = formatXml(xml.end({ pretty: true }));
    let xmlEscaped = xmlFormatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    return {
        raw: xml.end(),
        formatted: xmlFormatted,
        escaped: xmlEscaped
    };
}

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    xml.split('\r\n').forEach(function (node, index) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}


//end({pretty: true});
