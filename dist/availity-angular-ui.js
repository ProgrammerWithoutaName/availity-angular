/**
 * availity-angular v1.11.1 -- June-17
 * Copyright 2016 Availity, LLC 
 */

// Source: -v1/lib/ui/index.js


(function(root) {

  'use strict';

  var availity = root.availity || {};

  availity.MODULE_UI = 'availity.ui';
  availity.ui = angular.module(availity.MODULE_UI, ['ng', 'ngSanitize']);

  availity.ui.constant('AV_UI', {
    // jscs: disable
    NG_OPTIONS: /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/
    // jscs: enable
  });

  if(typeof module !== 'undefined' && module.exports) {
    module.exports = availity;
  }


})(window);

// Source: -v1/lib/ui/templates/template.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.factory('avTemplateCache', function($q, $templateCache, $http) {

    return {

      get: function(options) {

        var valid = !options.template || !options.templateUrl;

        if(!valid) {
          throw new Error('Either options.template or options.templateUrl must be defined for avTemplateCache');
        }

        return options.template ? $q.when(options.template) :
          $http.get(options.templateUrl, {cache: $templateCache})
            .then(function(result) {
              return result.data;
            });
      }
    };
  });

})(window);

// Source: -v1/lib/ui/modal/modal.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_MODAL', {

    OPTIONS: {
      scope: null,
      controller: null,
      controllerAs: null,
      locals: null,
      templateUrl: null,
      template: null,
      id: null,
      container: null,

      // Bootstrap defaults
      keyboard: true,
      backdrop: true,
      show: false,
      remote: false
    },

    EVENTS: {
      SHOW: 'show.av.modal',
      SHOWN: 'shown.av.modal',
      HIDE: 'hide.av.modal',
      HIDDEN: 'hidden.av.modal'
    },

    NAMESPACE: {
      MODAL: 'bs.modal'
    },

    BS_EVENTS:  {
      SHOW: 'show.bs.modal',
      SHOWN: 'shown.bs.modal',
      HIDE: 'hide.bs.modal',
      HIDDEN: 'hidden.bs.modal'
    },

    TEMPLATES: {
      MODAL: 'ui/modal/modal-tpl.html'
    }
  });

  availity.ui.factory('avModalManager', function() {

    var AvModalManager = function() {
      this.instances = [];
    };

    var proto = AvModalManager.prototype;

    proto.add = function(id) {
      this.instances.push(id);
    };

    proto.remove = function(id) {
      this.instances = _.without(this.instances, id);
    };

    proto.closeAll = function() {

      _.forEach(this.instances, function(id) {

        var $el = $('#' + id);

        if(!$el) {
          return;
        }

        var bsModal = $el.data('bs.modal');
        if(bsModal) {
          bsModal.removeBackdrop();
          bsModal.$body.removeClass('modal-open');
          bsModal.resetAdjustments();
          bsModal.resetScrollbar();
        }

        var avModal = $el.data('AvModal');
        if(avModal) {
          avModal.destroy();
        }

      });
    };

    return new AvModalManager();

  });

  var ModalFactory = function($rootScope, $timeout, $compile, $controller, $log, AV_MODAL, avTemplateCache, $q, avModalManager) {

    var Modal = function(options) {

      var self = this;

      this.templateDefer = $q.defer();
      this.templatePromise = this.templateDefer.promise;

      this.options = this._buildOptions(options);

      avTemplateCache.get(options).then(function(template) {
        self.options.template = template;
        self._build();
      });

    };

    Modal.create = function(options) {
      return new Modal(options);
    };

    var proto = Modal.prototype;

    proto._buildOptions = function (userOptions) {
      var options = angular.extend({}, AV_MODAL.OPTIONS, userOptions);

      if (!options.scope) {
        options.scope = $rootScope.$new();
      }

      if (options.controller) {
        var locals = angular.extend({ $scope: options.scope }, options.locals);

        var controller = $controller(options.controller, locals);

        if (options.controllerAs) {
          if (options.scope[options.controllerAs]) {
            $log.warn('Overwriting ' + options.controllerAs + 'on scope with AvModal controllerAs, consider passing in no scope, or specifying a different controllerAs than the existing controller');
          }
          options.scope[options.controllerAs] = controller;
        }
      }

      return options;
    };

    proto._build = function() {

      var self = this;

      var scope = this.options.scope;
      this.$element = angular.element(this.options.template);

      this._createId();

      this._scope();

      $compile(this.$element)(scope);

      $timeout(function() {
        self._init();
      }, 0, true);

      // Append to container or <body>
      this.options.container ? this.$element.appendTo(this.options.container) : this.$element.appendTo('body');

    };

    proto._init = function() {

      this.$element.data('AvModal', this);

      this.templateDefer.resolve(true);

      // Initialize Bootstrap jQuery plugin
      this.$element.modal({
        'backdrop': this.options.backdrop,
        'keyboard': this.options.keyboard,
        'show': false,
        'remote': this.options.remote
      });

      this._listeners();

      if (_.isUndefined(this.options.show) || this.options.show) {
        this.$element.modal('show');
      }
    };

    // Add helpers to scope so clients can call internal methods
    proto._scope = function() {

      var self = this;
      var scope = this.options.scope;

      scope.modalShow = function() {
        return self.show();
      };

      scope.modalToggle = function() {
        return self.toggle();
      };

      scope.modalHide = function() {
        return self.hide();
      };

    };

    proto._listeners = function() {

      var self = this;
      var scope = this.options.scope;
      var $element = this.$element;

      this.animationShowDefer = $q.defer();
      this.animationHideDefer = $q.defer();

      $element.on(AV_MODAL.BS_EVENTS.SHOW, function(event) {
        scope.$emit(AV_MODAL.EVENTS.SHOW, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.SHOWN, function(event) {

        if(angular.isFunction(self.options.onShown)) {
          self.options.onShown();
        }

        self.animationShowDefer.resolve(true);

        scope.$emit(AV_MODAL.EVENTS.SHOWN, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.HIDE, function(event) {
        scope.$emit(AV_MODAL.EVENTS.HIDE, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.HIDDEN, function(event) {

        if(angular.isFunction(self.options.onHidden)) {
          self.options.onHidden.call(this);
        }

        self.animationHideDefer.resolve(true);
        scope.$emit(AV_MODAL.EVENTS.HIDDEN, event, self);

        scope.$evalAsync(function() {
          self.destroy();
        });

      });

      // Garbage collection
      scope.$on('$destroy', function() {
        avModalManager.remove(self._id);
        self.destroy();
      });

    };

    proto.show = function() {

      var self = this;
      this.animationShowDefer = $q.defer();

      this.templatePromise.then(function() {
        self.isShown() ? self.animationShowDefer.resolve(true) : self.$element.modal('show');
      });

      return this.animationShowDefer.promise;

    };

    proto.hide = function() {

      var self = this;
      this.animationHideDefer = $q.defer();

      this.templatePromise.then(function() {
        !self.isShown() ? self.animationHideDefer.resolve(true) : self.$element.modal('hide');
      });

      return this.animationHideDefer.promise;
    };

    proto.isShown = function() {
      return this.$element.data(AV_MODAL.NAMESPACE.MODAL).isShown;
    },

    proto.toggle = function() {

      var self = this;

      return this.templatePromise.then(function() {
        return self.isShown() ? self.hide() : self.show();
      });

    };

    proto.destroy = function() {

      var self = this;

      return this.templatePromise.then(function() {
        self.$element.data('AvModal', null);
        self.$element.remove();
      });

    };

    proto._createId = function() {
      // Create a unique id for the modal if not present or passed in via options
      var id = this.$element.attr('id');
      if(!id) {
        // Get id from options or create a unique id
        id = this.options.id ? this.options.id : availity.uuid('av-modal-id');
        this.$element.attr('id', id);
      }

      this._id = id;

      avModalManager.add(id);
    };

    return Modal;
  };

  availity.ui.factory('AvModal', ModalFactory);

  availity.ui.directive('avModal', function(AV_MODAL) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {
        size: '@'
      },
      templateUrl: AV_MODAL.TEMPLATES.MODAL
    };
  });

})(window);

// Source: -v1/lib/ui/validation/form.js
/**
 * 1. All fields should be pristine on first load
 * 2. If field is modified an invalid the field should be marked with an error
 *
 */
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('avValFormController', function() {

    this.ngForm  = null;
    this.rulesKey = null;
    this.avValOn = null;
    this.avValDebounce = null;
    this.avValInvalid = false;

    // Object that stores the unique id (key) and violation count (value) of all the form fields
    //
    // EX:
    //
    // {
    //  avVal001: 0
    //  avVal002: 2
    //  avVal003: 1
    // }
    this.violations = {};

    this.init = function(form) {
      this.ngForm = form;
    };

    /**
     * Records id of the form field and number of violations
     * @param  {[type]} id    [description]
     * @param  {[type]} count [description]
     * @return {[type]}       [description]
     */
    this.record = function(id, count) {
      this.violations[id] = count;

      var violocationCount = _.reduce(this.violations, function(sum, num) {
        return sum + num;
      }, 0);

      this.ngForm.$setValidity('av', violocationCount === 0);
    };

    this.unrecord = function(id) {
      if(id && this.violations[id]) {
        delete this.violations[id];
      }
    };

    this.reset = function() {
      this.ngForm.$setPristine();
      this.ngForm.$submitted = false;
    };

    this.$setSubmitted = function() {
      this.ngForm.$submitted = true;
    };

    this.setRulesKey = function(key) {
      this.rulesKey = key;
    };

  });

  // form.$error = {};
  // form.$$success = {};
  // form.$pending = undefined;
  // form.$name = $interpolate(attrs.name || attrs.ngForm || '')($scope);
  // form.$dirty = false;
  // form.$pristine = true;
  // form.$valid = true;
  // form.$invalid = false;
  // form.$submitted = false;

  availity.ui.directive('avValForm', function($log, $timeout, $parse, AV_VAL, avValAdapter, $rootScope) {
    return {
      restrict: 'A',
      priority: 10,
      require: ['form', 'avValForm'],
      controller: 'avValFormController',
      compile: function() {
        return {
          pre: function(scope, iEl, iAttrs, controllers) {

            var ruleFn = $parse(iAttrs.avValForm);
            var rulesKey = ruleFn(scope);
            rulesKey = rulesKey || iAttrs.avValForm; // interpolated rule from scope || fixed string

            if(!rulesKey) {
              $log.error('avValForm requires a rules key in order to run the proper validation rules.');
              return;
            }

            scope.$watch(ruleFn, function(_rulesKey, _oldRulesKey) {
              if(_rulesKey) {
                avForm.setRulesKey(_rulesKey);

                if(_rulesKey !== _oldRulesKey) {
                  $timeout(function() {
                    $log.info('avValForm revalidate');
                    $rootScope.$broadcast(AV_VAL.EVENTS.REVALIDATE);
                  });
                }

              }

            });

            var ngForm = controllers[0];
            var avForm = controllers[1];

            // Allow form attributes to define the validation behavior of the form fields
            // inside it.  If `av-val-on` or `av-val-debounce` are on the form then all form
            // fields inside the form would inherit this behavior.
            avForm.avValOn = iAttrs.avValOn || null;
            avForm.avValDebounce = iAttrs.avValDebounce || null;
            // Allows fields to update with invalid data for dirty form saving
            avForm.avValInvalid = iAttrs.avValInvalid || false;

            avForm.init(ngForm);
            avForm.setRulesKey(rulesKey);

          },
          post: function(scope, iEl, iAttrs, controllers) {

            iEl.attr('novalidate', 'novalidate');  // prevent HTML5 validation from kicking in

            // Disable ng-submit or ng-click handlers and store the function to call for submitting
            var fn;
            if(iAttrs.ngSubmit) {
              // Disable ng-submit event
              iEl.off('submit');
              fn = $parse(iAttrs.ngSubmit, /* expensiveChecks */ true);
            }else if(iAttrs.ngClick) {
              // Disable ng-click event
              iEl.off('click');
              fn = $parse(iAttrs.ngClick, /* expensiveChecks */ true);
            }

            var ngForm = controllers[0];
            var avForm = controllers[1];

            scope.$on(AV_VAL.EVENTS.RESET, function () {
              avForm.reset();
            });

            iEl.bind('submit', function(event) {

              scope.$broadcast(AV_VAL.EVENTS.SUBMITTED);
              avForm.$setSubmitted();

              if(ngForm.$invalid) {

                scope.$broadcast(AV_VAL.EVENTS.FAILED);

                $log.info('avValForm invalid.  preventing default submit action');

                event.preventDefault();
                event.stopImmediatePropagation();
                scope.$broadcast(event);

                avValAdapter.scroll(iEl);
                return;
              }

              ngForm.$setPristine();

              if(!fn) {
                return;
              }

              var callback = function() {
                fn(scope, {$event:event});
              };

              scope.$apply(callback);

            });

          }
        };
      }
    };
  });


})(window);

