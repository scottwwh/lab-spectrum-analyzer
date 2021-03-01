
/**
 * ROUTER
 */

const baseURL = 'https://soundcloud.com/';

function getURL(url) {
    const key = 'url=';

    // Assumes SC URL, should be moved into AudioResolver
    if (url) {
        return baseURL + url.substr(url.indexOf(key) + key.length);
    }

    // Check for presence of URL
    if (window.location.hash && window.location.href.indexOf(key) > -1) {
        const i = window.location.hash.indexOf(key);
        let url = window.location.hash.substr(i + key.length);
        
        // This forces a default song to load, which is not very clear..
        if (url.indexOf('.mp3') > -1) {
            url = 'local';
        }

        if (url == 'local') {
            return url;
        } else {
            return baseURL + window.location.hash.substr(window.location.hash.indexOf(key) + key.length);
        }
    }

    return null;
}

function setURL(url) {
    if (this.getURL() == url)
        return;

    if (url.indexOf('.mp3') > -1) {
        return 'local';
    }

    url = url.replace(baseURL, '');
    window.location.hash = 'url=' + url;
}

function isNewSource(url) {
    return Boolean(url != this.getURL() && url.indexOf('local') > -1);
}

export default {
    getURL,
    setURL,
    isNewSource
};
