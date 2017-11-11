
import SoundcloudSource from './audioSources/SoundcloudSource';


let currentSource = null;


// Required, or simply wrap SC resolver?
function resolveUrl(url) {
    return new Promise((resolve, reject) => {

        // This is incorrect, because setting this value does not
        // guarantee that it has been resolved/loaded..
        if (currentSource != url) {
            currentSource = url;
        } else {
            reject(`URL ${url} is already loaded`);
        }
        
        // v1 (SoundCloud only) - /#url=good-timin/sharing
        if (SoundcloudSource.isValidURL(url)) {
            const resolvedURL = SoundcloudSource.resolveURL(url);
            resolvedURL.then((result) => {

                const song = {
                    currentSource: currentSource,
                    name: result.title,
                    link: result.permalink_url,
                    src: SoundcloudSource.getAudioURL(result.stream_url)
                };
                resolve(song);
                
            }).catch((err) => {
                reject('Failed to resolve SoundCloud URL:', err);
            });
        } else {
            reject('Invalid URL');
        }        
    });
}

function resolveData(data) {
    return new Promise((resolve, reject) => {

        // MP3 has been dropped
        if (data.files.length > 0 && data.files[0].name.indexOf( '.mp3' ) > -1) {
            // Ref: http://stackoverflow.com/questions/10413548/javascript-filereader-using-a-lot-of-memory
            var url = window.URL || window.webkitURL;
            var src = url.createObjectURL( data.files[0] );
            const song = {
                name: data.files[0].name,
                link: null,
                src: src
            };
            resolve(song);

        // SoundCloud URL has been dropped
        } else if (data.getData('URL').indexOf('soundcloud.com') > -1) {
            reject('Undocumented behaviour for debugging!');

            // TODO: Move SC into this module
            // this.resolveSoundcloudURL( data.getData("URL") );

        // Unsure!
        } else {
            reject('Sorry, that did not work - try something else.');
        }
    });
}

export default {
    resolveUrl,
    resolveData
};
