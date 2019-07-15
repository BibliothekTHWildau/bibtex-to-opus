# bibtex-to-opus
Tool zum Import von Bibtex-Dateien in das Open Access Repository OPUS4 (http://www.opus-repository.org/) über die vorhandene Sword-Schnittstelle (v1.3)

## Features:
* Import von Packages (*.bib und *.pdf in einem zip-Container)
* Erzeugung von "opus.xml"
* Validierung des XML gegen http://www.opus-repository.org/schema/opus-import.xsd
* Upload via swordapp-php-library 

## Einstellungen: 
* Im Verzeichnis `sword` die Datei `_settings.php` in `settings.php` umbenennen und mit den eigenen Einstellungen speichern.
* Im Verzeichnis `validator` die Datei `_settings.php` in `settings.php` umbenennen und mit den eigenen Einstellungen speichern.

## Folgende Projekte werden verwendet:
* FileSaver.js - A saveAs() FileSaver implementation. 2014-01-24 By Eli Grey, http://eligrey.com
* biblatex-csl-converter - https://github.com/fiduswriter/biblatex-csl-converter/tree/browser
* JSZip - https://stuk.github.io/jszip/
* xmlbuilder-js - https://github.com/oozcitak/xmlbuilder-js/wiki
* md5 - https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js
* swordapp-php-library - https://github.com/swordapp/swordapp-php-library
* jQuery
* Bootstrap
