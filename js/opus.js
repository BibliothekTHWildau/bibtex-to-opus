const dropzoneHoverClassName = "dragover";
let fileInput = document.getElementById('file');
let bibtexArea = document.getElementById("bibtexInput");
let languageSelect = document.getElementById('languageSelect');
let xmlArea = document.getElementById('xmlArea');
let validateXMLButton = document.getElementById('validateXMLButton');
let uploadButton = document.getElementById('uploadButton');
let downloadButton = document.getElementById('downloadButton');
let bibtextAlert = document.getElementById('bibtextAlert');
let xmlAlert = document.getElementById('xmlAlert');
let filesList = document.getElementById('files');

// caching issues
bibtexArea.value = "";
xmlArea.value = "";
languageSelect.selectedIndex = 0;
languageSelect.disabled = true;
validateXMLButton.disabled = true;
uploadButton.disabled = true;
downloadButton.disabled = true;

fileInput.addEventListener('change', fileChange);
bibtexArea.addEventListener("dragenter", dragenter, false);
bibtexArea.addEventListener("dragleave", dragleave, false);
bibtexArea.addEventListener("dragover", dragover, false);
bibtexArea.addEventListener("drop", drop, false);
validateXMLButton.onclick = validateXML;
uploadButton.onclick = upload;
downloadButton.onclick = download;

languageSelect.addEventListener('change', languageSelectChange);
let opusDocumentLanguage = null;

let bibtexJSON = null;

let uploadFiles = [];

/**
 * marks the next step to do by changing the background
 * 
 * @param {type} no
 * @returns {undefined}
 */
