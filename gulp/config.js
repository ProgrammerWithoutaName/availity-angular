var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

module.exports = {
  args: {
    verbose: !!argv.verbose
  },
  regex: {
    JSHINT: /([\/][\*][\s]*jshint\s.+[\*\/])/g,
    GLOBAL: /([\/][\*][\s]*global\s.+[\*\/])/g,
    VERSION: /(availity.VERSION = ')(v\d+.\d+.\d+)(')/g
  },
  project: {
    path: path.resolve(__dirname, '..')
  },
  packages: {
    src: ['./package.json', './bower.json']
  },
  less: {
    src: ['less/availity-angular.less'],
    targets: ['less/**/*.less'],
    dest: 'build/guide/css',
    destMaps: './maps', // relative to dest folder
    browsers: ['> 1%', 'last 3 versions', 'ie 8', 'ie 9']
  },
  css: {
    src: 'build/guide/**/*.css',
    dest: 'dist/css',
    destMaps: './maps' // relative to dest folder
  },
  readme: {
    src: ['docs/readme/readme.config.md'],
    name: 'README.md',
    dest: './'
  },
  js: {
    src: ['gulpfile.js', 'gulp/**/*.js'],
    jshintrc: '.jshintrc'
  },
  sync: {
    src: 'build/guide'
  },
  images: {
    src: [
      'bower_components/availity-uikit/dist/images/availity-uikit.css'
    ]
  },
  lib: {
    name: 'availity-angular.js',
    src: [
     './lib/core/index.js',
      './lib/core/utils/strings.js',
      './lib/core/utils/uuid.js',
      './lib/core/utils/urls.js',
      './lib/core/utils/print.js',
      './lib/core/utils/throttle.js',
      './lib/core/logger/logger.js',
      './lib/core/logger/logger-config.js',
      './lib/core/polling/polling.js',
      './lib/core/api/api-factory.js',
      './lib/core/api/api-users.js',
      './lib/core/api/api-coverages.js',
      './lib/core/api/api-configurations.js',
      './lib/core/api/api-log-messages.js',
      './lib/core/api/api-spaces.js',
      './lib/core/api/api-documents.js',
      './lib/core/api/api-organizations.js',
      './lib/core/api/api-codes.js',
      './lib/core/api/api-user-permissions.js',
      './lib/core/authorizations/user-authorizations.js',
      './lib/core/session/session.js',
      './lib/core/idle/idle.js',
      './lib/core/idle/idle-interceptor.js',
      './lib/core/validation/validator.js',
      './lib/core/validation/validators/validator-utils.js',
      './lib/core/validation/validators/validator-size.js',
      './lib/core/validation/validators/validator-pattern.js',
      './lib/core/validation/validators/validator-required.js',
      './lib/core/validation/validators/validator-date-range.js',
      './lib/core/validation/validators/validator-date-format.js',
      './lib/core/validation/validators/validator-npi.js',
      './lib/core/validation/validators/validator-phone.js',
      './lib/core/validation/validators/validator-email.js',
      './lib/core/utils/globals.js',
      './lib/core/analytics/analytics.js',
      './lib/core/analytics/analytics-util.js',
      './lib/core/analytics/analytics-splunk.js',
      './lib/core/analytics/analytics-piwik.js',
      './lib/core/analytics/analytics-exceptions.js',
      './lib/core/analytics/analytics-config.js',
      './lib/core/utils/date-polyfill.js',
      './lib/core/messages/messages-constants.js',
      './lib/core/messages/messages.js'
    ],
    specs: './lib/core/**/*spec.js',
    destDist: './dist',
    destMaps: './maps', // this is relative path to the destDist above,
    dest: 'build/guide/js',
    jshintrc: 'lib/.jshintrc'
  },
  ui: {
    name: 'availity-angular-ui.js',
    src: [
      './lib/ui/index.js',
      './lib/ui/templates/template.js',
      './lib/ui/modal/modal.js',
      './lib/ui/validation/form.js',
      './lib/ui/validation/field.js',
      './lib/ui/popover/popover.js',
      './lib/ui/tooltip/tooltip.js',
      './lib/ui/validation/container.js',
      './lib/ui/validation/adapter-bootstrap.js',
      './lib/ui/validation/adapter.js',
      './lib/ui/dropdown/dropdown.js',
      './lib/ui/datepicker/datepicker.js',
      './lib/ui/idle/idle-notifier.js',
      './lib/ui/mask/mask.js',
      './lib/ui/permissions/has-permission.js',
      './lib/ui/analytics/analytics.js',
      './lib/ui/placeholder/placeholder.js',
      './lib/ui/breadcrumbs/breadcrumbs.js',
      './lib/ui/breadcrumbs/breadcrumbs-spaces.js',
      './lib/ui/filters/approximate.js',
      './lib/ui/accordion/accordion.js',
      './lib/ui/badge/badge.js',
      './lib/ui/labels/removable-label.js',
      './lib/ui/animation/loader.js',
      './lib/ui/block/block.js',
      './lib/ui/block/block-directive.js',
      './lib/ui/tabs/tabs.js',
      './lib/ui/scroll-pagination/scroll-pagination.js',
      './lib/ui/dimmer/dimmer.js'
    ],
    specs: './lib/ui/**/*spec.js',
    destDist: './dist',
    destMaps: './maps', // this is relative path to the destDist above,
    dest: 'build/guide/js',
    jshintrc: 'lib/.jshintrc'

  },
  templates: {
    name: 'availity-angular-ui-templates.js',
    src: './lib/**/*-tpl.html',
    destDist: './dist',
    destMaps: './maps', // this is relative path to the destDist above,
    dest: 'build/guide/js',
    jshintrc: 'lib/.jshintrc'
  },
  vendor: {
    name: 'vendor.js',
    src: [
      './bower_components/jquery/jquery.js',
      './bower_components/jquery-ui/jquery-ui.js',
      './bower_components/jquery.tocify.js/src/javascripts/jquery.tocify.js',
      './bower_components/bootstrap/dist/js/bootstrap.js',
      './bower_components/lodash-compat/lodash.js',
      './bower_components/moment/moment.js',
      './bower_components/select2/select2.js',
      './bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
      './bower_components/velocity/velocity.js',
      './bower_components/velocity/velocity.ui.js',
      './bower_components/angular/angular.js',
      './bower_components/angular-sanitize/angular-sanitize.js',
      './bower_components/angular-animate/angular-animate.js',
      './bower_components/angular-velocity/angular-velocity.js',
      './bower_components/jquery.inputmask/dist/inputmask/jquery.inputmask.js',
      './bower_components/angular-shims-placeholder/dist/angular-shims-placeholder.js',
      './bower_components/tracekit/tracekit.js',
      './bower_components/angular-block-ui/dist/angular-block-ui.js',
      './bower_components/angular-ui-router/release/angular-ui-router.js'
    ],
    destMaps: './maps', // this is relative path to the destDist above,
    dest: 'build/guide/js',
    jshintrc: 'lib/.jshintrc'
  },
  uikit: {
    js: {
      src: 'bower_components/availity-uikit/dist/js/availity-uikit.js',
      dest: 'build/guide/js'
    },
    css: {
      src: [
        'bower_components/availity-uikit/dist/css/availity-uikit.css',
        'bower_components/availity-uikit/dist/css/docs.css',
        'bower_components/angular-block-ui/dist/angular-block-ui.css'
      ],
      dest: 'build/guide/css'
    },
    images: {
      src: [
        'bower_components/availity-uikit/dist/images/logo-availity.png'
      ],
      dest: 'build/guide/images'
    },
    fonts: {
      src: 'bower_components/availity-uikit/dist/fonts/**/*.{ttf,woff,eot,svg}',
      dest: 'build/guide/fonts'
    }
  },
  docs: {
    all: {
      src: [
        'docs/guide/pages/*.html',
        'docs/guide/pages/examples/*.html',
        'lib/**/docs/*-demo.html'
      ]
    },
    js: {
      name: 'docs-demos.js',
      src: [
        'docs/guide/js/index.js',
        'lib/**/docs/*-demo.js'
      ],
      dest: 'build/guide/js'
    },
    jsTemplates: {
      src: 'lib/**/docs/*-template.html',
      dest: 'build/guide/templates'
    },
    partials: {
      src: 'docs/guide/templates/partials/*.hbs',
      targets: 'docs/guide/templates/partials/**/*.hbs'
    },
    templates: {
      src: './docs/guide/templates',
      targets: 'docs/guide/templates/**/*.hbs',
      extension: '.hbs'
    },
    dest: 'build/guide'
  },
  test: {
    src: [
      'node_modules/sinon/pkg/sinon.js',
      'bower_components/jquery/jquery.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/lodash-compat/lodash.js',
      'bower_components/select2/select2.js',
      'bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
      'bower_components/moment/moment.js',
      'bower_components/jquery.inputmask/dist/inputmask/jquery.inputmask.js',
      'bower_components/angular-shims-placeholder/dist/angular-shims-placeholder.js',
      'bower_components/tracekit/tracekit.js',
      'bower_components/angular-block-ui/dist/angular-block-ui.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/velocity/velocity.js',
      'bower_components/velocity/velocity.ui.js',
      'test/index.js',
      'test/matchers.js',
      'test/helpers.js'
    ]
  }
};
