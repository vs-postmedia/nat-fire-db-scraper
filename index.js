import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { parse } from "csv-parse/sync"; // npm install csv-parse
import { stringify } from "csv-stringify/sync"; // npm install csv-stringify


// VARS
let current_fires;
const data_dir = 'data';
const outputFile = "./data/activefires_filtered.csv";
// const tmp_file = './data/fire-data.csv';

// Array of values to keep
const FILTER_VALUES = ['UC', 'OC', 'BH']; // 'EX' == out
const url = 'https://cwfis.cfs.nrcan.gc.ca/downloads/activefires/activefires.csv';


async function init(url) {
	console.log(url)

	try {
		console.log("Downloading CSV...");
		const response = await axios.get(url);
		const csvText = response.data;

		// Parse CSV into objects
		const records = parse(csvText, {
			columns: true,
			relax_column_count: true,
			skip_empty_lines: true
		});

		// Filter by stage_of_control (array)
		const filtered = records.filter((row,i) => {
			const ctrl = row[' stage_of_control'];

			return FILTER_VALUES.includes(ctrl.trim()) && row[' hectares'] > 0;
		});

		filtered.forEach(row => {
			let status;
			// fire size should be in km2
			row.size_km2 = parseFloat(row[' hectares']) / 100;

			const ctrl = row[' stage_of_control'];

			switch (ctrl) {
				case " OC":
					status = 'Out of control';
					break;
				case " UC":
					status = 'Under control';
					break;
				case " BH":
					status = 'Held';
					break;
				default:
					status = ctrl
			}
			
			row.status = status;

			// Cleanup
			delete row['agency'];
			delete row[' hectares'];
			delete row[' stage_of_control'];
			delete row[' timezone'];
		});

		// Convert back to CSV
		const output = stringify(filtered, {
			header: true,
		});


		 // Save to disk
    	fs.writeFileSync(outputFile, output, 'utf8');

		console.log('Done!')

	} catch (err) {
		console.error('Error: ', err)
	}
}


async function downloadAndProcess(url) {
	let streamResponse;
	// stream writer where we'll download the data
	const writeStream = fs.createWriteStream(tmp_file, {flag: 'wx'});
	
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

	writeStream.on('finish', processData);
	writeStream.on('error', (err) => console.log(err));
}




// kick isht off!!!
init(url);