function goto(no) {
  document.querySelector('.step.active').classList.remove("active");
  document.querySelector('#step' + no).classList.add('active');
  // scroll browser to next step
  //location.hash = "step" + no
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragleave(e) {
  bibtexArea.classList.remove(dropzoneHoverClassName);
  //console.log(e.type)
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  // needed 
  bibtexArea.classList.add(dropzoneHoverClassName);
  //console.log(e.type)
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  //console.log(e)
  e.stopPropagation();
  e.preventDefault();
  bibtexArea.classList.remove(dropzoneHoverClassName);
  fileInput.files = e.dataTransfer.files;
  fileChange();
}

function showBibtexWarning(msg) {
  bibtextAlert.style.display = 'block';
  bibtextAlert.innerHTML = msg;
  bibtextAlert.classList.add("alert-warning");
}

function showBibtexAlert(msg) {
  bibtextAlert.style.display = 'block';
  bibtextAlert.innerHTML = msg;
  bibtextAlert.classList.add("alert-danger");
}

function hideBibtexAlert() {
  bibtextAlert.innerHTML = "";
  bibtextAlert.style.display = 'none';
}

/**
 * parsing the uploaded bibtex file to a bibtexobject via BibLatexParser
 * https://github.com/fiduswriter/biblatex-csl-converter/tree/browser
 * 
 * @param {type} bibtex
 * @returns {undefined}
 */
function handleBibtextFile(bibtex) {
  let parser = new BibLatexParser(bibtex, {processUnexpected: true, processUnknown: true});
  bibtexJSON = parser.parse();
  hideBibtexAlert();

  if (bibtexJSON.warnings.length > 0) {
    //handle warnings
    showBibtexWarning(JSON.stringify(bibtexJSON.warnings));
  }
  if (bibtexJSON.errors.length > 0) {
    //handle errors
    showBibtexAlert(JSON.stringify(bibtexJSON.errors))
  }

  // print raw bibtex to screen
  bibtexArea.value = bibtex;
  bibtexArea.rows = bibtex.split("\n").length;

  // enable language selection and highlight it
  languageSelect.disabled = false;
  goto(2);
}

/**
 * handle uploaded pdf, ignore duplicate files and print to screen
 * @param {type} fileName
 * @param {type} file
 * @returns {undefined}
 */
function handlePDFFile(fileName, file) {

  if (uploadFiles.find(file => {
    return file.fileName === fileName
  }))
    return console.log("duplicate file");

  uploadFiles.push({
    fileName: fileName,
    file: file,
    md5: md5(file)
  });

  let li = document.createElement('li');
  li.appendChild(document.createTextNode(fileName));
  li.appendChild(getDeleteFileButton(fileName))
  filesList.appendChild(li);

  filesList.style.display = 'block';

  if (xmlArea.value.length > 0)
    processToXML();
}

/**
 * creates a delet button to an attached pdf file 
 * @param {type} fileName
 * @returns {Element|getDeleteFileButton.button} */
function getDeleteFileButton(fileName) {
  let button = document.createElement('button');

  button.onclick = deleteFile
  button.innerHTML = "&times;";
  button.title = fileName + " entfernen"
  button.className = "deleteButton btn btn-sm";
  return button;
}

/**
 * removes file from file list
 * will cause xml to be rebuild
 * @param {type} evt
 * @returns {undefined} */
function deleteFile(evt) {
  let delFileName = evt.target.previousSibling.nodeValue;

  uploadFiles = uploadFiles.filter(function (file) {
    return file.fileName !== delFileName;
  });
  evt.target.parentNode.remove();

  if (xmlArea.value.length > 0)
    processToXML();
}

/**
 * handle files which were dragged into dropzone or uploaded via dialog
 * dismiss filetypes other than .pdf and .bib
 * @returns {undefined} */
function fileChange() {

  for (let file of fileInput.files) {
    let reader = new FileReader();
    reader.onload = (evt) => {

      if (evt.target.readyState != 2)
        return;
      if (evt.target.error) {
        alert('Error while reading file');
        return;
      }

      switch (file.type) {
        case "text/x-bibtex":
          handleBibtextFile(evt.target.result);
          break;
        case "application/pdf":
          handlePDFFile(file.name, evt.target.result);
          break;
      }
    }

    if (file.type === "application/pdf") {
      reader.readAsArrayBuffer(file);
    } else if (file.type === "text/x-bibtex") {
      reader.readAsText(file);
    } else {
      // dismiss the file
      console.log("ignoring file", file.name)
    }
  }
}

/**
 * change listener for language select
 * sets a global opusDocumentLanguage value
 * @param {type} e
 * @returns {undefined} */
function languageSelectChange(e) {
  opusDocumentLanguage = e.target.value;
  processToXML();
}

/**
 * builds an xml 
 * uses xml-builder just like in Java. 
 * https://github.com/oozcitak/xmlbuilder-js/wiki
 * module.builder is created via 'browserify xmlbuilder-base.js -s module -o xmlbuilder.js' as described in xmlbuilder-base.js
 * @returns {undefined} */
function processToXML() {

  if (bibtexJSON === null)
    return goto(1);

  if (languageSelect.selectedIndex === 0)
    return goto(2);

  let bibTexObj = bibtexJSON.entries["1"];

  let xml = module.builder.create("import", {encoding: 'UTF-8'}).
          ele("opusDocument", {
            "publisherName": "Technische Hochschule Wildau",
            "publisherPlace": "Hochschulring 1, 15745 Wildau",
            "serverState": "unpublished",
            "language": opusDocumentLanguage,
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
      "language": opusDocumentLanguage
    }, bibTexObj.fields.title[title].text).up();
  }
  xml = xml.up();
  if (bibTexObj.fields.journaltitle) {
    xml = xml.ele("titles");
    for (let title in bibTexObj.fields.journaltitle) {
      xml.ele("title", {"type": "parent", "language": opusDocumentLanguage}, bibTexObj.fields.journaltitle[title].text).up();
    }
    xml = xml.up();
  }
  if (bibTexObj.fields.abstract) {
    xml = xml.ele("abstracts");
    for (let abstract in bibTexObj.fields.abstract) {
      xml.ele("abstract", {"language": opusDocumentLanguage}, bibTexObj.fields.abstract[abstract].text).up();
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
        "type": "swd",
        "language": opusDocumentLanguage
      }, bibTexObj.fields.keywords[keyword]).up();
    }
    xml = xml.up();
  }
  if (bibTexObj.fields.date) {
    let dateObj = {"type": "completed", "year": bibTexObj.fields.date.substring(0, 4)};
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
      xml = xml.ele("identifier", {"type": "doi"}, bibTexObj.fields.doi).up();
    if (bibTexObj.fields.issn)
      xml = xml.ele("identifier", {"type": "issn"}, bibTexObj.fields.issn[0].text).up();
    xml = xml.up();
  }

  if (uploadFiles.length > 0) {
    xml = xml.ele("files", {"basedir": "."});

    for (let f of uploadFiles) {
      xml = xml.ele("file", {"language": opusDocumentLanguage, "name": f.fileName, "visibleInOai": "true"});
      xml = xml.ele("checksum", {"type": "md5"}, f.md5).up();
      xml = xml.ele("comment", "").up();
      xml = xml.up();
    }

  }

  // print xml 
  xmlArea.value = xml.end({pretty: true,
    indent: ' ',
    newline: '\n',
    width: 0,
    allowEmpty: false,
    spacebeforeslash: ''});
  xmlArea.rows = xmlArea.value.split("\n").length;

  // and validate
  validateXML();
}

