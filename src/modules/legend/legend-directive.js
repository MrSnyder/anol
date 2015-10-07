angular.module('anol.legend')
/**
 * @ngdoc directive
 * @name anol.legend.directive:anolLegend
 *
 * @restrict A
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsSerivce
 *
 * @param {string=} anolLegend If containing "open" legend initial state is expanded. Otherweise it is collapsed.
 *
 * @description
 * Shows vector symbols as legend for each vector layer with defined *geometryType*
 * Shows img with src=layer.legend.url for each raster layer. For raster layers layer.legend.target defines a external container
 * to show img in
 */
.directive('anolLegend', ['LayersService', 'ControlsService', function(LayersService, ControlsService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        transclude: true,
        templateUrl: 'src/modules/legend/templates/legend.html',
        scope: {
            anolLegend: '@',
            customTargetFilled: '&'
        },
        link: {
            pre: function(scope, element, attrs, AnolMapController) {
                scope.collapsed = false;
                scope.showToggle = false;
                if(angular.isDefined(AnolMapController)) {
                    scope.collapsed = scope.anolLegend !== 'open';
                    scope.showToggle = true;
                    element.addClass('anol-legend');
                    ControlsService.addControl(
                        new anol.control.Control({
                            element: element
                        })
                    );
                }
            },
            post: function(scope, element, attrs) {
                var VectorLegend = {
                    createCanvas: function() {
                        var canvas = angular.element('<canvas></canvas>');
                        canvas.addClass = 'anol-legend-item-image';
                        canvas[0].width = 20;
                        canvas[0].height = 20;
                        return canvas;
                    },
                    drawPointLegend: function(style) {
                        var canvas = VectorLegend.createCanvas();
                        var ctx = canvas[0].getContext('2d');

                        if(angular.isDefined(style.getImage().getSrc)) {
                            var img = new Image();
                            img.src = style.getImage().getSrc();
                            img.onload = function() {
                                ctx.drawImage(img, 1, 1);
                            };
                        } else {
                            ctx.arc(10, 10, 7, 0, 2 * Math.PI, false);
                            ctx.strokeStyle = style.getImage().getStroke().getColor();
                            ctx.lineWidth = style.getImage().getStroke().getWidth();
                            ctx.fillStyle = style.getImage().getFill().getColor();
                            ctx.fill();
                            ctx.stroke();
                        }
                        return canvas;
                    },
                    drawLineLegend: function(style) {
                        var canvas = VectorLegend.createCanvas();
                        var ctx = canvas[0].getContext('2d');

                        ctx.moveTo(3, 10);
                        ctx.lineTo(17, 10);
                        ctx.strokeStyle = style.getStroke().getColor();
                        ctx.lineWidth = style.getStroke().getWidth();
                        ctx.stroke();
                        return canvas;
                    },
                    drawPolygonLegend: function(style) {
                        var canvas = VectorLegend.createCanvas();
                        var ctx = canvas[0].getContext('2d');

                        ctx.rect(3, 3, 14, 14);
                        ctx.fillStyle = style.getFill().getColor();
                        ctx.strokeStyle = style.getStroke().getColor();
                        ctx.lineWidth = style.getStroke().getWidth();
                        ctx.fill();
                        ctx.stroke();
                        return canvas;
                    },
                    createLegendEntry: function(title, type, style) {
                        if(angular.isFunction(style)) {
                            style = style()[0];
                        }
                        var container = angular.element('<div></div>');
                        var titleElement = angular.element('<div></div>');
                        titleElement.addClass('anol-legend-item-title');
                        titleElement.text(title);
                        container.append(titleElement);
                        switch(type) {
                            case 'point':
                                container.append(VectorLegend.drawPointLegend(style));
                            break;
                            case 'line':
                                container.append(VectorLegend.drawLineLegend(style));
                            break;
                            case 'polygon':
                                container.append(VectorLegend.drawPolygonLegend(style));
                            break;
                            default:
                        }
                        element.find('.anol-legend-items').append(container);
                    }
                };

                var RasterLegend = {
                    createGetLegendGraphicUrl: function(source, params) {
                        var urls = [];
                        var baseParams = {
                            'SERVICE': 'WMS',
                            'VERSION': ol.DEFAULT_WMS_VERSION,
                            'SLD_VERSION': '1.1.0',
                            'REQUEST': 'GetLegendGraphic',
                            'FORMAT': 'image/png',
                            'LAYER': undefined
                        };
                        var url = source.getUrl();
                        var sourceParams = source.getParams();
                        var layers = sourceParams.layers || sourceParams.LAYERS || '';

                        angular.forEach(layers.split(','), function(layer) {
                            urls.push(url + $.param($.extend({}, baseParams, params, {
                                'LAYER': layer
                            })));
                        });
                        return urls;
                    },
                    createLegendEntry: function(layer) {
                        var container = angular.element('<div></div>');
                        var titleElement = angular.element('<div></div>');
                        titleElement.addClass('anol-legend-item-title');
                        titleElement.text(layer.title);
                        container.append(titleElement);

                        var urls = [];

                        if(layer.legend.type === 'GetLegendGraphic') {
                            var params = {};
                            if(layer.legend.verison !== undefined) {
                                params.VERSION = layer.legend.version;
                            }
                            if(layer.legend.sldVersion !== undefined) {
                                params.SLD_VERSION = layer.legend.sldVersion;
                            }
                            if(layer.legend.format !== undefined) {
                                params.FORMAT = layer.legend.format;
                            }
                            urls = RasterLegend.createGetLegendGraphicUrl(layer.olLayer.getSource(), params);
                        } else {
                            urls = [layer.legend.url];
                        }
                        var legendImages = [];
                        angular.forEach(urls, function(url) {
                            var legendImage = angular.element('<img>');
                            legendImage.addClass('anol-legend-item-image');
                            legendImage[0].src = url;
                            legendImages.push(legendImage);
                        });

                        // Display in element with given id
                        if (angular.isDefined(layer.legend.target)) {
                            var target = angular.element(layer.legend.target);
                            var showLegendButton = angular.element('<button>Show Legend</button>');
                            showLegendButton.addClass('btn');
                            showLegendButton.addClass('btn-sm');
                            showLegendButton.on('click', function() {
                                target.empty();
                                angular.forEach(legendImages, function(legendImage) {
                                    target.append(legendImage);
                                });
                                if(angular.isFunction(scope.customTargetFilled)) {
                                    scope.customTargetFilled()();
                                }
                            });
                            container.append(showLegendButton);
                        // Display in legend control
                        } else {
                            angular.forEach(legendImages, function(legendImage) {
                                container.append(legendImage);
                            });
                        }

                        element.find('.anol-legend-items').append(container);
                    }
                };

                angular.forEach(LayersService.layers, function(_layer) {
                    var layers = [_layer];
                    if(_layer instanceof anol.layer.Group) {
                        layers = _layer.layers;
                    }
                    angular.forEach(layers, function(layer) {
                        if(layer.legend === false) {
                            return;
                        }
                        if(layer.olLayer instanceof ol.layer.Vector) {
                            VectorLegend.createLegendEntry(layer.title, layer.legend.type, layer.olLayer.getStyle());
                        } else {
                            RasterLegend.createLegendEntry(layer);
                        }
                    });
                });
            }
        }
    };
}]);