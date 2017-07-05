# Spectrum analyzer

Simple way to visualize audio streams using WebAudio and WebGL (via Three.js) via local MP3s or Soundcloud URLs.

Looking after this after many years, still very much a work in progress.

Uses Node 6.x LTS.

## Installation

```
# Important :)
% npm i --global browser-sync
% npm install

# Combine these two..
% npm run dev
% npm run server
```

## TODO

- Streamline build process
- Fnd/fix performance problem after repeated play/pause events
- Move WebAudio logic into library
- [BUG] Fallback for IE/etc/whatever?
- [NTH] Show loader
- [NTH] Show when song is over / timeline for completion
- [DONE] Minify, baby!
- [DONE] Babel to transpile down to ES5?
- [DONE] Replace drag/drop nonsense for SC URLs with search bar
- [DONE] THREE.js modules from NPM
- [DONE] Rollup to modularize code
- [DONE] Add text input for SoundCloud URLs


## Old notes

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

Useful examples:

- http://0xfe.muthanna.com/wavebox/
- Most useful sample code: http://jsbin.com/acolet/1
    - Written by this guy: http://stackoverflow.com/users/1397319/idbehold
- http://blog.arisetyo.com/create-spectrum-analyzers-using-webkitaudiocontext/