// Source: -v1/lib/ui/validation/field.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('AvValFieldController', function($element, avValAdapter, $attrs, avVal, $log, $timeout, $scope, $sniffer) {

    this.ngModel = null;
    this.rule = null;
    this.avValForm = null;
    this.avValInvalid = false;

    var self = this;

    var placeholder = $element[0].placeholder;
    var noEvent = {};

    this.createId = function() {
      this.ngModel.avId = availity.uuid('avVal');
    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.setRule = function(rule) {
      this.rule = rule;
    };

    this.avValForm = function(avValForm) {
      this.avValForm = avValForm;
    };

    this.updateModel = function(results) {

      var self = this;
      var validationKeys = [];

      this.ngModel.avResults = results;

      // set state for each violation
      angular.forEach(results.violations, function (result) {
        var key = 'av-' + result.contraintName;
        validationKeys.push(key);
        self.ngModel.$setValidity(key, result.valid);
      });

      // set overall state for validation state
      this.ngModel.$setValidity('av', this.ngModel.avResults.isValid);

      // store violations
      this.ngModel.avViolations = this.ngModel.avResults.violations;

      // record the id and violation count in the av-form controller.  this determines if the form is
      // valid if sum of violations for all form inputs === zero
      this.avValForm.record(this.ngModel.avId, this.ngModel.avResults.violations.length);

      // remove violation keys that are no longer falsy
      angular.forEach(this.ngModel.$error, function(value, key) {

        if(_.indexOf(validationKeys, key) === -1 && key.lastIndexOf('av-', 0) === 0) {
          self.ngModel.$setValidity(key, true);
        }
      });
    };

    this.updateView = function() {
      if(this.ngModel.$dirty || $scope.avValShow) {
        avValAdapter.element($element, this.ngModel, this.ngModel.avResults.isValid);
        avValAdapter.message($element, this.ngModel);
      }
    };

    this.validate = function(value) {

      $log.info('validating value [' + value + ']');

      var rulesKey = self.avValForm.rulesKey;
      var results = avVal.validate(rulesKey, $element, value, self.rule);

      // validate function is called within the context of angular so fn.call and set the context
      // to "this"
      self.updateModel.call(self, results);
      self.updateView.call(self);

      return results;
    };

    this.validateModel = function(value) {

      self.validate(value, true);
      return value;

    };

    this.validateView = function(value) {

      var results = self.validate(value);

      if(self.avValForm.avValInvalid || self.avValInvalid) {
        // allows invalid data from view to update model for dirty saving
        return value;
      }

      // prevent invalid data from view to update model
      return results.isValid ? value : undefined;

    };

    this.onDebounce = function() {

      var value = $element.val().trim();

      if(this.isCheckbox()) {
        this.ngModel.$setViewValue($element[0].checked);
      } else if(this.isRadio()) {
        this.ngModel.$setViewValue($attrs.value);
      }else {
        this.ngModel.$setViewValue(value);
      }

    };

    this.isRadio = function() {
      return $element.is('input') && $attrs.type === 'radio';
    };

    this.isCheckbox = function() {
      return $element.is('input') && $attrs.type === 'checkbox';
    };

    this.reset = function() {

      var violations = this.ngModel.avResults.violations;
      violations.splice(0, violations.length);

      avValAdapter.message($element, this.ngModel);
      avValAdapter.reset($element);

    };

    this.event = function(event, avValDebounce) {

      var self = this;

      $element.unbind('input');

      var debounce;

      $element.on(event, function() {

        // https://github.com/angular/angular.js/blob/v1.2.27/src/ng/directive/input.js#L508
        if($sniffer.msie <= 11 && (event || noEvent).type === 'input' && $element[0].placeholder !== placeholder) {
          placeholder = $element[0].placeholder;
          return;
        }

        $timeout.cancel(debounce);
        debounce = $timeout(function() {
          $scope.$apply(function() {
            self.onDebounce();
          });
        }, avValDebounce);

      });

    };

  });

  // Events:
  //
  //  click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown
  //  keyup keypress submit focus blur copy cut paste
  availity.ui.directive('avValField', function($log, $timeout, avVal, avValAdapter, AV_VAL) {
    return {
      restrict: 'A',
      controller: 'AvValFieldController',
      require: ['^avValForm', 'ngModel', 'avValField'],
      scope: {
        avValDebounce: '@?',
        avValOn: '@?',
        avValShow: '=?'
      },
      link: function(scope, element, attrs, controllers) {

        var rule = attrs.avValField;
        var avValForm = controllers[0];
        var ngModel = controllers[1];
        var avValField = controllers[2];

        var avValOn = scope.avValOn || avValForm.avValOn || 'input';

        if(!ngModel && !rule) {
          $log.error('avValField requires ngModel and a validation rule to run.');
          return;
        }

        // Allows fields to update with invalid data for dirty form saving
        avValField.avValInvalid = attrs.avValInvalid || false;

        // CACHE THE MODEL
        avValField.setNgModel(ngModel);

        avValField.avValForm(avValForm);

        avValField.setRule(rule);

        avValField.createId();

        // DEBOUNCE
        var avValDebounce = parseInt(scope.avValDebounce || (avValForm.avValDebounce || AV_VAL.DEBOUNCE), 10);
        avValDebounce = _.isNumber(avValDebounce) ? avValDebounce : AV_VAL.DEBOUNCE;

        var debounceAllowed = !avValField.isRadio() && !avValField.isCheckbox() && avValOn !== 'blur';

        if(!debounceAllowed) {
          avValDebounce = 0;
        }

        // EVENT LISTENER
        avValField.event(avValOn, avValDebounce);

        // (view to model)
        ngModel.$parsers.push(avValField.validateView);

        // (model to view) - added to beginning of array because formatters
        // are processed in reverse order thus allowing the model to be transformed
        // before the validation framework check for validity.
        ngModel.$formatters.unshift(avValField.validateModel);

        scope.$on(AV_VAL.EVENTS.REVALIDATE, function() {
          avValField.validate(ngModel.$viewValue);
        });

        // SUBMITTED EVENT
        scope.$on(AV_VAL.EVENTS.SUBMITTED, function() {
          ngModel.$dirty = true;
          avValField.validate(ngModel.$viewValue);
        });

        // - Removes all errors on page,
        // - does not reset view or model values.  This is to be handled by the app.
        scope.$on(AV_VAL.EVENTS.RESET, function () {
          avValField.reset();
        });

        scope.$on('$destroy', function () {
          avValForm.unrecord(ngModel.avId);
        });

      }
    };
  });


})(window);

