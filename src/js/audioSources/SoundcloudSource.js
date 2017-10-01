/* SoundCloud */

const baseURL = 'https://soundcloud.com/';
const currentSource = null;

// TODO: Proxy this request?
const scClientId = 'a20b2507998bc9f8f0874f12de0efb84';
const resolvedUrl = 'http://api.soundcloud.com/resolve.json?url=';


function isValid(url) {
    return (url.indexOf(baseURL) > -1);
}

// Resolve SC stream from URL
function resolve(url)
{
    // This needs to be managed by Audio object and/or app
    /*
    if (this.currentSource != url) {
        this.currentSource = url;
    } else {
        console.log('URL is already set..');
        return;
    }
    */


    return new Promise((resolve, reject) => {

        if (!isValid(url)) {
            reject(`Invalid URL: ${url}`);
        }
        
        var request = new XMLHttpRequest();
        request.open('GET', resolvedUrl + url + '&client_id=' + scClientId, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                const data = JSON.parse(request.responseText);
                if (data.streamable) {
                    resolve(data);
                } else {
                    reject(data);
                }
            } else {
                // We reached our target server, but it returned an error
                console.warn("Error?");
                reject(request);
            }
        }.bind(this);

        request.onerror = function(err) {
            console.warn('Connection error');
            reject(err);
        };

        request.send();
    });
};

function getAudioStream(url) {
    var songUrl = url + '?client_id=' + scClientId;
    return songUrl;
}

function test(val) {
    const pass = val || Math.random();
    return new Promise((resolve, reject) => {
        if (pass > 0.5) {
            resolve("hello");
        } else {
            reject("failure reason");
        }
    });
}

export default {
    test: test,
    isValidURL: isValid,
    resolveURL: resolve,
    getAudioURL: getAudioStream
};
