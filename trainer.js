(function () {
  'use strict';

  // ================
  // Trainer variables
  // ================
  var operators = {
    add: {name: 'add', sign: '+',    result: function (a, b) { return a + b; }},
    sub: {name: 'sub', sign: '-',    result: function (a, b) { return a - b; }},
    mul: {name: 'mul', sign: '\xD7', result: function (a, b) { return a * b; }},
    div: {name: 'div', sign: '\xF7', result: function (a, b) { return a / b; }}
  };
  
  var config = {
    min: 0,
    max: 0,
    minutes: 0,
    avoidNegatives: true,
    operators: [0, 1, 2, 3]
  };
  
  var stats = {
    total: 0,
    skipped: 0
  };
  
  var question = {
    a: 0,
    b: 0,
    result: 0
  };

  // ================
  // Trainer functions
  // ================
  /**
   * Checks if the result in the field is correct and creates a new question if
   * this is the case.
   */
  function checkUserSubmission() {
    var userResult = parseInt($('#result').val(), 10);
    if (!isNaN(userResult) && userResult === question.result) {
      ++stats.total;
      createNewQuestion();
    }
  }
  /**
   * Allows a question to be skipped; a new question will be created.
   */
  function skipQuestion() {
    ++stats.skipped;
    createNewQuestion();
  }
  /**
   * Creates a new question (updates the variables accordingly).
   */
  function createNewQuestion() {
    var a = randomInt(config.min, config.max);
    var b = randomInt(config.min, config.max);

    var operator = getRandomOperator();
    if (operator.name === 'sub' && config.avoidNegatives) {
      var ab = swapBigger(a, b);
      a = ab[1];
      b = ab[0];
      question.result = a - b;
    } else if (operator.name === 'div') {
      var mulResult = a * b;
      question.result = a;
      a = mulResult;
    } else {
      question.result = operator.result(a, b);
    }
    question.a = a;
    question.b = b;
    updateQuestionText(operator.sign);
  }
  function updateQuestionText(sign) {
    $('#question_math').text(question.a + '\xA0' + sign + '\xA0' + question.b);
    $('#result').val('');
    $('#progress').text(stats.total + ' answered, ' + stats.skipped +
      ' skipped');
  }
  function getRandomOperator() {
    return operators[
      config.operators[randomInt(0, config.operators.length - 1)]
    ];
  }

  // ================
  // Functions for options
  // ================
  function getUserOptions() {
    $('#min, #max, #op_wrapper, #timer_length').removeClass('error');
    $('#options_error').text('');
    setTimerOption();
    setMinMaxOptions();
    setUserOperators();
    if ($('#options .error').size() === 0) {
      $('#error_wrapper').hide();
      if (config.min > 0) {
        config.avoidNegatives = $('#avoid_negative').is(':checked');
      } else {
        config.avoidNegatives = false;
      }
      startTrainer();
    } else {
      $('#error_wrapper').show();
    }
  }
  function setMinMaxOptions() {
    var min = parseInt($('#min').val());
    var max = parseInt($('#max').val());
    if (isNaN(min)) {
      addOptionError('min', 'The min field must be a number');
    } else if (isNaN(max)) {
      addOptionError('max', 'The max field must be a number');
    } else {
      var minmax = swapBigger(min, max);
      config.min = minmax[0];
      config.max = minmax[1];
    }
  }
  function setTimerOption() {
    var timerValue = parseInt($('#timer_length').val());
    if (isNaN(timerValue)) {
      addOptionError('timer_length', 'Please enter a valid number of minutes');
    } else if (timerValue <= 0) {
      addOptionError('timer_length', 'Please enter a positive number of ' +
        'minutes');
    } else {
      config.minutes = timerValue;
    }
  }
  function setUserOperators() {
    // The checkboxes are #op_{name}, e.g. #op_add or #op_div
    var inputOperators = [];
    for (var key in operators) {
      if (operators.hasOwnProperty(key)) {
        if ($('#op_' + key).is(':checked')) {
          inputOperators.push(key);
        }
      }
    }
    if (inputOperators.length === 0) {
      addOptionError('op_wrapper', 'Please select at least one operator!');
    } else {
      config.operators = inputOperators;
    }
  }
  function addOptionError(id, message) {
    $('#options_error').append(message + '<br />');
    $('#' + id).addClass('error');
  }

  // ================
  // Options <-> Trainer transitions
  // ================
  function startTrainer() {
    stats.total = 0;
    stats.skipped = 0;
    $('#options').fadeOut(function() { 
      $('#question, #user').fadeIn();
    });
    $('#score').fadeOut();
    createNewQuestion();
    startTimer();
  }
  function showScore(timeString) {
    setScoreText(timeString);
    $('#user').fadeOut(50, function() {
      $('#question').fadeOut(function() {
        $('#score, #options').fadeIn();
      });
    });
  }
  function setScoreText(timeString) {
    if (timeString) {
      $('#score_time').text(timeString);
    } else {
      $('#score_time').text(config.minutes + ' minute' + 
        (config.minutes !== 1 ? 's' : ''));
    }
    $('#score_skipped').text(stats.skipped);
    $('#score_total').text(stats.total);
  }
  function startTimer() {
    $('#timer').countdown(new Date().getTime() + config.minutes * 60000)
    .on('update.countdown', function (event) {
      $(this).text(event.strftime('%M:%S'));
    })
    // sic: the event is mistyped
    .on('stoped.countdown', function (event) {
      // Given minutes = 5, if #timer shows "3:45" we want to
      // display 1:15 in #score, i.e. {5-3-1}:{60-45}
      var timeElapsed;
      if (event.offset.seconds > 0) {
        timeElapsed = (config.minutes - event.offset.minutes - 1) + ':' +
          secondsPadding(60 - event.offset.seconds);
      } else {
        timeElapsed = (config.minutes - event.offset.minutes) + ':00';
      }
      showScore(timeElapsed);
    })
    .on('finish.countdown', function () {
      showScore();
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
    return (seconds >= 10) ? seconds : '0' + seconds;
  }

  // ================
  // Set event handlers when document is ready
  // ================
  $(document).ready(function () {
    $('#result').keyup(function (e) {
      if (e.which === 32) {
        skipQuestion();
      } else {
        checkUserSubmission();
      }
    });

    $('#start').click(function () {
      getUserOptions();
    });

    $('#quit_to_options').click(function () {
      $('#timer').countdown('stop');
    });

    $('#start').fadeIn();
  });
}());