// Source: -v1/lib/ui/popover/popover.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.provider('avPopoverConfig', function() {

    var config = {
      showOnLoadHideDelay: 10000
    };

    this.set = function(options) {
      angular.extend(config, options);
    };

    this.$get = function() {
      return angular.copy(config);
    };
  });

  availity.ui.constant('AV_POPOVER', {
    NAME: 'bs.popover'
  });

  availity.ui.controller('AvPopoverController', function($element, $scope, AV_POPOVER, $timeout, avPopoverConfig) {
    this.options = angular.extend({}, avPopoverConfig);

    this.listeners = function() {

      var self = this;

      angular.forEach(['show', 'shown', 'hide', 'hidden'], function(name) {
        $element.on(name + '.bs.popover', function(ev) {
          $scope.$emit('av:popover:' + name, ev);
        });
      });

      $scope.$on('destroy', function() {
        self.destroy();
      });
    };

    this.plugin = function() {
      return $element.data(AV_POPOVER.NAME);
    };

    this.show = function() {
      $element.popover('show');
    };

    this.hide = function() {
      $element.popover('hide');
    };

    this.toggle = function() {
      $element.popover('toggle');
    };

    this.destroy = function() {
      $element.popover('destroy');
    };


    this.init = function() {

      this.listeners();

      if($scope.showOnLoad) {

        this.show();

        if($scope.delay && $scope.delay.hide) {
          $timeout(this.hide, $scope.delay.hide, false);
          return;
        }
        // If no delay is found or cannot be parsed, set a default timeout so that the popover doesn't stick around forever
        $timeout(this.hide, this.options.showOnLoadHideDelay, false);
      }
    };


  });

  availity.ui.directive('avPopover', function() {
    return {
      restrict: 'A',
      controller: 'AvPopoverController',
      scope: {
        showOnLoad: '=',
        delay: '='
      },
      link: function(scope, element, attrs, avPopover) {

        var options = {};

        scope.$evalAsync(function() {
          element.popover(angular.extend({}, options, {
            html: true
          }));
          avPopover.init();
        });
      }
    };
  });

})(window);

// Source: -v1/lib/ui/validation/container.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('avValContainerController', function($scope, $timeout) {

    this.message = function(ngModel) {

      var message = null;
      if(ngModel.avResults.violations.length && ngModel.avResults.violations[0].message) {
        message = ngModel.avResults.violations[0].message;
      }else {
        message = null;
      }

      // $timeout is needed to update the UI from $broadcast events
      $timeout(function() {
        $scope.messages.message = message;
      });

    };

  });

  availity.ui.directive('avValContainer', function() {
    return {
      restrict: 'A',
      controller: 'avValContainerController',
      template: '<p class="help-block" data-ng-bind-html="messages.message"></p>',
      replace: true,
      scope: {

      },
      link: function(scope) {
        scope.messages = _.extend({}, scope.messages, { message: null, id: null });
      }
    };
  });


})(window);

// Source: -v1/lib/ui/validation/adapter-bootstrap.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_BOOTSTRAP_ADAPTER', {
    CLASSES: {
      SUCCESS: 'has-success',
      WARNING: 'has-warning',
      ERROR: 'has-error',
      FEEDBACK: 'has-feedback',
      HELP: 'help-block',
      FORM_GROUP: '.form-group:first',
      NAVBAR: 'navbar-fixed-top'
    },
    SELECTORS: {
      CONTAINER: 'container-id',
      DATA_CONTAINER: 'data-container-id'
    },
    CONTROLLER: '$avValContainerController'
  });

  availity.ui.factory('avValBootstrapAdapter', function(AV_BOOTSTRAP_ADAPTER, $timeout, $log) {

    return {

      element: function(element, ngModel) {
        if(ngModel.$valid) {
          element.parents(AV_BOOTSTRAP_ADAPTER.CLASSES.FORM_GROUP).removeClass(AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR);
        }else {
          element.parents(AV_BOOTSTRAP_ADAPTER.CLASSES.FORM_GROUP).addClass(AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR);
        }
      },

      reset: function(element) {
        element.parents(AV_BOOTSTRAP_ADAPTER.CLASSES.FORM_GROUP).removeClass(AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR);
      },

      message: function(element, ngModel) {

        var selector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.HELP
        ].join('');

        var $el = $(element);

        var target = $el.attr(AV_BOOTSTRAP_ADAPTER.SELECTORS.CONTAINER);
        target = target || $el.attr(AV_BOOTSTRAP_ADAPTER.SELECTORS.DATA_CONTAINER);
        // default to siblings
        target = target ? $('#' + target) : $el.siblings(selector);

        if(target.length === 0) {
          $log.warn('avValBootstrapAdapter could not find validation container for {0}', [element]);
          return;
        }

        var el = target[0];
        $el = angular.element(el);
        var avValModel = $el.data(AV_BOOTSTRAP_ADAPTER.CONTROLLER); // get the av val message controller
        if(avValModel) {
          avValModel.message(ngModel);
        }
      },

      scroll: function(form) {

        // Bootstrap fixed navbars causes bad scroll-to offsets so find them all
        var navbarSelector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.NAVBAR
        ].join('');

        // Add up all the heights to find the true offset
        var offset = 0;
        $(navbarSelector).each(function() {
          offset += $(this).outerHeight();
        });

        var selector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR,
          ':first'
        ].join('');

        var $target = $(form).find(selector);
        $timeout(function() {
          // scroll to offset top of first error minus the offset of the navbars
          $('body, html').animate({scrollTop: $target.offset().top - offset}, 'fast');
        }, 0, false);
      }
    };
  });


})(window);

// Source: -v1/lib/ui/validation/adapter.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_VAL_ADAPTER', {
    DEFAULT: 'avValBootstrapAdapter'
  });

  availity.ui.provider('avValAdapter', function() {

    var that = this;

    this.setAdapter = function(adapter) {
      this.adapter = adapter;
    };

    this.$get = function(AV_VAL_ADAPTER, $injector) {

      var Adapter = function() {
        var adapterName = that.adapter || AV_VAL_ADAPTER.DEFAULT;
        this.adapter = $injector.get(adapterName);
      };

      var proto = Adapter.prototype;

      proto.element = function(element, ngModel) {
        this.adapter.element(element, ngModel);
      };

      proto.reset = function(element) {
        this.adapter.reset(element);
      };

      proto.message = function(element, ngModel) {
        this.adapter.message(element, ngModel);
      },

      proto.scroll = function(form) {
        this.adapter.scroll(form);
      };

      return new Adapter();
    };
  });

})(window);

