
/**
 * 3rd Bass in 2017!
 */

import SpectrumAnalyzer from './js/spectrum-analyzer';

var app = new SpectrumAnalyzer();
app.trackEvent = function( action, label, value, noninteraction )
{
    if ( typeof _gaq !== 'undefined' )
        _gaq.push([ '_trackEvent', 'Spectrum Analyzer', action, label, value, noninteraction ]);
};
app.init(true);
// app.init(false);
