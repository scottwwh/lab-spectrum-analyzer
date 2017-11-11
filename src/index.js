/* global _gaq */

/**
 * 3rd Bass in 2017!
 */

import SpectrumAnalyzer from './js/spectrum-analyzer';

var app = new SpectrumAnalyzer();
app.trackEvent = function(action, label, value, nonInteraction) {
    if ( typeof _gaq !== 'undefined' )
        _gaq.push(['_trackEvent', 'Spectrum Analyzer', action, label, value, nonInteraction]);
};
app.init(true);
// app.init();

