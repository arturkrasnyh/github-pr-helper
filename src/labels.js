// The labels module is the main service for interacting with the GitHub API
angular.module('labels', [])

// Get the brightness of a colour (say for a background) so we can work out what colour to make
// the text in the foreground.
.factory('brightness', [function() {
  return function brightness(color) {
    var red = parseInt(color.substr(0,2), 16);
    var green = parseInt(color.substr(2,2), 16);
    var blue = parseInt(color.substr(4,2), 16);
    return ((red*299) + (green*587) + (blue*114)) / 1000;
  };
}])

// An element that displays a coloured label
.directive('ghLabel', ['brightness', function(brightness) {
  return {
    restrict: 'E',
    replace: true,
    scope: { label: '=' },
    template: '<span title="{{label.name}}">{{label.name}}</span>',
    link: function(scope, element, attrs) {
      // Set the colour of the label
      element.css('background-color', '#' + scope.label.color);

      // Calculate whether the label should have black or white text
      var light = brightness(scope.label.color) > 255/2;
      element.css('color', light ? 'black' : 'white');
      element.addClass(light ? 'darker' : 'lighter');
    }
  };
}])


.directive('labelList', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: { labels: '='},
    template: 
      '  <ul class="color-label-list filter-list small">' +
      '    <li ng-repeat="label in labels | filter : {checked: true} track by label.name">' +
      '      <gh-label label="label" class="filter-item color-label"></gh-label>' +
      '    </li>' + 
      '  </ul>'
  };
})


.directive('labelManager', ['githubAPI', '$timeout', function(githubAPI, $timeout) {
  return {
    restrict: 'E',
    replace: true,
    scope: { labels: '=' },
    link: function(scope, element) {
      var body = angular.element(document.body);

      function hideModal() {
        scope.$apply('showModal = false');
      }

      scope.labelsLoading = true;
      scope.$watch('labels', function() { scope.labelsLoading = false; });
      scope.toggleLabel = function(label) {
        label.checked = !label.checked;
        githubAPI.updateLabel(label);
      };

      scope.$watch('showModal', function(showModal) {
        // We need to do this after the next rendering cycle
        $timeout(function() {
          var onOff = showModal ? 'on' : 'off';
          body[onOff]('click', hideModal);
        });
      });

      // Make sure we clean up the click handler on the body if the label handler gets destroyed
      element.on('$destroy', function() {
        console.log('destroying');
        body.off('click', hideModal);
      });
    },
    template:
    '<div class="label-manager">' +
    '<strong>Labels</strong>' +
    '<div class="select-menu label-select-menu" ng-class="{active: showModal}" ng-click="$event.stopPropagation()">' +

      '<span class="minibutton icon-only select-menu-button" ng-click="showModal=!showModal">' +
        '<span class="octicon octicon-gear"></span>' +
      '</span>' +

      '<div class="select-menu-modal-holder">' +
        '<div class="select-menu-modal">' +

          '<div class="select-menu-header">' +
            '<span class="select-menu-title">Apply labels to this issue</span>' +
            '<span class="octicon octicon-remove-close" ng-click="showModal=false"></span>' +
          '</div> <!-- /.select-menu-header -->' +

          '<div class="select-menu-error-shell">' +
            '<span class="select-menu-error">Whoops, there was an error</span>' +
          '</div>' +

          '<div class="select-menu-filters">' +
            '<div class="select-menu-text-filter">' +
              '<input type="text" ng-model="labelFilterField" placeholder="Filter labels" autocomplete="off">' +
            '</div>' +
          '</div> <!-- /.select-menu-filters -->' +

          '<div class="select-menu-list">' +
            '<div class="select-menu-item" ng-repeat="label in labels | filter : labelFilterField | orderBy : \'name\'" ng-class="{selected : label.checked}" ng-click="toggleLabel(label)">' +
              '<span class="select-menu-item-icon octicon octicon-check" ></span>' +
              '<div class="select-menu-item-text">' +
                '<div class="color-label-wrapper">' +
                  '<div class="color-label" >' +
                    '<span class="color" ng-style="{\'background-color\': \'#\'+label.color}">&nbsp;</span>' +
                    '<span class="name">{{label.name}}</span>' +
                    '<span class="octicon octicon-remove-close"></span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="select-menu-no-results" ng-style="{display: filteredLabels.length == 0 && \'block\'}">Nothing to show</div>' +
          '<div class="select-menu-loading-overlay" ng-style="{display: labelsLoading && \'block\'}">Loading…</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '</div>'
  };
}]);