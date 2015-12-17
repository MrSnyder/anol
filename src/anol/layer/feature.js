/**
 * @ngdoc object
 * @name anol.layer.Feature
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.Feature = function(_options) {
    if(_options === false) {
        anol.layer.Layer.call(this, _options);
        return;
    }
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );
    options.olLayer.source = new ol.source.Vector(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Vector(options.olLayer);

    anol.layer.Layer.call(this, options);
    this.isVector = true;
    this.saveable = options.saveable || false;
    this.editable = options.editable || false;
};
anol.layer.Feature.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.Feature.prototype, {
    CLASS_NAME: 'anol.layer.Feature'
});
