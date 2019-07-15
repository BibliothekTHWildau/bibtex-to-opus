<?php
// Proxyserver falls vorhanden setzen
//$proxy = "host:port";

// The URL of the service document
$testurl = "https://opus4.kobv.de/INSTANZ/sword/servicedocument";

// The user (if required)
$testuser = "USER";

// The password of the user (if required)
$testpw = "PASSWORD";

// The on-behalf-of user (if required)
//$testobo = "user@swordapp.com";

// The URL of the example deposit collection
$testdepositurl = "https://opus4.kobv.de/INSTANZ/sword/deposit";

// The test file to deposit
if (isset($_FILES)){ 
  $file = $_FILES['file'];
  $testfile = $file['tmp_name'];
} else {
  $testfile = "test/opus.zip"; 
}

// The content type of the test file
$testcontenttype = "application/zip";

// The packaing format of the test fifle
$testformat = "http://www.opus-repository.org/sword/opus4package-v1";
?>