/**
 * validates xml against xsd 
 * http://www.opus-repository.org/schema/opus-import.xsd
 * displays errors or enables download / upload
 * @returns {undefined} */
async function validateXML() {

  xmlAlert.innerHTML = "";
  xmlAlert.style.display = "block";
  xmlAlert.className = "alert";
  xmlArea.onkeyup = xmlChange;

  let data = await fetch("https://publister.th-wildau.de/bibliothek/opus/validator/validate.php", {
    method: 'POST',
    headers: {
      "Content-Type": "text/xml"
    },
    body: xmlArea.value
  });
  let dataPromise = data.json();
  dataPromise.then(function (validationData) {

    console.log(validationData);

    if (validationData.valid) {
      uploadButton.disabled = false;
      downloadButton.disabled = false;
      xmlAlert.classList.add("alert-success");
      xmlAlert.innerHTML = "XML ist gültig";
      goto(4);
    } else {
      uploadButton.disabled = true;
      downloadButton.disabled = true;
      xmlAlert.classList.add("alert-danger");
      for (let i in validationData.error) {
        xmlAlert.innerHTML += "<p>" + validationData.error[i] + "</p>";
      }
      goto(3);
    }
  });
}

/**
 * if xml is changed a revalidation is required
 * @returns {undefined} */
function xmlChange() {
  // remove this listener
  xmlArea.removeEventListener('onkeyup', xmlChange);
  // go to validation area and display to do info
  goto(3);
  xmlAlert.className = "alert alert-warning";
  xmlAlert.innerHTML = "XML wurde geändert. Neuvalidierung erforderlich";
  validateXMLButton.disabled = false;
  uploadButton.disabled = true;
  downloadButton.disabled = true;
}

/**
 * generate a zip object which includes the xml as 'opus.xml' and
 * all attached files by their names
 * @returns {JSZip|generateZip.zip} */
function generateZip() {
  var zip = new JSZip();
  zip.file("opus.xml", xmlArea.value);
  for (let f of uploadFiles) {
    console.log("additional file", f)
    zip.file(f.fileName, f.file);
  }
  ;

  return zip;
}

/**
 * download a opus zip file for manual testing with swordappclient
 * @returns {undefined} */
function download() {

  let zip = generateZip();

  zip.generateAsync({type: "blob"})
          .then(function (content) {
            // see FileSaver.js
            return saveAs(content, "example.zip");
          });
}

/**
 * upload the zip file to swordappclient 
 * @returns {undefined} */
function upload() {
  
  uploadButton.disabled = true;

  var formData = new FormData();

  let zip = generateZip();

  zip.generateAsync({type: "blob"})
          .then(function (content) {

            formData.append('file', content, "opus.zip");
            return fetch("sword/test-swordappclient.php", {
              method: 'POST',
              body: formData
            });

          })
          .then(response => response.text())
          .catch(error => console.error('Error:', error))
          .then(response => {
            opusResponse.innerHTML = response;
            opusResponse.style.display = 'block';
            console.log('Success:', response)
  });
}

let opusResponse = document.getElementById('opusResponse')