// Source: -v1/lib/ui/dropdown/dropdown.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.provider('avDropdownConfig', function() {

    var config = {
      closeOnResize: true,
      dropdownAutoWidth: true,
      minimumResultsForSearch: 5
    };

    this.set = function(options) {
      angular.extend(config, options);
    };

    this.$get = function() {
      return angular.copy(config);
    };
  });

  availity.ui.constant('AV_DROPDOWN', {
    OPTIONS: [
      'width',
      'minimumInputLength',
      'maximumInputLength',
      'minimumResultsForSearch',
      'maximumSelectionSize',
      'placeholderOption',
      'separator',
      'allowClear',
      'multiple',
      'closeOnSelect',
      'openOnEnter',
      'id',
      'matcher',
      'sortResults',
      'formatSelection',
      'formatResult',
      'formatResultCssClass',
      'formatNoMatches',
      'formatSearching',
      'formatAjaxError',
      'formatInputTooShort',
      'formatInputTooLong',
      'formatSelectionTooBig',
      'formatLoadMore',
      'createSearchChoice',
      'createSearchChoicePosition',
      'initSelection',
      'tokenizer',
      'tokenSeparators',
      'query',
      'ajax',
      'data',
      'tags',
      'containerCss',
      'containerCssClass',
      'dropdownCss',
      'dropdownCssClass',
      'dropdownAutoWidth',
      'adaptContainerCssClass',
      'adaptDropdownCssClass',
      'escapeMarkup',
      'selectOnBlur',
      'loadMorePadding',
      'nextSearchTerm',
      'correlationId',
      'eventListeners'
    ]
  });


  availity.ui.controller('AvDropdownController', function($element, $attrs, AV_UI, AV_DROPDOWN, avDropdownConfig, $log, $scope, $timeout, $parse) {

    var self = this;
    this.options = {};
    this.match = null;
    this.ngModel = null;

    this.init = function() {

      self.options = angular.extend({}, avDropdownConfig);

      _.forEach($attrs, function(value, key) {
        if(_.contains(AV_DROPDOWN.OPTIONS, key.replace('data-', ''))) {
          self.options[key] = $scope.$eval(value);
        }
      });

      if(this.isRemoteMultiple()) {
        self.options.multiple = angular.isDefined($attrs.multiple);
      }

      self.multiple = angular.isDefined($attrs.multiple);

      if(self.options.query) {

        self.queryFn = self.options.query;
        // Function used to query results for the search term.
        self.options.query = self.query;
        // Function used to get the id from the choice object or a string representing the key under which the id is stored.
        self.options.id = self.getId;
      }

    };

    this.isRemoteMultiple = function() {
      if(angular.isDefined($attrs.multiple) && $element.get(0).tagName.toLowerCase() === 'input') {
        return true;
      }
      return false;
    };

    this.setRemoteViewValue = function(e) {

      var values = this.ngModel.$viewValue;

      if(!angular.isArray(values) || !angular.isObject(values)) {
        values = [];
      }

      if(e.added) {
        // Adding to collection
        values.push(e.added);
      } else {
        // Removing from collection
        var index = _.findIndex(values, function(value) {
          return  _.matches(e.removed)(value);
        });
        values.splice(index, 1);
      }

      this.ngModel.$setViewValue(values);

    };

    this.setViewValue = function(e) {
      this.ngModel.$setViewValue(e.added);
    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.getSelected = function(model) {

      if(self.options.query) {
        return 0;
      }

      if (!this.collection) {
        // If we're not using ng-options, the model value is just the raw value of the option, rather than an index, so return it as is.
        return model;
      }

      var items = this.collection($scope);

      var index = _.findIndex(items, function(item) {
        if (!self.valueFn) {
          return angular.equals(item, model);
        } else {
          var locals = {};
          locals[self.valueName] = item;
          var value = self.valueFn($scope, locals);
          return angular.equals(value, model);
        }
      });

      return index;

    };

    // Result:
    //
    // {
    //   "code": "252Y00000X",
    //   "value": "AGENCIES,EARLY INTERVENTION PROVIDER AGENCY,NOT APPLICABLE|Agency",
    //   "id": "252Y00000X"
    // }
    this.getId = function(result) {
      return result.id;
    };

    // Wrapper around the query function for Select2.  When the promise resolves
    // the callback
    this.query = function(options) {

      self.queryFn(options).then(function(response) {

        // Callback function that should be called with the result object. The result object:
        //
        // result.results (object) - Array of result objects. The default renderers
        //    expect objects with id and text keys. The id property is required,
        //    even if custom renderers are used. The object may also contain a children
        //    key if hierarchical data is displayed. The object may also contain a disabled
        //    boolean property indicating whether this result can be selected.
        //
        // result.more (boolean) - true if more results are available for the current
        //    search term.
        //
        // results.context (object) - A user-defined object that should be made available
        //    as the context parameter to the query function on subsequent queries to load
        //    more result pages for the same search term. See the description of
        //    options.context parameter.
        options.callback({more: response.more, results: response.results});
      });
    };

    this.setValue = function() {

      var viewValue = self.ngModel.$viewValue;
      var selected = null;
      if(viewValue !== null && viewValue !== undefined) {
        selected = this.getSelected(viewValue);
      }

      // var apply = scope.$evalAsync || $timeout;
      $timeout(function() {
        $element
          .select2('val',  (selected === null || selected === 'undefined') ? '' : selected); // null === '' for Select2
      });
    };

    this.getMultiSelected = function(viewValue) {

      var indices = [];

      if($element.get(0).tagName.toLowerCase() !== 'input') {
        var options = this.collection($scope);

        _.each(viewValue, function(savedObject) {
          var index = _.findIndex(options, function(value) {
            var temp = angular.copy(savedObject); // remove hashkeys for comparison
            return _.matches(temp)(value);
          });
          indices.push(index);
        });

      } else {

        var inputViewValues = this.ngModel.$modelValue;

        _.each(inputViewValues, function(savedObject) {

          if(_.isUndefined(savedObject.id) ) {

            if(savedObject.id || savedObject[self.options.correlationId]) {

              savedObject.id = savedObject[self.options.correlationId];

            } else {

              throw new Error('dropdown list must have a id or a alternative value to use as a id');
            }

          }

        });
      }

      if(indices.length > 0) {
        viewValue = indices;
      }

      return viewValue;

    };

    this.setValues = function() {

      var viewValue = self.ngModel.$viewValue;

      if(!angular.isArray(viewValue)) {
        viewValue = [];
      }

      if(!_.isEmpty(viewValue) && _.isObject(viewValue[0])) {
        viewValue = this.getMultiSelected(viewValue);
      }

      $timeout(function() {
        $element
          .select2('val', viewValue);
      });
    };

    this.ngOptions = function() {

      this.match = $attrs.ngOptions.match(AV_UI.NG_OPTIONS);
      if(!this.match) {
        throw new Error('Invalid ngOptions for avDropdown');
      }
      // AV_UI.NG_OPTIONS regex will parse into arrays like below:
      //
      // 0: "state.name for state in states"
      // 1: "state.name"
      // 2: undefined
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: undefined
      //
      // 0: "state.id as state.name for state in states"
      // 1: "state.id"
      // 2: "state.name"
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: undefined
      //
      // 0: "state.name for state in states track by state.id"
      // 1: "state.name"
      // 2: undefined
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: "state.id"
      //
      // 0: "person.fullName as (person.lastName + ', ' + person.firstName) for person in feeScheduleModel.persons"
      // 1: "person.fullName"
      // 2: "(person.lastName + ', ' + person.firstName)"
      // 3: undefined
      // 4: "person"
      // 5: undefined
      // 6: undefined
      // 7: "feeScheduleModel.persons"
      // 8: undefined
      //
      this.displayFn = $parse(this.match[2] || this.match[1]); // this is the function to retrieve the text to show as
      this.collection = $parse(this.match[7]);
      this.valueName = this.match[4] || this.match[6];
      this.valueFn = $parse(this.match[2] ? this.match[1] : this.valueName);
      this.keyName = this.match[5];

      $scope.$watchCollection(this.collection, function(newVal, oldVal) {
        if(angular.equals(newVal, oldVal)) {
          return;
        }

        self.setValue();

      }, true);

    };
  });

  availity.ui.directive('avDropdown', function($timeout, $log, $window) {

    return {
      restrict: 'A',
      require: ['ngModel', 'avDropdown'],
      controller: 'AvDropdownController',
      link: function(scope, element, attrs, controllers) {

        var ngModel = controllers[0];
        var avDropdown = controllers[1];

        avDropdown.setNgModel(ngModel);
        avDropdown.init();

        if(attrs.ngOptions ) {
          avDropdown.ngOptions();
        }

        ngModel.$parsers.push(function(value) {
          var parent = element.prev();
          parent
            .toggleClass('ng-invalid', !ngModel.$valid)
            .toggleClass('ng-valid', ngModel.$valid)
            .toggleClass('ng-invalid-required', !ngModel.$valid)
            .toggleClass('ng-valid-required', ngModel.$valid)
            .toggleClass('ng-dirty', ngModel.$dirty)
            .toggleClass('ng-pristine', ngModel.$pristine);
          return value;
        });

        element.on('change', function(e) {

          // special case since the ajax handling doesn't bind to the model correctly
          // this has to do with select2 (v3.5.2) using a hidden field instead of a select for ajax
          if(avDropdown.options.query) {
            $timeout(function() {
              // look at moving this to the controller
              if(avDropdown.isRemoteMultiple()) {
                avDropdown.setRemoteViewValue(e);
              } else {
                avDropdown.setViewValue(e);
              }

            }, false, 0);
          }

          $log.info(e);

        });

        // fires ng-focus when select2-focus fires.
        element.on('select2-focus', function() {
          if(attrs.ngFocus) {
            scope.$eval(scope.$eval(attrs.ngFocus));
          }
        });

        // fires ng-blur when select2-blur occurs.
        element.on('select2-blur', function() {
          if(attrs.ngBlur) {
            scope.$eval(scope.$eval(attrs.ngBlur));
          }
        });

        // https://github.com/t0m/select2-bootstrap-css/issues/37#issuecomment-42714589
        element.on('select2-open', function () {
          // look for .has-success, .has-warning, .has-error
          // (really look for .has-* … which is good enough for the demo page, but obviously might interfere with other CSS-classes starting with "has-")
          if(element.parents('[class*="has-"]').length) {

            // get all CSS-classes from the element where we found "has-*" and collect them in an array
            var classNames = $(this).parents('[class*="has-"]')[0].className.split(/\s+/);

            // go through the class names, find "has-"
            for(var i = 0; i < classNames.length; ++i) {
              if(classNames[i].match('has-')) {
                $('#select2-drop').addClass(classNames[i]);
              }
            }
          }
        });

        var _$render = ngModel.$render;
        ngModel.$render = function() {
          _$render();

          if(avDropdown.multiple) {
            avDropdown.setValues();
          }else {
            avDropdown.setValue();
          }

        };

        if(avDropdown.options.closeOnResize) {

          var win = angular.element($window);
          win.bind('resize', function() {
            element.select2('close');
          });

        }

        attrs.$observe('disabled', function (value) {
          element.select2('enable', !value);
        });

        attrs.$observe('readonly', function (value) {
          element.select2('readonly', !!value);
        });

        scope.$on('$destroy', function() {
          element.off();
          element.select2('destroy');
        });

        $timeout(function() {
          element.select2(avDropdown.options);
        });

        // If event listeners are specified in the options, set them up here
        if (_.get(avDropdown, 'options.eventListeners')) {
          _.each(avDropdown.options.eventListeners, function(listener, eventId) {
            if (_.isFunction(listener)) {
              element.on(eventId, listener);
            }
          });
        }
      }
    };
  });

})(window);

