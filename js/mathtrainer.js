(function () {
	'use strict';

	/**
	 * List of supported operators.
	 */
	var operators = {
		add: {name: 'add', sign: '+',    result: function (a, b) { return a + b; }},
		sub: {name: 'sub', sign: '-',    result: function (a, b) { return a - b; }},
		mul: {name: 'mul', sign: '\xD7', result: function (a, b) { return a * b; }},
		div: {name: 'div', sign: '\xF7', result: function (a, b) { return a / b; }}
	};

	/**
	 * Configuration parameters provided by the user.
	 *  min: The smallest number to use in the questions.
	 *  max: The largest number to use in the questions.
	 *  minutes: The number of minutes the trainer should run for.
	 *  avoidNegatives: If true, guarantees that subtraction results are never 
	 *     negative. Only takes effect if min >= 0.
	 *  operators: The operators to use in the questions.
	 */
	var config = {
		min: 0,
		max: 0,
		minutes: 0,
		avoidNegatives: true,
		operators: ['add', 'div']
	};

	/**
	 * Statistics of the current run.
	 */
	var stats = {
		total: 0,
		skipped: 0
	};

	/**
	 * Data of the current question the trainer is showing.
	 */
	var question = {
		a: 0,
		b: 0,
		result: 0
	};

	/** Trainer logic. */
	var trainer = {};

	/**
	 * Functions for the current trainer question.
	 */
	trainer.question = function () {
		/**
		 * Returns a random integer between min and max.
		 * @param {Number} min lower bound
		 * @param {Number} max upper bound
		 * @returns {Number} Random int in [min, max]
		 */
		var randomInt = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		/**
		 * Returns a random operator the user wants to use.
		 * @returns {operators}
		 */
		var getRandomOperator = function () {
			return operators[
				config.operators[randomInt(0, config.operators.length - 1)]
			];
		};

		/**
		 * Updates the HTML document with the data from the question.
		 * @param {String} sign The sign symbol of the operator used in the question
		 */
		var updateQuestionText = function (sign) {
			$('#answer').val('');
			$('#currentquestion').text(question.a + '\xA0' + sign + '\xA0' +
				question.b);
			$('#progress').text(i18n.t('messages.score', {total: stats.total, skipped: stats.skipped}));
		};

		/**
		 * Creates a new question (updates the variables accordingly).
		 */
		var createNew = function () {
			var a = randomInt(config.min, config.max);
			var b = randomInt(config.min, config.max);

			var operator = getRandomOperator();
			if (operator.name === 'sub' && config.avoidNegatives) {
				// Ensure that a <= b when config.avoidNegatives is true
				var ab = a > b ? [b, a] : [a, b];
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
		};

		/**
		 * Skips the current question and creates a new one.
		 */
		var skip = function () {
			++stats.skipped;
			createNew();
		};

		/**
		 * Checks whether the input answer is correct and creates a new one if this
		 * is the case.
		 */
		var verifyAndContinue = function () {
			var userResult = parseInt($('#answer').val());
			if (!isNaN(userResult) && userResult === question.result) {
				++stats.total;
				createNew();
			}
		};

		return {
			createNew: createNew,
			skip: skip,
			verifyAndContinue: verifyAndContinue
		};
	}();

	/**
	 * Initializer of the options based on user input.
	 */
	trainer.options = function () {

		/**
		 * Error functionality.
		 */
		var error = function () {
			/** Keeps track if at least one error was added to avoid a DOM lookup. */
			var errorAdded = false;
			/**
			 * Displays an error message about a configuration.
			 * @param {String} ids The IDs of the fields/checkboxes the error is for
			 * @param {String} message The message to output
			 */
			var add = function (ids, message) {
				errorAdded = true;
				var errorDiv = $('<div class="errormessage"><span class="glyphicon glyphicon-warning-sign"></span> </div>');
				errorDiv.append(message);
				$('#options_error').append(errorDiv);
				$.each(ids, function (key, value) {
					$('#' + value).closest(".form-group").addClass('has-error');
				});
			};
			/**
			 * Returns whether an error was added since reset() was last called.
			 * @returns {Boolean} True if there is at least one error, false otherwise
			 */
			var hasErrors = function () {
				return errorAdded;
			};
			/**
			 * Removes all errors and error classes.
			 */
			var reset = function () {
				$('#options_error').text('');
				$('.has-error').removeClass('has-error');
				errorAdded = false;
			};

			return {
				add: add,
				hasErrors: hasErrors,
				reset: reset
			};
		}();

		/**
		 * Sets the min and max config parameters, ensuring that min is not greater
		 * than max.
		 * @param {Number} min The minimum number to use (or max)
		 * @param {Number} max The maximum number to use (or min)
		 */
		var registerMinAndMaxValues = function (min, max) {
			if (min > max) {
				var tmp = max;
				max = min;
				min = tmp;
				$('#rangemin').val(min);
				$('#rangemax').val(max);
			}
			config.min = min;
			config.max = max;
		};

		/**
		 * Processes the minimum and maximum option fields.
		 */
		var initializeMinAndMax = function () {

			var min = parseInt($('#rangemin').val());
			var max = parseInt($('#rangemax').val());
			var hasErrors = false;

			if (isNaN(min) || min < -9999999 || min > 9999999) {
				error.add(['rangemin'], i18n.t('errors.rangeMinInvalid', {min: -9999999, max: 9999999}));
				hasErrors = true;
			}

			if (isNaN(max) || max < -9999999 || max > 9999999) {
				error.add(['rangemax'], i18n.t('errors.rangeMaxInvalid', {min: -9999999, max: 9999999}));
				hasErrors = true;
			}

			if (!hasErrors && min >= max) {
				error.add(['rangemin', 'rangemax'], i18n.t('errors.rangeIntervalInvalid'));
				hasErrors = true;
			}

			if (!hasErrors) {
				registerMinAndMaxValues(min, max);
			}
		};

		/**
		 * Processes timer minutes field.
		 */
		var initializeMinutes = function () {
			var timerValue = parseInt($('#timerlength').val());
			if (isNaN(timerValue) || timerValue <= 0 || timerValue > 60) {
				error.add(['timerlength'], i18n.t('errors.minutesInvalid', {min: 1, max: 60}));
			} else {
				config.minutes = timerValue;
			}
		};

		/**
		 * Processes the operators the user wants to use for the training session.
		 * Note that the checkboxes in the HTML are expected to have ID #op_{name},
		 * where {name} is the operator abbreviation, e.g. #op_add or #op_div.
		 */
		var initializeOperators = function () {
			var inputOperators = [];
			for (var key in operators) {
				if (operators.hasOwnProperty(key)) {
					if ($('#op' + key).is(':checked')) {
						inputOperators.push(key);
					}
				}
			}
			if (inputOperators.length === 0) {
				error.add(['operators'], i18n.t('errors.noOperators'));
			} else {
				config.operators = inputOperators;
			}
		};

		/**
		 * Processes the checkbox to avoid negative results for subtraction.
		 */
		var initializeAvoidNegatives = function () {
			if (config.min >= 0) {
				config.avoidNegatives = $('#avoidnegatives').is(':checked');
			} else {
				config.avoidNegatives = false;
			}
		};

		/**
		 * Initializes the user options.
		 * @returns {Boolean} True if all options are valid and the trainer can be
		 *  started, false if there is an error in the input options.
		 */
		var initialize = function () {
			error.reset();
			initializeMinutes();
			initializeMinAndMax();
			initializeOperators();
			if (error.hasErrors()) {
				$('#optionserrors').show();
				return false;
			}
			$('#optionserrors').hide();
			initializeAvoidNegatives();
			return true;
		};

		return {
			initialize: initialize
		};
	}();

	/**
	 * Initializer and timer functionality.
	 */
	trainer.run = function () {
		/**
		 * Sets the score time when the timer has stopped or has been canceled.
		 * @param {?String} timeString Optional string to use as time display if the
		 *  timer was canceled
		 */
		var setScoreText = function (timeString) {
			if(!timeString) {
				timeString = config.minutes + ' ' + (config.minutes !== 1 ? i18n.t('labels.minutes') : i18n.t('labels.minute'));
			}
			$('#finalScore').text(
				i18n.t('messages.finalScore', { scoreTime: timeString, scoreTotal: stats.total, scoreSkipped: stats.skipped })
			);
		};

		/**
		 * Shows the score.
		 * @param {?String} timeString Optional string to use as time display if the
		 *  timer was canceled
		 */
		var showScore = function (timeString) {
			setScoreText(timeString);
			$('#useranswer').fadeOut(50, function () {
				$('#questions').fadeOut(function () {
					$('#score, #options').fadeIn();
				});
			});
		};

		/** The timer functionality. */
		var timer = function () {
			/**
			 * Formats the total elapsed time of the counter if it was stopped
			 * prematurely, e.g. if config.minutes = 5, we return "1:15" if the timer
			 * shows "3:45".
			 * @param {Object} event Event emitted by the timer upon cancellation
			 * @returns {String} The elapsed time as string
			 */
			var computeElapsedTime = function (event) {
				if (event.offset.seconds === 0) {
					return (config.minutes - event.offset.minutes) + ':00';
				}
				var remainingSeconds = 60 - event.offset.seconds;
				return (config.minutes - event.offset.minutes - 1) + ':' +
					(remainingSeconds < 10 ? '0' : '') + remainingSeconds;
			};

			/**
			 * Starts the timer and sets up the stopped/finished event.
			 */
			var start = function () {
				$('#timer').countdown(new Date().getTime() + config.minutes * 60000)
				.on('update.countdown', function (event) {
					$(this).text(event.strftime('%M:%S'));
				})
				// sic: the event is mistyped
				.on('stoped.countdown', function (event) {
					showScore(computeElapsedTime(event));
				})
				.on('finish.countdown', function () {
					showScore();
				});
			};

			return {
				start: start
			};
		}();

		/**
		 * Initializes the start of the trainer and transitions to the trainer view.
		 */
		var initializeTrainer = function () {
			stats.total = 0;
			stats.skipped = 0;
			$('#options').fadeOut(function () {
				$('#questions, #useranswer').fadeIn(function() {
					$("#answer").focus();
				});
			});
			$('#score').fadeOut();
			timer.start();
		};

		return {
			initializeTrainer: initializeTrainer
		};
	}();

	/* ***********
	 * Set event handlers and translation once the document is ready
	 * *********** */
	$(document).ready(function () {

		i18n.init(function(err, t) {
			$('.i18n').i18n();
			document.title = t('labels.appName');
		});

		$("input[type=number]").change(function(e) {
			var value = parseInt($(this).val());
			$(this).val(!isNaN(value) ? value : $(this).prop("defaultValue"));
		});

		$('#answer').keyup(function (e) {
			if (e.which === 32) {
				trainer.question.skip();
			} else if (e.which === 27) {
				$(this).val('');
			} else {
				trainer.question.verifyAndContinue();
			}
		});

		$("form#options").submit(function (e) {
			e.preventDefault();
			var hasValidOptions = trainer.options.initialize();
			if (hasValidOptions) {
				trainer.question.createNew();
				trainer.run.initializeTrainer();
			}
		});

		$('#skipquestion').click(function () {
			trainer.question.skip();
			$("#answer").focus();
		});

		$('#clearquestion').click(function () {
			$("#answer").val('');
			$("#answer").focus();
		});

		$('#quittooptions').click(function () {
			$('#timer').countdown('stop');
		});

		$('#start').fadeIn();
	});
})();
