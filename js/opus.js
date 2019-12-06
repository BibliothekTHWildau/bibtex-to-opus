/** 
 * @version 0.1.0 
 * @author Ampuero Morisaki, Sebastian, TH Wildau
 * @author Kissig, Jan, TH Wildau
 * @copyright 
 * @license GNU General Public License v3.0
 */

// change the following lines matching your institution, 
let publisherName = "Technische Hochschule Wildau";
let publisherPlace = "Hochschulring 1, 15745 Wildau"

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
let fileInputError = document.getElementById('badFileAlert');

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
bibtexArea.addEventListener("change", function (e) { handleBibtextFile(e.target.value); }, false);
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
  let parser = new BibLatexParser(bibtex, { processUnexpected: true, processUnknown: true });
  bibtexJSON = parser.parse();
  console.log(bibtexJSON);
  hideBibtexAlert();

  if (bibtexJSON.warnings.length > 0) {
    //handle warnings
    showBibtexWarning(JSON.stringify(bibtexJSON.warnings));
  }
  if (bibtexJSON.errors.length > 0) {
    //handle errors
    showBibtexAlert(JSON.stringify(bibtexJSON.errors))
  }

  if (Object.keys(bibtexJSON.entries).length === 0)
    return showBibtexAlert(JSON.stringify("Inhalt ist kein gültiges Bibtex"))

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
  fileInputError.style.display = 'none';
  fileInputError.innerHTML = "";

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
        default:
          if (file.name.indexOf(".bib") > -1)
            handleBibtextFile(evt.target.result);
      }
    }

    if (file.type === "application/pdf") {
      reader.readAsArrayBuffer(file);
    } else if (file.type === "text/x-bibtex" || file.name.indexOf(".bib") > -1) {
      // file type not set in win firefox, we check for filename
      reader.readAsText(file);
    } else {
      // dismiss the file
      console.log("ignoring file", file.name);
      fileInputError.style.display = 'block';
      fileInputError.innerHTML += 'Ignoriere ' + file.name + "<br>";
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

  let bibtexEntries = Object.keys(bibtexJSON.entries);
  let entry;
  let root = module.builder.create("import", { encoding: 'UTF-8' });
  let xmlNode;

  bibtexEntries.forEach(function (value, index) {
    entry = bibtexJSON.entries[value];
    console.log(entry);
    xmlNode = root.ele("opusDocument", {
      "publisherName": publisherName,
      "publisherPlace": publisherPlace,
      "serverState": "unpublished",
      "language": opusDocumentLanguage,
      "type": entry.bib_type,
      "oldId": entry.entry_key,
      "pageLast": (entry.fields.pages) ? (entry.fields.pages[0][1]) ? entry.fields.pages[0][1]["0"].text : "" : "",
      "pageFirst": (entry.fields.pages) ? entry.fields.pages[0][0]["0"].text : "",
      "edition": (entry.fields.edition) ? entry.fields.edition[0].text : "",
      "volume": (entry.fields.volume) ? entry.fields.volume[0].text : "",
      "issue": (entry.fields.issue) ? entry.fields.issue[0].text : "",
      "creatingCorporation": (entry.fields.corporation) ? entry.fields.corporation[0].text : "",
      "contributingCorporation": (entry.fields.contributing_corporation) ? entry.fields.contributing_corporation[0].text : "",
      "belongsToBibliography": (entry.fields.bibliography) ? entry.fields.bibliography[0].text : "false"
    }).ele("titlesMain");
    for (let index in entry.fields.title) {
      xmlNode.ele("titleMain", {
        "language": opusDocumentLanguage
      }, entry.fields.title[index].text).up();
    }
    xmlNode = xmlNode.up();
    if (entry.fields.journaltitle) {
      xmlNode = xmlNode.ele("titles");
      for (let index in entry.fields.journaltitle) {
        xmlNode.ele("title", { "type": "parent", "language": opusDocumentLanguage }, entry.fields.journaltitle[index].text).up();
      }
      xmlNode = xmlNode.up();
    }
    if (entry.fields.abstract) {
      xmlNode = xmlNode.ele("abstracts");
      for (let index in entry.fields.abstract) {
        xmlNode.ele("abstract", { "language": opusDocumentLanguage }, entry.fields.abstract[index].text).up();
      }
      xmlNode = xmlNode.up();
    }
    xmlNode = xmlNode.ele("persons");
    for (let index in entry.fields.author) {
      xmlNode = xmlNode.ele("person", {
        "role": "author",
        "firstName": entry.fields.author[index].given[0].text,
        "lastName": entry.fields.author[index].family[0].text
      }).up();
    }
    xmlNode = xmlNode.up();
    if (entry.fields.keywords) {
      xmlNode = xmlNode.ele("keywords");
      for (let index in entry.fields.keywords) {
        xmlNode = xmlNode.ele("keyword", {
          "type": "swd",
          "language": opusDocumentLanguage
        }, entry.fields.keywords[index]).up();
      }
      xmlNode = xmlNode.up();
    }
    if (entry.fields.date) {
      let dateObj = { "type": "completed", "year": entry.fields.date.substring(0, 4) };
      if (entry.unknown_fields) {
        if (entry.unknown_fields.day)
          dateObj["monthDay"] = "--" + entry.fields.date.substring(5) + "-" + entry.unknown_fields.day[0].text;
      }
      xmlNode = xmlNode.ele("dates")
        .ele("date", dateObj).up();
      xmlNode = xmlNode.up();
    }

    if (entry.fields.doi || entry.fields.issn) {
      xmlNode = xmlNode.ele("identifiers");
      if (entry.fields.doi)
        xmlNode = xmlNode.ele("identifier", { "type": "doi" }, entry.fields.doi).up();
      if (entry.fields.issn)
        xmlNode = xmlNode.ele("identifier", { "type": "issn" }, entry.fields.issn[0].text).up();
      xmlNode = xmlNode.up();
    }

    if (uploadFiles.length > 0) {
      xmlNode = xmlNode.ele("files", { "basedir": "." });

      for (let f of uploadFiles) {
        xmlNode = xmlNode.ele("file", { "language": opusDocumentLanguage, "name": f.fileName, "visibleInOai": "true" });
        xmlNode = xmlNode.ele("checksum", { "type": "md5" }, f.md5).up();
        xmlNode = xmlNode.ele("comment", "").up();
        xmlNode = xmlNode.up();
      }

    }
  });
  // print xml 
  xmlArea.value = root.end({
    pretty: true,
    indent: ' ',
    newline: '\n',
    width: 0,
    allowEmpty: false,
    spacebeforeslash: ''
  });
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

  let data = await fetch("validator/validate.php", {
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

  zip.generateAsync({ type: "blob" })
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

  zip.generateAsync({ type: "blob" })
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