// Source: -v1/lib/ui/datepicker/datepicker.js
/**
 * Inspiration https://github.com/mgcrea/angular-strap/blob/v0.7.8/src/directives/datepicker.js
 */
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.provider('avDatepickerConfig', function() {

    var config = {
      autoclose: true,
      todayHighlight: true,
      format: 'mm/dd/yyyy',
      forceParse: false
    };

    this.set = function(options) {
      angular.extend(config, options);
    };

    this.$get = function() {
      return angular.copy(config);
    };

  });

  // Options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html
  availity.ui.constant('AV_DATEPICKER', {
    CONTROLLER: '$ngModelController',
    ADD_ON_SELECTOR: '[data-toggle="datepicker"]',
    OPTIONS: [
      'autoclose',
      'beforeShowDay',
      'beforeShowMonth',
      'calendarWeeks',
      'clearBtn',
      'toggleActive',
      'container',
      'daysOfWeekDisabled',
      'datesDisabled',
      'defaultViewDate',
      'endDate',
      'forceParse',
      'format',
      'inputs',
      'keyboardNavigation',
      'language',
      'minViewMode',
      'multidate',
      'multidateSeparator',
      'orientation',
      'startDate',
      'startView',
      'todayBtn',
      'todayHighlight',
      'weekStart',
      'showOnFocus',
      'disableTouchKeyboard',
      'enableOnReadonly',
      'modelFormat'
    ],
    DEFAULTS: {
      MODELFORMAT: 'YYYY-MM-DD'
    }
  });

  availity.ui.controller('AvDatepickerController', function($element, $attrs, AV_DATEPICKER, $scope, avDatepickerConfig) {

    var self = this;
    this.options = {};

    this.setValue = function() {

      var viewValue = self.ngModel.$viewValue;
      var plugin = this.plugin();

      if(!viewValue || !plugin) {
        return;
      }

      plugin.setDate(viewValue);
    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.findModel = function() {

      var ngModel = null;

      var $input = $element.find('input:first').andSelf();
      if($input.length) {
        ngModel = $input.data(AV_DATEPICKER.CONTROLLER);
        this.setNgModel(ngModel);
      }

      return ngModel;
    };

    this.modelToView = function(isoWrap) {
      var viewValue = $.fn.datepicker.DPGlobal.formatDate(isoWrap, self.options.format, 'en');
      return viewValue;
    };

    this.wrapIsoDate = function() {

      var date = self.ngModel.$modelValue;
      var isoWrap;

      if(date !== undefined && date !== null) {
        var m = moment(date);
        isoWrap = m.isValid() ? m.toDate() : null;
      }

      return isoWrap;
    };

    this.viewToModel = function() {
      var format = $.fn.datepicker.DPGlobal.parseFormat(self.options.format);
      var utcDate = $.fn.datepicker.DPGlobal.parseDate(self.ngModel.$viewValue, format, 'en');

      var plugin = self.plugin();

      if(!plugin) {
        return;
      }

      // jscs: disable
      var localDate = plugin._utc_to_local(utcDate);
      // jscs: enable

      if(self.options.modelFormat && localDate) {
        localDate = moment(localDate).format(self.options.modelFormat);
      }

      return localDate;
    };

    this.init = function() {

      self.options = angular.extend({}, avDatepickerConfig);

      _.forEach($attrs, function(value, key) {
        if(_.contains(AV_DATEPICKER.OPTIONS, key.replace('data-', ''))) {
          self.options[key] = $scope.$eval(value);
        }
      });

      if(self.options.modelFormat && self.options.modelFormat.toLowerCase() === 'default') {
        self.options.modelFormat = AV_DATEPICKER.DEFAULTS.MODELFORMAT;
      }
    };

    this.plugin = function() {
      return $element.data('datepicker');
    };

    this.destroy = function() {
      var plugin = this.plugin();
      if(plugin) {
        plugin.remove();
        $element.data('datepicker', null);
      }
    };

    this.hide = function() {
      var plugin = this.plugin();
      if(plugin) {
        plugin.hide();
      }
    };
  });

  availity.ui.directive('avDatepicker', function($window, $log, AV_DATEPICKER) {
    return {
      restrict: 'A',
      require: ['ngModel', 'avDatepicker'],
      controller: 'AvDatepickerController',
      link: function(scope, element, attrs, controllers) {

        var ngModel = controllers[0];
        var avDatepicker = controllers[1];

        if(!ngModel) {
          ngModel = avDatepicker.findModel();
          if(!ngModel) {
            $log.error('avDatepicker requires ngModel');
            return;
          }
        }

        avDatepicker.init();
        avDatepicker.setNgModel(ngModel);

        element.on('changeDate', function(e) {
          $log.info('avDatepicker changeDate {0}', [e]);
        });

        // (view to model)
        ngModel.$parsers.push(avDatepicker.viewToModel);

        // (model to view) - added to end of formatters array
        // because they are processed in reverse order.
        // if the model is in Date format and send to the validation framework
        // prior to getting converted to the expected $viewValue format,
        // the validation will fail.
        ngModel.$formatters.push(avDatepicker.modelToView);
        ngModel.$formatters.push(avDatepicker.wrapIsoDate);

        var _$render = ngModel.$render;
        ngModel.$render = function() {
          _$render();
          avDatepicker.setValue();
        };

        var win = angular.element($window);

        win.bind('scroll', function() {
          avDatepicker.hide();
        });

        var target = element.siblings(AV_DATEPICKER.ADD_ON_SELECTOR);
        if(target.length) {
          target.on('click.datepicker', function() {
            if(!element.prop('disabled')) { // Hack check for IE 8
              element.focus();
            }
          });
        }

        scope.$on('destroy', function() {
          avDatepicker.destroy();
          if(target.length) {
            target.off('click.datepicker');
          }
        });

        scope.$evalAsync(function() {
          element.datepicker(avDatepicker.options);
        });
      }
    };
  });
})(window);

