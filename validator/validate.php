<?php

/**
 * function that collects all validation errors and returns them in an array
 * @return type
 */
function libxmlDisplayErrors() {
  $errors = libxml_get_errors();
    
  $result = [];
  foreach ($errors as $error) {
    
    $result[] = $error->message;
  }
  libxml_clear_errors();
  return $result;
}

// set proxy 
include_once 'settings.php';
if (isset($proxy)){
  $aContext = array(
    'http' => array(
        'proxy' => $proxy,
        'request_fulluri' => true,
    ),
  );

  libxml_set_streams_context(stream_context_create($aContext));
} 

// setting the schema
$schema = "opus-import.xsd";

// getting the xml text
$postData = file_get_contents('php://input');

// build an object for the response
$response = array("valid" => false);

// empty post
if (empty($postData)){
  echo json_encode($response);
  exit;
}

// testdata
//$postData = '<haus><baum>jo</baum></haus>';

// enable 
libxml_use_internal_errors(true);

// create a new DOMDocument, set the xml and validate it
$xml= new DOMDocument();

$xml->loadXML($postData); //

if (!$xml->schemaValidate($schema)) {
  $response['error'] = libxmlDisplayErrors();   
} else {
  $response['schema'] = true;
  $response['valid'] = true; 
}
echo json_encode($response);
exit;

?>
