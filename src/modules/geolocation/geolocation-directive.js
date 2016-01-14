angular.module('anol.geolocation')
/**
 * @ngdoc directive
 * @name anol.geolocation.directive:anolGeolocation
 *
 * @restrict A
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {boolean} anolGeolocation When true, geolocation is startet just after map init
 * @param {boolean} disableButton When true, no geolocate button is added
 * @param {number} zoom Zoom level after map centered on geolocated point
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Get current position and center map on it.
 */
.directive('anolGeolocation', ['$compile', '$translate', 'MapService', 'ControlsService',
  function($compile, $translate, MapService, ControlsService) {
    return {
      scope: {
        anolGeolocation: '@',
        disableButton: '@',
        zoom: '@',
        tooltipPlacement: '@',
        tooltipDelay: '@',
        tooltipEnable: '@'
      },
      templateUrl: function(tElement, tAttrs) {
          var defaultUrl = 'src/modules/geolocation/templates/geolocation.html';
          return tAttrs.templateUrl || defaultUrl;
      },
      link: function(scope, element) {
        scope.anolGeolocation = 'false' !== scope.anolGeolocation;

        // attribute defaults
        scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
          scope.tooltipPlacement : 'right';
        scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
          scope.tooltipDelay : 500;
        scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
          scope.tooltipEnable : !ol.has.TOUCH;

        if('true' !== scope.disableButton) {
          var button = angular.element('');
          element.addClass('anol-geolocation');
          element.append($compile(button)(scope));
        }

        var view = MapService.getMap().getView();
        var geolocation = new ol.Geolocation({
          projection: view.getProjection(),
          tracking: scope.anolGeolocation
        });

        geolocation.on('change:position', function() {
          geolocation.setTracking(false);
          var position = geolocation.getPosition();
          var constrainedPosition = view.constrainCenter(position);
          if(position[0] !== constrainedPosition[0] || position[1] !== constrainedPosition[1]) {
            $translate('anol.geolocation.POSITION_OUT_OF_MAX_EXTENT').then(function(translation) {
              scope.$emit('anol.geolocation', {'message': translation, 'type': 'error'});
            });
            return;
          }
          view.setCenter(position);
          if(angular.isDefined(scope.zoom)) {
            view.setZoom(parseInt(scope.zoom));
          }
        });

        scope.locate = function() {
          geolocation.setTracking(true);
        };

        element.addClass('ol-control');

        ControlsService.addControl(new anol.control.Control({
          element: element
        }));
      }
    };
}]);