// Source: -v1/lib/ui/idle/idle-notifier.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_UI_IDLE', {
    EVENTS: {
      OK: 'mousedown.av.idle.notifier'
    },
    TEMPLATES: {
      BASE: 'ui/idle/idle-tpl.html',
      SESSION: 'ui/idle/idle-session-tpl.html',
      WARNING: 'ui/idle/idle-warning-tpl.html'
    }
  });

  availity.ui.provider('avIdleNotifier', function() {

    var sessionTemplate;
    var warningTemplate;
    var $scope;

    this.setSessionTemplate = function(template) {
      sessionTemplate = template;
    };

    this.setWarningTemplate = function(template) {
      warningTemplate = template;
    };

    this.$get = function(AV_IDLE, AV_UI_IDLE, $rootScope, AvModal, $document, $timeout) {

      var AvIdleNotifier = function() {
        this.listeners = [];
        this.modal = null;
      };

      var proto = AvIdleNotifier.prototype;

      proto.init = function() {

        $scope = $rootScope.$new(true);
        $scope.idle = {};

        this.initListeners();
      };

      proto.initListeners = function() {

        var self = this;
        var listener = null;

        // ACTIVE IDLING
        listener = $rootScope.$on(AV_IDLE.EVENTS.IDLE_ACTIVE, function() {
          self.showWarning();
        });
        this.listeners.push(listener);

        // INACTIVE IDLING
        listener = $rootScope.$on(AV_IDLE.EVENTS.IDLE_INACTIVE, function() {
          self.hideWarning();
        });
        this.listeners.push(listener);

        // SESSION TIMEOUT OUT
        listener = $rootScope.$on(AV_IDLE.EVENTS.SESSION_TIMEOUT_ACTIVE, function() {
          self.showSession();
        });
        this.listeners.push(listener);

      };

      proto.destroyListeners = function() {
        // turn off each listener @see http://stackoverflow.com/a/14898795
        _.each(this.listeners, function(listener) {
          listener();
        });
      };

      proto.showWarning = function() {

        var self = this;

        if(this.modal !== null) {
          return;
        }

        $scope = $rootScope.$new(true);
        $scope.idle = {};
        $scope.idle.template = AV_UI_IDLE.TEMPLATES.WARNING;

        this.modal = new AvModal({
          show: true,
          scope: $scope,
          backdrop: 'static',
          templateUrl: AV_UI_IDLE.TEMPLATES.BASE
        });

        $document.find('body').on(AV_UI_IDLE.EVENTS.OK, function() {
          self.hideWarning();
        });

      };

      proto.hideWarning = function() {
        if(this.modal) {
          this.disableBackDrop();
          this.modal.hide();
        }

        this.modal = null;
      };

      proto.disableBackDrop = function() {
        $document.find('body').off(AV_UI_IDLE.EVENTS.OK);
      };

      proto.showSession = function() {
        var self = this;
        this.disableBackDrop();

        $timeout(function() {
          $scope.idle.template = AV_UI_IDLE.TEMPLATES.SESSION;
          $scope.idle.onSessionTimeout = _.bind(self.onSessionTimeout, self);
        }, 0, true);

      };

      proto.onSessionTimeout = function() {
        $rootScope.$broadcast(AV_IDLE.EVENTS.SESSION_TIMEOUT_REDIRECT);
      };

      return new AvIdleNotifier();

    };

  });

  availity.ui.run(function(avIdleNotifier) {
    avIdleNotifier.init();
  });

})(window);

// Source: -v1/lib/ui/mask/mask.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_MASK', {
    NAME: 'inputmask',
    DEFAULTS: {
      date: '99/99/9999',
      phone: '(999) 999-9999',
      SSN:'999-99-9999'
    }
  });

  availity.ui.directive('avMask', function($window, $log, AV_MASK) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs) {

        var maskType = AV_MASK.DEFAULTS[attrs['avMask']];
        if(!maskType) {
          maskType = attrs['avMask'];
        }

        scope.$evalAsync(function() {
          element.inputmask(maskType);
        });

        scope.$on('$destroy', function () {
          element.inputmask('remove');
        });
      }
    };
  });

})(window);

// Source: -v1/lib/ui/permissions/has-permission.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('AvHasPermissionController', function($element) {

    this.onSuccess = function(isAuthorized) {
      if(isAuthorized) {
        $element.removeClass('ng-hide');
        $element.show();
      } else {
        $element.remove();
      }
    };

    this.onError = function() {
      $element.remove();
    };

  });

  availity.ui.directive('avHasPermission', function(avUserAuthorizations) {
    return {
      restrict: 'EA',
      controller: 'AvHasPermissionController',
      require: ['avHasPermission'],
      link: function($scope, $element, $attr, controllers) {

        var avHasPermission = controllers[0];

        $element.hide();

        $scope.$watch($attr.avHasPermission, function(permissions) {

          if(!angular.isArray(permissions)) {
            permissions = _.words('' + permissions);
          }

          avUserAuthorizations.isAnyAuthorized(permissions).then(avHasPermission.onSuccess, avHasPermission.onError);
        });
      }
    };
  });

})(window);

// Source: -v1/lib/ui/analytics/analytics.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.directive('avAnalytics', function() {
    return {
      scope: {
        options: '=avAnalytics'
      },
      controller: function($scope) {
        this.getOptions = function() {
          return $scope.options;
        };
      }
    };
  });

  availity.ui.controller('AvAnalyticsController', function(avAnalyticsUtils, avAnalytics) {

    this.onEvent = function(event, element, options) {

      // convert the directive attributes into object with properties with sane defaults
      var properties = angular.extend(
        {
          level: 'info',
          label: element.text()
        },
        options,
        {
          event: event.type
        }
      );

      // If an external link is detected
      if(avAnalyticsUtils.isExternalLink(properties)) {
        event.preventDefault();
        event.stopPropagation();
      }

      var promise = avAnalytics.trackEvent(properties);
      promise['finally'](function() {
        if(avAnalyticsUtils.isExternalLink(properties)) {
          document.location = element.attr('href');
        }
      });
    };

  });

  availity.ui.directive('avAnalyticsOn', function(AV_ANALYTICS, avAnalyticsUtils) {
    return {
      restrict: 'A',
      controller: 'AvAnalyticsController',
      require: ['avAnalyticsOn','?^avAnalytics'],
      link: function(scope, element, attrs, controllers) {
        var childCtrl = controllers[0];
        var parentCtrl = {};
        var parentOptions = {};

        if (controllers[1])  {
          parentCtrl = controllers[1];
          parentOptions = parentCtrl.getOptions();
        }

        var eventType = attrs.avAnalyticsOn || AV_ANALYTICS.EVENTS.DEFAULT;

        element.on(eventType, function(event) {
          if(parentCtrl.getOptions) {
            parentOptions = parentCtrl.getOptions();
          }

          var options = angular.extend(
            {},
            parentOptions,
            avAnalyticsUtils.getProperties(attrs)
          );

          childCtrl.onEvent(event, element, options);
        });
      }
    };
  });
})(window);

// Source: -v1/lib/ui/placeholder/placeholder.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.requires.push('ng.shims.placeholder');

  availity.ui.config(function($provide) {

    $provide.decorator('placeholderDirective', ['$delegate', '$log', function($delegate, $log) {

      var directive = $delegate[0];
      var originalLink = directive.link;

      var newLink = function(scope, element, attrs) {

        if(originalLink && _.contains(_.keys(attrs), 'avMask')) {
          $log.info('placeholder shim not running on an element due to avMask on same element');
          return;
        }else if(originalLink) {
          originalLink.apply(this, arguments);
        }
        //else originalLink doesn't exist
      };

      directive.compile = function() {
        return newLink;
      };

      return $delegate;
    }]);

  });
})(window);

// Source: -v1/lib/ui/breadcrumbs/breadcrumbs.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_BREADCRUMBS', {

    TEMPLATE: 'ui/breadcrumbs/breadcrumbs-tpl.html'
  });

  function AvBreadcrumbsController($state) {

    this.getBreadcrumb = function(breadcrumbs, state) {
      if(!state || !state.data) {
        return;
      }

      var breadcrumb = state.data.breadcrumb;
      if(!breadcrumb) {
        return;
      }

      if(breadcrumb.parent) {
        var parentState = $state.get(breadcrumb.parent);

        if(parentState) {
          this.getBreadcrumb(breadcrumbs, parentState);
        }
      }
      breadcrumb.state = state.name;
      breadcrumbs.push(breadcrumb);
    };

    this.getBreadcrumbs = function() {
      var breadcrumbs = [];
      this.getBreadcrumb(breadcrumbs, $state.current);
      return breadcrumbs;
    };

  }

  AvBreadcrumbsController.$inject = ['$state'];
  availity.ui.controller('AvBreadcrumbsController', AvBreadcrumbsController);

  function avBreadcrumbs(AV_BREADCRUMBS) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: AV_BREADCRUMBS.TEMPLATE,
      controller: 'AvBreadcrumbsController',
      link: function(scope, element, attrs, avBreadcrumbs) {
        scope.breadcrumbs = avBreadcrumbs.getBreadcrumbs();

        scope.$on('$stateChangeSuccess', function() {
          scope.breadcrumbs = avBreadcrumbs.getBreadcrumbs();
        });
      }
    };
  }

  avBreadcrumbs.$inject = ['AV_BREADCRUMBS'];
  availity.ui.directive('avBreadcrumbs', avBreadcrumbs);

})(window);

// Source: -v1/lib/ui/filters/approximate.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.filter('avApproximate', function() {
    var pow = Math.pow;
    var floor = Math.floor;
    var abs = Math.abs;
    var log = Math.log;

    function round(number, precision) {
      var prec = pow(10, precision);
      return Math.round(number * prec) / prec;
    }

    return function (number, precision) {
      precision = precision || 0;
      var base = floor(log(abs(number)) / log(1000));
      var unit = 'kMGTPE'[base - 1];
      return unit ? round(number / pow(1000, base), precision) + unit : (number || 0);
    };
  });

})(window);

