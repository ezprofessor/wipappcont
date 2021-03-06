/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

//declare here
var h = new Object();
var prev_event = false;
// The watch id references the current `watchAcceleration`
var watchID = null;
var acclr_new = new Object();
var acclr_prev = new Object();
var acclr_output;
var def_acc_x;
var def_acc_y;
var def_acc_z;


function app_initialize(app_input) {
    document.addEventListener('deviceready', onDeviceReady, false);
    
    // Cordova is ready to be used!
    //
    function onDeviceReady() {
        console.log('Javascript OK');
        switch(app_input){
            case 'geoLocation':
                initiate_geolocation();
                break;
            case 'fetchIce':
                fetch_Ice();
                break;
            case 'getAcceleration':
                startWatch();
                break;
			case 'writeLog':
				writeLog(acclr_output);
				break;
        }
    }
}

function initiate_geolocation() {
    navigator.geolocation.getCurrentPosition(handle_geolocation_query,handle_errors);
}

function handle_errors(error) {
    switch(error.code)
    {
        case error.PERMISSION_DENIED: alert("user did not share geolocation data");
            break;
        case error.POSITION_UNAVAILABLE: fallbackHtml5Location();
            break;
        case error.TIMEOUT: alert("retrieving position timed out");
            break;
        default: alert("unknown error");
            prev_event = true;
            break;
    }
}

function fallbackHtml5Location() {
    $.getJSON("http://freegeoip.net/json/", function(res){
              console.log('flow : inside falbackhtml5location');
              $('div.geoLocation').find('h2').append(res.longitude);
              $('div.geoLocation').find('h3').append(res.latitude);
              });
    prev_event = true;
}

function handle_geolocation_query(position){
    h['latitude']   = position.coords.latitude;
    h['longitude']  = position.coords.latitude;
    h['altitude']   = position.coords.altitude;
    h['accuracy']   = position.coords.accuracy;
    h['altitudeAccuracy'] = position.coords.altitudeAccuracy;
    h['heading']    = position.coords.heading;
    h['speed']      = position.coords.speed;
    h['timestamp']  = position.timestamp;
    console.log('while fetching ' + h['longitude']);
    $('div.geoLocation').find('h2').append('GPS: ' + position.coords.longitude);
    console.log('GPS: ' + position.coords.longitude);
    $('div.geoLocation').find('h3').append('GPS: ' + position.coords.latitude);
    var d = new Date(h['timestamp']);
    $('div.geoLocation').append(d.toLocaleString());
    prev_event = true;
    //Need to send SMS, and sync to JSON DB
    app_initialize('fetchIce');//initializing deviceready for fetchIce
}

function fetch_Ice() {
    console.log('current output ' + h['latitude'] );
    prev_event = true;
}

function checkPrevEvent() {
    (prev_event == false) ? console.log('flow - am waiting for previous event to finish')/*manually making synchronous sequence*/ : prev_event = false;
}

// Start watching the acceleration
function startWatch() {
    console.log('flow - am inside startWatch');
    // Update acceleration every 3 seconds
    var options = { frequency: 3000 };
    watchID = navigator.accelerometer.watchAcceleration(onAcclrSuccess, onAcclrError, options);
} // closing startWatch

    // Stop watching the acceleration
    function stopWatch() {
        if (watchID) {
            navigator.accelerometer.clearWatch(watchID);
            watchID = null;
        }
    }

    // onSuccess: Get a snapshot of the current acceleration
    function onAcclrSuccess(acceleration) {
        console.log('flow - am inside onAcclrSuccess');
        acclr_new['x']=acceleration.x;
        acclr_new['y']=acceleration.y;
        acclr_new['z']=acceleration.z;  

        if (acclr_prev['x'] != acclr_new['x']) {
		//Raise an ALram!!!!!!!
        //assigning to prev object   
        acclr_prev = jQuery.extend(true, {}, acclr_new);
		console.log('User is NOT stable X: ' + acclr_new['x'] + ' Y: ' + acclr_new['y'] + ' Z: ' + acclr_new['z']);
		acclr_output = 'User is NOT stable X: ' + acclr_new['x'] + ' Y: ' + acclr_new['y'] + ' Z: ' + acclr_new['z'];
		app_initialize('writeLog');
        }
        else {
		//Raise No Alarm !!
        $('.accelerometer').find('h2').append('User is stable');
        console.log('User is stable X: ' + acclr_new['x'] + ' Y: ' + acclr_new['y'] + ' Z: ' + acclr_new['z']);
		acclr_output = 'User is stable X: ' + acclr_new['x'] + ' Y: ' + acclr_new['y'] + ' Z: ' + acclr_new['z'];
		app_initialize('writeLog');

        //var element = document.getElementById('accelerometer');
        /*        console.log('X '+acceleration.x);
                $('.accelerometer').find('h3').append(acceleration.y);
        $('.accelerometer').find('h4').append(acceleration.z);
        $('.accelerometer').append(acceleration.timestamp);*/
        }
        
    }

    // onError: Failed to get the acceleration
    function onAcclrError() {
        alert('onError!');
    }

function writeLog(output)
{
// Cordova is ready
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

    function gotFS(fileSystem) {
        fileSystem.root.getFile("evesafe.log", {create: true, exclusive: false}, gotFileEntry, fail);
    }

    function gotFileEntry(fileEntry) {
        fileEntry.createWriter(gotFileWriter, fail);
    }

    function gotFileWriter(writer) {
		writer.seek(writer.length-1);
        writer.write(output + "\n\n");
    }

    function fail(error) {
        console.log(error.code);
    }

}

// Handle the onDevice ready event
function onDeviceReady() {
		document.addEventListener("backbutton", function(e){
       
        if (confirm("Are you sure you want to logout?")) {
            /* Here is where my AJAX code for logging off goes */
			e.preventDefault();
			stopWatch();
			navigator.app.exitApp();
        }
		}, false);
		
		//Call Install Ice here
}

// Handle the pause event
    //
    function onPause(e) {
    	e.preventDefault();
    	console.log('iflow inside onPause, its overridden');
    }

// Handle the online event
    //
    function onOnline() {
    }

$(document).ready(function() {
                  //hiding all div tags
                  $('.geoLocation,.accelerometer').hide();
                  
                  //toggle button css
                  $('.old').mouseup(function () {
                                    $(this).toggleClass('pushdown');
                                    });
                  $('#button-mode1').mouseup(function (){
                                             app_initialize('geoLocation');//initializing deviceready for geoLocation
                                             $('.geoLocation').show();
                                             });
                  
                  $('#button-mode2').mouseup(function (){
                                             app_initialize('getAcceleration');//initializing deviceready for Acceleration
                                             $('.accelerometer').show();      
                                             
                                             });
// global eventlistner
document.addEventListener("deviceready", onDeviceReady, false); // event for backbutton and installIce
document.addEventListener("online", onOnline, false); // when the app is connected to the internet
document.addEventListener("pause", onPause, false); // when the app goes backend


             	     
                  
                  });//closing document ready