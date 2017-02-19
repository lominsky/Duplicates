var md5File = require('md5-file');
var fs = require('fs');
var os = require('os');

var files = [];
var duplicates = [];
var usernames;
var homedir = os.homedir();
var cwd = process.cwd();

var instructions = "Usage: duplicates [option]\n\n-h\t\tSearches your user directory\n-c\t\tSearches your current working directory\n-p [path]\tSearches the specified path";

if(process.argv.length > 2) {
	if(process.argv[2] == "-h") {
		realpath(homedir);
	} else if(process.argv[2] == "-p") {
		if(process.argv.length > 3) {
			realpath(process.argv[3]);
		} else {
			console.log("You must enter a file path.");
		}
	} else if(process.argv[2] == "-c") {
		realpath(cwd);
	} else {
		console.log(instructions);
	}
} else {
	console.log(instructions);

}


function realpath(p) {
	console.log("Finding Files (every dot indicates a folder being searched)");
	var path = fs.realpathSync(p);
	readdir(path);
	console.log();
    sortFiles();
}

function readdir(path) {
	process.stdout.write(".");
	var _files = fs.readdirSync(path);
    _files.forEach(function(f) {
		var fullPath = path + "/" + f;
    	if(isValid(path, f)) {
    		var stat = fs.statSync(fullPath);
    		if(stat.isFile()) {
		        var hash = md5File.sync(fullPath);
				var file = {
					hash: hash,
					path: fullPath
				};
				files.push(file);
		    } else if (stat.isDirectory()) {
		    	readdir(fullPath);
		    }
    	}
    });
}

function isValid(path, f) {
	var fullPath = path + "/" + f;
	if(f.charAt(0) == ".")
		return false;
	if(f.indexOf(".app") != -1)
		return false;
	if(fullPath == homedir + "/Library")
		return false;
	if(fullPath == homedir + "/Pictures/Photos Library.photoslibrary")
		return false;

	return true;
}

function sortFiles() {
	console.log("Sorting File Hashes");
	files.sort(function(a, b) {
	    return a.hash.localeCompare(b.hash);
	});
	checkForDuplicates();
}

function checkForDuplicates() {
	console.log("Finding Duplicates");
	for(var i = 0; i < files.length; i++) {
		if(duplicates.length > 0 && files[i].hash == duplicates[duplicates.length-1].hash) {
			duplicates.push(files[i]);
		} else if(i + 1 < files.length -1 && files[i].hash == files[i+1].hash) {
			duplicates.push(files[i]);
		}
	}
	writeFile();
}

function writeFile() {
	if(duplicates.length > 0) {
		console.log("Writing Duplicates to File");
		var string = "";
		for(var i = 0; i < duplicates.length; i++) {
			if(i > 0) {
				if(duplicates[i].hash != duplicates[i-1].hash) {
					string += "\n";
				}
			}
			string += duplicates[i].path + "\n";
		}
		var fileName = 'Duplicates-' + Date.now() + '.txt';
		fs.writeFile(fileName, string, (err) => {
	 		if (err) throw err;
			console.log('Created file: ' + cwd + "/" + fileName);
		});
	} else {
		console.log("No Duplicates Found");
	}
}