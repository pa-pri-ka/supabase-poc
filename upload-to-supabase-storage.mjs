/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const SUPABASE_URL = process.env.SUPABASE_PUBLIC_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	fatalError(['Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars']);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Recursively collect all files in a directory
function walk(dir) {
	const files = readdirSync(dir);
	const foundFiles = files.flatMap((entry) => {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			return walk(fullPath);
		}
		return [fullPath];
	});
	console.log(`Found ${foundFiles.length} files to upload`, foundFiles);
	return foundFiles;
}

function fatalError(messages) {
	messages.forEach((message) => {
		console.log(message);
	});
	process.exit(1);
}

async function uploadFiles() {
	const { distFolder, bucket } = extractCommandParameters();

	await emptyBucket(bucket);

	// Upload the dist folder content to the bucket

	const files = walk(distFolder);

	const warnings = [];
	for (const filePath of files) {
		const storagePath = relative(distFolder, filePath); // Preserve the relative folder structure in the bucket path
		const fileBody = readFileSync(filePath);

		const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBody, {
			upsert: true,
		});
		if (error) {
			warnings.push(`Error uploading ${storagePath} — ${error.message}`);
		} else {
			console.log(`Uploaded ${storagePath}`);
		}
	}

	if (warnings.length > 0) {
		console.warn('Upload completed with warning 😟');
		warnings.forEach((warning) => {
			console.warn(warning);
		});
	} else {
		console.log('Upload complete 🥳');
	}
}

uploadFiles();

async function emptyBucket(bucket) {
	const { data, error } = await supabase.storage.emptyBucket(bucket);
	if (error && error !== null) {
		fatalError([error]);
	}
	console.log('Clearing bucket: ', data?.message);
	let filesAmount;
	do {
		console.log('Waiting for bucket to be empty...');
		await sleep(500);
		const list = await supabase.storage.from(bucket).list();
		filesAmount = list?.data.length;
	} while (filesAmount !== 0);
	console.log('Bucket empty');
}

function extractCommandParameters() {
	const args = parseArgs({
		options: {
			verbose: { type: 'boolean' },
			bucket: { type: 'string', short: 'b' },
			'dist-folder': { type: 'string', short: 'f', default: './dist' },
		},
	});
	if (!args.values.bucket) {
		fatalError(['Missing bucket parameter. Please specify the name of the bucket using --bucket or -b']);
	}
	return { distFolder: args.values['dist-folder'], bucket: args.values.bucket };
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
