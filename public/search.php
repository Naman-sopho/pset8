<?php

    require(__DIR__ . "/../includes/config.php");

    // numerically indexed array of places
    $places = [];

    // Search database for places matching $_GET["geo"]
    $places = CS50::query("SELECT * FROM places WHERE MATCH(postal_code, place_name, admin_name1) AGAINST (?) LIMIT 20", $_GET["geo"]);
    
    // output places as JSON (pretty-printed for debugging convenience)
    header("Content-type: application/json");
    print(json_encode($places, JSON_PRETTY_PRINT));

?>