const fs = require('fs');
const path = require('path');
const axios = require('axios');
const unzipper = require('unzipper');
const saveData = require('./scripts/save-data');

// VARS
let current_fires;
const data_dir = 'data';
// let tmp_file_dir = './data/tmp'
const tmp_zip_file = './data/fire-data.txt';
const filename = 'NFDB_point_20240613'; // temp file for data
const filePattern = /^NFDB.*\.(pdf|xml|png|jpeg|csv|xlsx)$/i;
const url = 'https://cwfis.cfs.nrcan.gc.ca/downloads/nfdb/fire_pnt/current_version/NFDB_point_txt.zip'


async function init(url) {
	console.log(url)
	await downloadAndUnzip(url);
}

// FUNCTIONS //
function cleanUp() {
	const ext = ['dbf', 'prj', 'shp', 'shx', 'pdf', 'xml', 'png'];

	fs.readdirSync(data_dir).forEach(file => {
		if (filePattern.test(file)) {
			const filePath = path.join(data_dir, file);
    		fs.unlinkSync(filePath);
    		console.log(`Deleted: ${filePath}`);
		}
	});

	fs.unlinkSync('./data/NFDB_point_update_log.txt');
	fs.unlinkSync('./data/fire-data.txt');
	// delete unzipped files 
	// ext.forEach((d,i) => {
	// 	fs.rm(`data/prot_current_fire_points.${d}`, { recursive: true}, err => {
	// 		if (err) console.error(err)
	// 	});
	// });
	// // & the zip file
	// fs.rm(`data/current-fires.zip`, { recursive: true}, err => {
	// 	if (err) console.error(err)
	// });
}

async function processData() {
	console.log('Processing data...');

	// console.log('Done processing shapefiles...');
	// await saveData(current_fires, 'wildfires', 'json', data_dir);

	// delete shapefiles
	cleanUp();
}

async function downloadAndUnzip(url) {
	let streamResponse;
	// stream writer where we'll download the data
	const writeStream = fs.createWriteStream(tmp_zip_file, {flag: 'wx'});
	
	writeStream.on('open', async f => {
		// request
		streamResponse = await axios({
			url,
			method: 'GET',
			responseType: 'stream'
		});

		// write zip file data
		streamResponse.data.pipe(writeStream);
	});

	writeStream.on('finish', unzipCurrentFires);
	writeStream.on('error', (err) => console.log(err));
}

function unzipCurrentFires() {
	console.log('UNZIP CURRENT FIRES');
	fs.createReadStream(tmp_zip_file)
		.pipe(unzipper.Extract({ path: data_dir }))
		.on('close', processData);
}




// kick isht off!!!
init(url);




