# Spectrum analyzer

Looking after this after many years, very much WIP..

## Installation

```
# Does nothing at the moment!
% npm install gulp --global

# Important :)
% npm install browser-sync --global
% npm start
```

## TODO

- [WHAT?] Ability to pause audio (because damn)
- [BUG] Fallback for IE/etc/whatever
- [BUG[ Compatibility for Firefox?
- [NTH] Show loader
- [NTH] Show when song is over / timeline for completion
- Improve 3D renderer
- Move WebAudio logic into library


## Reference

Reference:

- Firefox issues with MediaElementAudioSourceNode:
    - http://stackoverflow.com/questions/19708561/firefox-25-and-audiocontext-createjavascriptnote-not-a-function#comment29294629_19710142
    - http://stackoverflow.com/questions/20180550/firefox-webaudio-createmediaelementsource-not-working
- Firefox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=937718
- Notes on audio: http://www.createjs.com/tutorials/SoundJS%20and%20PreloadJS/
- Firefox release announcement: https://hacks.mozilla.org/2013/07/web-audio-api-comes-to-firefox/
- Firefox / media events: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
- Citing bug with Safari: http://isflashdeadyet.com/tests/web-audio-visualization/index.html
- HTML5 audio: http://html5doctor.com/html5-audio-the-state-of-play/
- HTML5 audio format test: http://hpr.dogphilosophy.net/test/

Examples:

- http://0xfe.muthanna.com/wavebox/
- Most useful sample code: http://jsbin.com/acolet/1
    - Written by this guy: http://stackoverflow.com/users/1397319/idbehold
- Referenced most useful: http://blog.arisetyo.com/create-spectrum-analyzers-using-webkitaudiocontext/




// Pseudo

if ( ! audio || ! canvas )
{
    show error message, nothing doing
}
else
{
    load/play audio

    if ( audioContext )
    {
        spectrum analyzer
    }
    else
    {
        graphics based on waveform
    }
}
