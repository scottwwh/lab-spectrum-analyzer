
import SoundcloudSource from './audioSources/SoundcloudSource';


const supportedFileType = '.mp3';

let currentSource = null;


// Required, or simply wrap SC resolver?
function resolveUrl(url) {
    return new Promise((resolve, reject) => {

        // This is incorrect, because setting this value does not
        // guarantee that it has been resolved/loaded..
        if (currentSource == url) {
            reject({msg: `URL ${url} is already loaded`});
        }
        
        let song = {
            name: null,
            link: null,
            src: null
        };

        // v1 (SoundCloud only) - /#url=good-timin/sharing
        if (SoundcloudSource.isValidURL(url)) {
            const resolvedURL = SoundcloudSource.resolveURL(url);
            resolvedURL.then((result) => {

                // Now that we've resolved the URL, save it!
                currentSource = url;

                song.name = result.title;
                song.link = result.permalink_url;
                song.src = SoundcloudSource.getAudioURL(result.stream_url);
                resolve(song);
                
            }).catch((err) => {
                reject('Failed to resolve SoundCloud URL:', err);
            });
        } else if (isValidFile(url)) {

            currentSource = url;

            song.name = url.replace(supportedFileType, '');
            song.src = './audio/' + url;
            resolve(song);

        } else {
            reject('Invalid URL');
        }
    });
}

function resolveData(data) {
    return new Promise((resolve, reject) => {

        // MP3 has been dropped
        if (data.files.length > 0 && isValidFile(data.files[0].name)) {
            // Ref: http://stackoverflow.com/questions/10413548/javascript-filereader-using-a-lot-of-memory
            var url = window.URL || window.webkitURL;
            var src = url.createObjectURL(data.files[0]);
            const song = {
                name: data.files[0].name.replace(supportedFileType, ''),
                link: null,
                src: src
            };
            resolve(song);

        // SoundCloud URL has been dropped - this is the most unfriendly way to do this!
        } else if (data.getData('URL').indexOf('soundcloud.com') > -1) {
            reject('Undocumented/unsupported behaviour for debugging!');

            // TODO: Move SC into this module
            // this.resolveSoundcloudURL( data.getData("URL") );

        // Unsure!
        } else {
            reject('Sorry, that did not work - try something else.');
        }
    });
}

function isValidFile(url) {
    const re = new RegExp(`${supportedFileType}$`, 'i');
    return Boolean(url.match(re));
}

function isValidURL(url) {
    return SoundcloudSource.isValidURL(url);
}

function getCurrentSource() {
    return currentSource;
}

export default {
    resolveUrl,
    resolveData,
    getCurrentSource,
    isValidFile,
    isValidURL
};
