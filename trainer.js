(function () {
"use strict";

// ================
// Trainer variables
// ================
var operators = [
    {name: "add", sign: "+",    result: function (a, b) { return a + b; }},
    {name: "sub", sign: "-",    result: function (a, b) { return a - b; }},
    {name: "mul", sign: "\xD7", result: function (a, b) { return a * b; }},
    {name: "div", sign: "\xF7", result: function (a, b) { return a / b; }}
];

var total   = 0; // how many problems solved
var skipped = 0; // how many problems skipped
var minutes = 0; // how many minutes to play

// for subtraction, if min > 0 AND max > 0
// user can set the option not to have any negative values.
var avoidNegatives = true;

// array of the index number of the operators the user wants to train
var useOperators = [0, 1, 2, 3];

// Min & max values for the problem
var min = 1, max = 10;

// The question info
var a = 0, b = 0, result = 0;

// ================
// Trainer functions
// ================
/**
 * Check if the result in the field is correct
 */
function checkUserSubmission() {
    var userResult = parseInt($("#result").val(), 10);
    if (!isNaN(userResult) && userResult === result) {
            ++total;
            makeNewQuestion();
    }
}
function skipQuestion() {
    ++skipped;
    makeNewQuestion();
}
function makeNewQuestion() {
    a = randomInt(min, max);
    b = randomInt(min, max);
        
        var operator = getRandomOperator();
        if (operator.name === "sub" && avoidNegatives) {
            var ab = swapBigger(a, b);
            a = ab[1];
            b = ab[0];
            result = a - b;
        } else if (operator.name === "div") {
            var mulResult = a * b;
            result = a;
            a = mulResult;
        } else {
            result = operator.result(a, b);
        }
        updateQuestionText(operator.sign);
}
function updateQuestionText(sign) {
    $("#question_math").text(a + "\xA0" + sign + "\xA0" + b);
    $("#result").val("");
    $("#progress").text(total + " answered, " + skipped + " skipped");
}
function getRandomOperator() {
    return operators[
        useOperators[randomInt(0, useOperators.length - 1)]
    ];
}


// ================
// Functions for options
// ================
function getUserOptions() {
    $("#min, #max, #op_wrapper, #timer_length").removeClass("error");
    $("#options_error").text("");
    setTimerOption();
    setMinMaxOptions();
    setUserOperators();
    if ($("#options .error").size() === 0) {
        $("#error_wrapper").hide();
        if (min > 0 && $("#avoid_negative").is(":checked")) {
            avoidNegatives = true;
        } else {
            avoidNegatives = false;
        }
        startTrainer();
    } else {
        $("#error_wrapper").show();
    }
}
function setMinMaxOptions() {
    var min_ = parseInt($("#min").val());
    var max_ = parseInt($("#max").val());
    if (isNaN(min_)) {
        addOptionError("min", "The min field must be a number");
    } else if (isNaN(max_)) {
        addOptionError("max", "The max field must be a number");
    } else {
        var minmax = swapBigger(min_, max_);
        min = minmax[0];
        max = minmax[1];
    }
}
function setTimerOption() {
    var timerValue = parseInt($("#timer_length").val());
    if (isNaN(timerValue)) {
        addOptionError("timer_length", "Please enter a valid number of minutes");
    } else if (timerValue <= 0) {
        addOptionError("timer_length", "Please enter a positive number of minutes");
    } else {
        minutes = timerValue;
    }
}
function setUserOperators() {
    // Make sure that the inputIds indices are the same as in window.operators
    var inputIds = ["#op_add", "#op_sub", "#op_mul", "#op_div"];
    var inputOperators = [];
    var count = 0;
    $.each(inputIds, function() {
        if ($(this).is(":checked")) {
            inputOperators.push(count);
        }
        ++count;
    });
    if (inputOperators.length === 0) {
        addOptionError("op_wrapper", "Please select at least one operator!");
    } else {
        useOperators = inputOperators;
    }
}
function addOptionError(id, message) {
    $("#options_error").append(message + "<br />");
    $("#" + id).addClass("error");
}

// ================
// Options <-> Trainer transitions
// ================
function startTrainer() {
    total   = 0;
    skipped = 0;
    $("#options").fadeOut(function() { 
       $("#question, #user").fadeIn();
    });
    $("#score").fadeOut();
    makeNewQuestion();
    startTimer();
}
function showScore(timeString) {
    setScoreText(timeString);
    $("#user").fadeOut(50, function() {
        $("#question").fadeOut(function() {
            $("#score, #options").fadeIn();
        });
    });
}
function setScoreText(timeString) {
    if (timeString) {
        $("#score_time").text(timeString);
    } else {
        $("#score_time").text(minutes + " minute" + (minutes !== 1 ? "s" : ""));
    }
    $("#score_skipped").text(skipped);
    $("#score_total").text(total);
}
function startTimer() {
    $("#timer").countdown(new Date().getTime() + minutes * 60000)
    .on("update.countdown", function (event) {
        $(this).text(event.strftime('%M:%S'));
    })
    .on("stoped.countdown", function (event) { //[sic]
        // Given minutes = 5, if #timer shows "3:45" we want to
        // display 1:15 in #score, i.e. {5-3-1}:{60-45}
        var timeElapsed;
        if (event.offset.seconds > 0) {
            timeElapsed = (minutes - event.offset.minutes - 1) + ":" + secondsPadding(60-event.offset.seconds);
        } else {
            timeElapsed = (minutes - event.offset.minutes) + ":00";
        }
        showScore(timeElapsed);
    })
    .on('finish.countdown', function () {
        showScore(false);
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
function secondsPadding(seconds) {
    return (seconds >= 10) ? seconds : "0" + seconds;
}

// ================
// Set event handlers when document is ready
// ================
$(document).ready(function () {
    $("#result").keyup(function (e) {
        if (e.which === 32) {
            skipQuestion();
        } else {
            checkUserSubmission();
        }
    });
    
    $("#start").click(function () {
            getUserOptions();
    });

    $("#quit_to_options").click(function () {
        $("#timer").countdown("stop");
    });
    
    $("#start").fadeIn();
});
}());