// Source: -v1/lib/ui/badge/badge.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_BADGE', {
    COLOR: null,
    DEFAULT_CLASS: 'badge',
    SHOW_WHEN_ZERO: false,
    TEMPLATE: 'ui/badge/badge-tpl.html'
  });

  function badgeDirective(AV_BADGE) {

    return {
      scope: {
        color: '@',
        count: '=avBadge',
        showWhenZero: '@'
      },
      templateUrl: AV_BADGE.TEMPLATE,
      link: function(scope, element) {
        scope.color = scope.color || AV_BADGE.COLOR;
        scope.showWhenZero = scope.showWhenZero || AV_BADGE.SHOW_WHEN_ZERO;

        var classes = [];
        classes.push(AV_BADGE.DEFAULT_CLASS);
        if(scope.color) {
          classes.push(scope.color);
        }

        element.addClass(classes.join(' '));
      }
    };
  }

  badgeDirective.$inject = ['AV_BADGE'];
  availity.ui.directive('avBadge', badgeDirective);

})(window);

// Source: -v1/lib/ui/labels/removable-label.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_REMOVABLE_LABEL', {
    TEMPLATE: 'ui/labels/removable-label-tpl.html'
  });

  availity.ui.directive('avRemovableLabel', function(AV_REMOVABLE_LABEL) {
    return {
      templateUrl: AV_REMOVABLE_LABEL.TEMPLATE,
      transclude: true,
      scope: {
        removeValue: '=',
        onRemove: '&'
      },
      link: function(scope, element, attrs) {
        element.addClass('label-remove');
        scope.removeLabel = function() {
          if(!attrs.disabled) {
            scope.onRemove()(scope.removeValue);
          }
        };
      }
    };
  });

})(window);

// Source: -v1/lib/ui/animation/loader.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_LOADER', {

    TEMPLATES: {
      LOADER: 'ui/animation/loader-tpl.html'
    }

  });

  availity.ui.controller('AvLoaderController', function($element) {

    var self = this;
    var active;

    this.start = function() {
      active = true;
      this.animate();
    };

    this.animate = function() {

      $element
        .find('.loading-bullet')
        .velocity('transition.slideRightIn', { stagger: 250 })
        .velocity({ opacity: 0 }, {
          delay: 750,
          duration: 500,
          complete: function() {
            if(active) {
              setTimeout(function() {self.animate();}, 500);
            } else {
              self.endAnimation();
            }
          }
        });

    };

    this.endAnimation = function() {
      $element.find('.loading-bullet').velocity('stop', true);
      $element.removeData();
    };

    this.stop = function() {
      active = false;
    };

  });

  availity.ui.directive('avLoader', function(AV_LOADER) {
    return {
      restrict: 'A',
      replace: true,
      controller: 'AvLoaderController',
      require: 'avLoader',
      templateUrl: AV_LOADER.TEMPLATES.LOADER,
      link: function(scope, element, attr, avLoader) {

        if(!attr.delay) {
          avLoader.start();
        }

        scope.$on('$destroy', function() {
          avLoader.stop();
        });

      }
    };
  });

})(window);

// Source: -v1/lib/ui/block/block.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_BLOCK', {
    TEMPLATES: {
      BLOCK: 'ui/block/block-tpl.html'
    }
  });

  var getLoaderController = function(blockId) {
    var el = $('[data-block-ui="' + blockId + '"]') || $('[block-ui="' + blockId + '"]');
    if(el) {
      return el.find('[data-av-loader]').controller('avLoader');
    }
  };

  var triggerLoaderController = function(id, instance, fn) {

    var controller = instance.loaderController;
    if(!controller) {
      controller = getLoaderController(id);
      instance.loaderController = controller;
    }
    if(controller && _.isFunction(controller[fn])) {
      controller[fn]();
    }

  };

  var triggerInstance = function(id, instance, origFn, loaderFn) {
    triggerLoaderController(id, instance, loaderFn);
    origFn.apply(instance);
  };

  var modifyBlockInstances = function(id, instance) {

    var origStartFn = instance.start;
    var origStopFn = instance.stop;

    instance.start = function() {
      triggerInstance(id, instance, origStartFn, 'start');
    };

    instance.stop = function() {
      triggerInstance(id, instance, origStopFn, 'stop');
    };

    instance.startLoader = function() {
      triggerLoaderController(id, instance, 'start');
    };

    instance.avModifications = true;
  };

  availity.ui.run(function($injector, $log, AV_BLOCK) {

    try {

      var blockUIConfig = $injector.get('blockUIConfig');
      var blockUI = $injector.get('blockUI');
      blockUIConfig.autoBlock = false;
      blockUIConfig.delay = 0;
      blockUIConfig.templateUrl = AV_BLOCK.TEMPLATES.BLOCK;

      var origGetFn = blockUI.instances.get;
      blockUI.instances.get = function(id) {
        var instance = origGetFn(id);
        if(!instance.avModifications) {
          modifyBlockInstances(id, instance);
        }
        return instance;
      };

    } catch(e) {
      $log.warn('blockUI is required to use av block.');
    }
  });

})(window);

// Source: -v1/lib/ui/block/block-directive.js
(function(root) {

  'use strict';

  var availity = root.availity;

  // Helper directive that hooks into block-ui's start-up lifecycle and starts the loader
  availity.ui.directive('avBlockUi', function(blockUI) {

    return {
      restrict: 'A',
      link: function($scope, $element, $attrs) {

        var blockId = $attrs.avBlockUi;
        var blockCount = $attrs.blockCount;
        var instance = blockUI.instances.get(blockId);
        if(blockCount > 0) {
          instance.startLoader();
        }
      }
    };

  });

})(window);

// Source: -v1/lib/ui/tabs/tabs.js
/*
* Inspired by https://github.com/angular-ui/bootstrap/blob/master/src/tabs/tabs.js
*/
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_TABS', {
    TEMPLATES: {
      TABS: 'ui/tabs/tabs-tpl.html',
      TAB: 'ui/tabs/tab-tpl.html'
    }
  });

  function TabsController($scope) {

    var self = this;

    $scope.tabs = [];
    self.tabs = $scope.tabs;

    this.addTab = function(tab) {
      self.tabs.push(tab);

      if(self.tabs.length === 1) {
        tab.active = true;
      } else if(tab.active) {
        self.selectTab(tab);
      } else {
        tab.active = false;
      }
    };

    this.removeTab = function(tab) {
      var index = self.tabs.indexOf(tab);

      if(tab.active && self.tabs.length > 1) {
        //If this is the last tab, select the previous tab. else, the next tab.
        var newActiveIndex = index === self.tabs.length - 1 ? index - 1 : index + 1;
        self.selectTab(self.tabs[newActiveIndex]);
      }

      self.tabs.splice(index, 1);
    };

    this.selectTab = function(selectedTab) {
      angular.forEach(self.tabs, function (tab) {
        if(tab.active && tab !== selectedTab) {
          tab.active = false;
          tab.onDeselect();
        }
      });

      selectedTab.active = true;
      selectedTab.onSelect();
    };
  }

  TabsController.$inject = ['$scope'];
  availity.ui.controller('AvTabsController', TabsController);

  function TabsDirective(AV_TABS) {
    return {
      restrict: 'AE',
      templateUrl: AV_TABS.TEMPLATES.TABS,
      transclude: true,
      replace: true,
      controller: 'AvTabsController',
      scope: true,
      link: function(scope, element, attrs) {
        scope.justified = !!attrs.justified;
        scope.tabType = attrs.tabType;
        scope.vertical = !!attrs.vertical;

        if(angular.isUndefined(attrs.padContent)) {
          scope.padContent = true;
        }
      }
    };
  }

  TabsDirective.$inject = ['AV_TABS'];
  availity.ui.directive('avTabs', TabsDirective);

  function TabDirective(AV_TABS) {
    return {
      restrict: 'AE',
      templateUrl: AV_TABS.TEMPLATES.TAB,
      replace: true,
      require: '^avTabs',
      transclude: true,
      scope: {
        heading: '@',
        template: '=',
        templateUrl: '=',
        onSelect: '&select',
        onDeselect: '&deselect'
      },
      controller: function() {
        // Allow avTabs to be required by other directives
      },
      link: function(scope, element, attrs, tabsController, transclude) {
        scope.transcludeFn = transclude;

        tabsController.addTab(scope);

        scope.$on('destroy', function() {
          tabsController.removeTab(scope);
        });

        scope.select = function() {
          if(!scope.disabled) {
            tabsController.selectTab(scope);
          }
        };

        scope.$watch('active', function(active) {
          if(active) {
            tabsController.selectTab(scope);
          }
        });

        if(angular.isDefined(attrs.active)) {
          scope.active = attrs.active;

          scope.$parent.$watch(attrs.active, function(active) {
            if(active) {
              tabsController.selectTab(scope);
            }
          });
        }

        if(angular.isDefined(attrs.disable)) {
          scope.$parent.$watch(attrs.disable, function(disabled) {
            scope.disabled = !!disabled;
          });
        }
      }
    };
  }

  TabDirective.$inject = ['AV_TABS'];
  availity.ui.directive('avTab', TabDirective);

  function TabPaneDirective(avTemplateCache, $compile) {
    return {
      restrict: 'AE',
      require: '^avTabs',
      link: function(scope, element, attrs) {

        var tab = scope.$eval(attrs.avTabPane);

        if(angular.isDefined(tab.template) || angular.isDefined(tab.templateUrl)) {
          avTemplateCache.get(tab)
          .then(function(template) {
            element.append($compile(template)(scope));
          });
        } else {
          tab.transcludeFn(tab.$parent, function(contents) {
            angular.forEach(contents, function(node) {
              element.append(node);
            });
          });
        }
      }
    };
  }

  TabPaneDirective.$inject = ['avTemplateCache', '$compile'];
  availity.ui.directive('avTabPane', TabPaneDirective);

})(window);

