var fs = require('fs');
require('shelljs/global');

const EXAMPLES_DIR = './node_modules/three/examples/js'
const DEST_DIR = './src/js/lib/three/examples'

mkdir('-p', DEST_DIR);

const files = [
	// `${EXAMPLES_DIR}/loaders/GLTFLoader.js`,
	`${EXAMPLES_DIR}/controls/OrbitControls.js`,
];

var regexp = /THREE\./g;

function template(dependencies, src, cls) {
	var dependenciesFormatted = '';
	dependencies.forEach(dependency => {
		dependenciesFormatted += `${dependency}, \n`;
	});

	const imports = dependencies.length > 0 ? `
	import {
	${dependenciesFormatted}
	} from 'three';
	` : '';

	return `
		${imports}
		var ${cls};
		${src}
		export default ${cls};
	`;
}

files.forEach(file => {
	const filename = file.split('/').pop();

	const contents = cat(file);

	// Find all occurances of THREE.
	const occurances = contents.match(/THREE.\b(\w|')+\b/gim) || [];
	var imports = [];
	var count = 0;

	// Filename needs to match the variable name
	var className = filename.split('.')[0];
	occurances.forEach((occurance, i) => {
		// Make sure THREE is in the occurance
		if (occurance.indexOf('THREE') !== -1) {

			const dependency = occurance.replace(regexp, '');

			if (dependency !== className) {
				imports.push(dependency);
			}
		}
	});

	imports = imports.filter(function(item, pos) {
		return imports.indexOf(item) == pos;
	});

	// Remove all THREE.
	const source = contents.replace(regexp, '');
	const tmpl = template(imports, source, className);

	// Write file
	fs.writeFile(`${DEST_DIR}/${filename}`, tmpl, function(error) {
		if(error) {
			return console.log(error);
		}
		console.log(`${file} > ${filename}`);
	});
});
