'use strict';
// Some users I found with fewer pages
let user = "kaz" // 1 page
// let user = "JohnnyJohnson" // 2 pages
// let user = "niru"; // 4 pages

var request = require('request-promise');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var nedb = require('nedb'), entries = new nedb({ filename: user+'.db', autoload: true});
request = request.defaults({jar: true});

let ROW_ATTR = ['name', 'type', 'year', 'avg', 'status', 'episodes', 'rewatched', 'rating'];
let baseUrl = "https://www.anime-planet.com/users/" + user + "/anime?sort=title&mylist_view=list";

function extractList(url) {
	console.log(baseUrl+url);
	return request(baseUrl+url).then(html => {
		var $ = cheerio.load(html);
		$('table.personalList').find('tr').slice(1).each((i, elem) => {
			entries.insert(extractEntry($(elem).find('td')));
		});
		var next = $('li.next');
		var nextUrl = next.children().first().attr('href');
		return (next.length === 1) ? nextUrl : null;
	});
}

// entry_id removes duplicates if using the same db file on multiple runs
let totalEntries = 0;
function extractEntry(tableRow){
	var entry = {};
	entry._id = totalEntries++;
	tableRow.each(function(i, ielem){
		entry[ROW_ATTR[i]] = cheerio(ielem).text().trim();
	});
	return entry;
}

let promiseFor = Promise.method(function(condition, action, value){
	if(condition(value)) return value;
	return action(value).then(promiseFor.bind(null, condition, action));
});

promiseFor(
	//condition to stop
	nextUrl => nextUrl === undefined || nextUrl === null,
	//action
	extractList,
	//first value
	"").then(() => {
		// All done
	}).catch(err => console.error(err));