// Source: -v1/lib/ui/scroll-pagination/scroll-pagination.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_SCROLL_PAGINATION', {
    TEMPLATE: 'ui/scroll-pagination/scroll-pagination-tpl.html',
    DEFAULT_OPTIONS: {
      limit: 50,
      offset: 0,
      maxCached: 100,
      loadMoreText: 'Load more items',
      entryIdAttribute: 'id',
      apiParams: {},
      beforePageLoad: undefined,
      afterPageLoad: undefined
    }
  });


  availity.ui.factory('avScrollPaginationService', function($log) {
    function AvScrollPaginationService() {
      this.instances = {};
    }

    var proto = AvScrollPaginationService.prototype;

    proto.registerInstance = function(instanceInterface, id) {
      if (this.instances[id]) {
        $log.warn('Found existing instance with id ' + id);
      }
      this.instances[id] = instanceInterface;
    };

    proto.unregisterInstance = function(id) {
      delete this.instances[id];
    };

    proto.resetInstance = function(id) {
      if (this.instances[id]) {
        this.instances[id].reset();
        return true;
      }
      return false;
    };

    return new AvScrollPaginationService();
  });

  availity.ui.controller('AvScrollPaginationController', function($scope, $element, $timeout, $log, AV_SCROLL_PAGINATION, blockUI, avScrollPaginationService) {

    var self = this;

    this.buildOptions = function() {
      $scope._options = {};
      _.extend($scope._options, AV_SCROLL_PAGINATION.DEFAULT_OPTIONS, $scope.options || {});
      $scope._options.lowOffset = $scope._options.offset;
      $scope._options.highOffset = $scope._options.offset;
    };

    var originalEntries = angular.copy($scope.entries);
    this.buildOptions();

    this.updateButtonVisibilityFlags = function(data) {
      $scope.showNext = $scope._options.highOffset + data.count < data.totalCount;
      $scope.showPrev = $scope._options.lowOffset > 0;
    };

    this.disableVisibilityFlags = function() {
      $scope.showNext = false;
      $scope.showPrev = false;
    };

    this.loadEntries = function(prepend) {
      var block = blockUI.instances.get('scroll-pagination-block-' + $scope.avScrollPagination);
      self.disableVisibilityFlags();
      block.start();
      if (_.isFunction($scope._options.beforePageLoad)) {
        $scope._options.beforePageLoad($scope._options);
      }
      var params = {};
      _.extend(params, $scope._options.apiParams, {limit: $scope._options.limit, offset: $scope._options.offset});
      $scope.apiResource.query({params: params}).then(function(response) {
        var responseData = self.getResponseData(response);
        if ($scope._options.afterPageLoad) {
          $scope._options.afterPageLoad(responseData);
        }
        if (responseData && responseData[$scope._options.resourceId]) {
          self.addEntries(responseData[$scope._options.resourceId], prepend);
        }
        self.updateButtonVisibilityFlags(responseData);
        block.stop();
      }, function() {
        $log.error('API call failed');
        block.stop();
      });
    };

    this.getResponseData = function(data) {
      if (data) {
        if ($scope._options.responseKey) {
          var keys = $scope._options.responseKey.split('.');
          var nestedData = data;
          var noData = false;
          _.each(keys, function(key) {
            if (!noData) {
              nestedData = nestedData[key];
              if (!nestedData) {
                noData = true;
              }
            }
          });
          return noData ? [] : nestedData;
        } else {
          return data;
        }
      }
      return [];
    };

    this.addEntries = function(entries, prepend) {
      var oldEntries = angular.copy($scope.entries);
      if (prepend) {
        $scope.entries.unshift.apply($scope.entries, entries);
      } else {
        $scope.entries.push.apply($scope.entries, entries);
      }
      if ($scope.entries.length > $scope._options.maxCached) {
        var diff = $scope.entries.length - $scope._options.maxCached;
        var trackedElementId;
        if (prepend) {
          $scope.entries = $scope.entries.slice(0, $scope._options.maxCached);
          $scope._options.highOffset -= diff;
          trackedElementId = oldEntries[oldEntries.length-diff-1] ? oldEntries[oldEntries.length-diff-1][$scope._options.entryIdAttribute] : undefined;
        } else {
          $scope.entries = $scope.entries.slice(diff, $scope.entries.length);
          $scope._options.lowOffset += diff;
          trackedElementId = oldEntries[diff] ? oldEntries[diff][$scope._options.entryIdAttribute] : undefined;
        }
        self.autoscroll(trackedElementId, prepend);
      }
    };

    this.autoscroll = function(trackedElementId, prepend) {
      if (trackedElementId) {
        var trackedElement = $element.find('#'+trackedElementId);
        var trackedElementTop = trackedElement.offset().top;
        $timeout(function() {
          var newScrollTop = $element.scrollTop() + trackedElement.offset().top - trackedElementTop;
          $element.animate({scrollTop: newScrollTop}, 0);
        }, 0, false);
      } else {
        $timeout(function() {
          if (prepend) {
            $element.animate({scrollTop: $element.prop('scrollHeight')}, 0);
          } else {
            $element.animate({scrollTop: 0}, 0);
          }
        }, 0, false);
      }
    };

    this.loadPrev = function() {
      $scope._options.lowOffset -= $scope._options.limit;
      $scope._options.offset = $scope._options.lowOffset;
      self.loadEntries(true);
    };

    this.loadNext = function() {
      $scope._options.highOffset += $scope._options.limit;
      $scope._options.offset = $scope._options.highOffset;
      self.loadEntries();
    };

    avScrollPaginationService.registerInstance({
      reset: function() {
        $element.animate({scrollTop: 0}, 0);
        $scope.entries = angular.copy(originalEntries);
        self.buildOptions();
        self.loadEntries();
      }},
      $scope.avScrollPagination
    );

    $scope.$on('$destroy', function() {
      avScrollPaginationService.unregisterInstance($scope.avScrollPagination);
    });

    $scope.loadPrev = self.loadPrev;
    $scope.loadNext = self.loadNext;

    this.loadEntries();
  });



  availity.ui.directive('avScrollPagination', function($log, AV_SCROLL_PAGINATION) {
    return {
      restrict: 'A',
      controller: 'AvScrollPaginationController',
      transclude: true,
      templateUrl: AV_SCROLL_PAGINATION.TEMPLATE,
      scope: {
        apiResource: '=',
        entries: '=',
        options: '=',
        avScrollPagination: '@'
      },
      link: function($scope) {
        if (!$scope.avScrollPagination) {
          $log.error('Directive must include an id');
        }
      }
    };
  });

})(window);

// Source: -v1/lib/ui/dimmer/dimmer.js
// Original => http://bootsnipp.com/snippets/78VV
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.provider('avDimmerConfig', function() {

    var config = {
      animationConfig: {
        duration: 250
      },
      showAnimation: 'fadeIn',
      showEvent: 'mouseenter',
      hideAnimation: 'fadeOut',
      hideEvent: 'mouseleave',
      overlaySelector: '.dimmer-content'
    };

    this.set = function(options) {
      angular.extend(config, options);
    };

    this.$get = function() {
      return angular.copy(config);
    };

  });

  availity.ui.directive('avDimmer', function(avDimmerConfig) {
    return {
      link: function(scope,  elm, attrs) {
        var config = angular.extend({}, avDimmerConfig, attrs.config);

        elm.on(config.showEvent, function() {
          elm.find(config.overlaySelector).velocity(config.showAnimation, config.animationConfig);
        }).on(config.hideEvent, function() {
          elm.find(config.overlaySelector).velocity(config.hideAnimation, config.animationConfig);
        });

        scope.$on('$destroy', function() {
          elm.off();
        });
      }
    };
  });

})(window);

//# sourceMappingURL=maps/availity-angular-ui.js.map
