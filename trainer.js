"use strict";
// Requires jQuery

// ----------------
// Trainer variables
// ----------------
var operators = {
    'plus':  {sign: "+",    result: function(a,b) { return a+b; }},
    'minus': {sign: "-",    result: function(a,b) { return a-b; }},
    'mult':  {sign: "\xD7", result: function(a,b) { return a*b; }},
   // 'divis': {sign: "\xF7", result: function(a,b) { return a/b; }}
};

var total   = -1; // how many problems solved
var minutes =  0; // how many minutes to play

// array of the index number of the operators the user wants to train
var useOperators = ['plus', 'minus', 'mult'];//, 'divis'];

// Min & max values for the problem
var min = 1, max = 10;

// The question info
var a, b, result;

// ================
// Trainer functions
// ================
/**
 * Check if the result in the field is correct
 */
function checkUserSubmission() {
        var userResult = $("#result").val();
	if (!isNaN(userResult) && userResult == result) {
		makeNewQuestion();
	}
}
function makeNewQuestion() {
	a = randomInt(min, max);
	b = randomInt(min, max);
        
        var operator = useOperators[randomInt(0, useOperators.length-1)];
        result = operators[operator].result(a, b);
	
        $("#question").text(a + "\xA0" + operators[operator].sign + "\xA0" + b);
        $("#result").val("");
	++total;
}


// ================
// Options/transitions
// ================
function getUserOptions() {
    $("#options_error").text("");
    var options = {};
    $("#options input.input").each(function() {
        var value = $(this).val(), id = $(this).attr('id');
        if (isNaN(value)) {
            addOptionError($(this));
        }
    });
    
}

function addOptionError(element) {
    $("#options_error").append("The " + element.attr("name") + " field must be a number!<br />");
    element.addClass("error");
}
/**
 * Transition from the options section to the trainer; initialize trainer.
 */
function startTrainer() {
    total = -1;
    $("#options").fadeOut("1s", function() { 
       $("#header").fadeIn();
       $("#user").fadeIn();
    });
}


// ================
// Helper functions
// ================
function swapBigger(a, b) {
    return (a > b) ? [b, a] : [a, b];
}
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(document).ready(function() {
	$("#result").keyup(function(e) {
		checkUserSubmission();
	});
	
	$("#start").click(function() {
		$("#options_error").text("");
		var options = {};
		$("#options input.input").each(function() {
			var value = $(this).val();
			var id    = $(this).attr('id');
			if (isNaN(value)) {
				$("#options_error").append("The " + id + " field must be a number!");
				$(this).addClass("error");
			} else if (id == "timer_length" && value <= 0) {
				$("#options_error").append("The timer must run for at least 1 minute!");
				$(this).addClass("error");
			} else {
				options[id] = parseInt(value);
				$(this).removeClass("error");
			}
		});
		
		if ($("#options .error").size() > 0) {
			console.log("Found errors!");
		} else {
			options.minmax = swapBigger(options.min, options.max);
			min = options.minmax[0]; max = options.minmax[1];
			minutes = options.timer_length;
			$("#options").fadeOut();
			$("#header").fadeIn();
			$("#user").fadeIn();
			makeNewQuestion();
		}
	});
	
	$("#options").fadeIn();
});