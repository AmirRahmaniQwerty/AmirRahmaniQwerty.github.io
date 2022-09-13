
var apiKey = "2c46288716a18fb7aadcc2a801f3fc6b";
var methodTimeout = 30000;
var methodBaseUrlV3 = "https://api.themoviedb.org/3/";
var methodBaseUrlV4 = "https://api.themoviedb.org/4/";
var userName = "qwerty090922"
var password = "qwerty1234"
var accountId;
accountId = "14682669"; // TO DO: get from call to account details WS
var posterSizes;
var secureBaseUrl;
var region = "IL";
var language = "he-IL";
var minVoteCount = 100;
var validatedRequestToken;
var sessionId;
//var lastRightArrowPressTime = 0;
//var iFocusedItem = 0;
var iGlobalFocusedItem = 0;
var iBottomItem = -1;
var isWaitingForPageAtTop = false;
var isWaitingForPageAtBottom = false;
var maxScrollY = 0;

var mustHandleArrowKeyPresses = false;
var mustResetList = false;

var addFavText = "הוסף למועדפים";
var removeFavText = "הסר ממועדפים";

var movies = [];
var favs = [];
var isFavsComplete = false;

var nMovies = 0;
var nFavs = 0;

var controlsElem;
var filterElem;
var releasedElem;
var minAvgVoteElem;
var movieDetailsElem;
var resultsElem;

var isReleasedElemVisible = false;
var isMinAvgVoteElemVisible = false;
var isDetailsViewVisible = false;

var movieParams;

var pageSize = 20; // TO DO: read from response in case it ever changes

var minStoredPage = 99999;
var maxStoredPage = -1;


callTmdbMethod(true, "GET", "configuration", null, null, onConfigSuccess);

function onConfigSuccess(responseObj) {
	posterSizes = responseObj.posterSizes;
	secureBaseUrl = responseObj.secureBaseUrl
}

resetMovieList();
minStoredPage = maxStoredPage = 0;
createSession();

function showErrorMessage(errorMessage) {
	if(resultsElem != null) {
		resultsElem.innerText = errorMessage;
		console.error(errorMessage);
	}
}

function pushResults(isFavs, responseObj) {
	if(responseObj.results == null || responseObj.results.length == null) {
		return;
	}
	
	var obj;
	var arr = isFavs ? favs : movies;
	for(var i = 0; i < responseObj.results.length; i++) {
		obj = responseObj.results[i];
		if(obj != null) {
			arr.push(new movie(obj.id, obj.title, obj.overview, obj.popularity, obj.vote_average, obj.poster_path, obj.genre_ids, obj.release_date));
			// *** or just clone the whole object, or the entire array...
		}
	}
}

function onClickItem(iItem) {
	if(!isDetailsViewVisible) {
		openDetailsView(iItem);
	}
}

function createRowHTML(iRow, onSuccess) { // TO DO: maybe create an element instead
	var isFavs = getIsFavs();
	
	if(isFavs) {
		reallyCreateRowHTML(iRow, onSuccess);
		return;
	}
	
	var iNeededPage = Math.floor(iRow / pageSize);

	if(iNeededPage < minStoredPage) {
		if(!isWaitingForPageAtTop) {
			isWaitingForPageAtTop = true;
			getMoviesPage(iNeededPage, function () {
				//minStoredPage = iNeededPage;
				isWaitingForPageAtTop = false;
				reallyCreateRowHTML(iRow, onSuccess);
			});
		}
	}
	else if(iNeededPage > maxStoredPage) {
		if(!isWaitingForPageAtBottom) {
			isWaitingForPageAtBottom = true;
			getMoviesPage(iNeededPage, function () {
				//maxStoredPage = iNeededPage;
				isWaitingForPageAtBottom = false;
				reallyCreateRowHTML(iRow, onSuccess);
			});
		}
	}
	else {
		reallyCreateRowHTML(iRow, onSuccess);
	}
	
	function reallyCreateRowHTML(iRow, onSuccess) {
		var isFavs = getIsFavs();
		var arr = isFavs ? favs : movies;
		var rowHtml = "";

		var obj = arr[iRow];
		if(obj != null) {
			rowHtml = '<div id="item_' + obj.id + '" class="itemRow" onclick="onClickItem(' + iRow + ')">' +
						'  <div class="itemTitle">' + iRow + ": " + obj.title + '</div>' +
						'  <div class="itemDetails">' +
						'    דירוג: ' + obj.vote_average + ', פופולריות: ' + obj.popularity + ', תאריך יציאה: ' + obj.release_date +
						'  </div>' +
					'</div>';
			
			if(onSuccess != null) {
				onSuccess(rowHtml);
			}
		}
	}
}

function addRows(fromRow, toRow) {
	var isFavs = getIsFavs();
	var arr = isFavs ? favs : movies;
	
	var obj;
	var rowHtml;
	var rowsHtml = [];

	for(var i = fromRow; i <= toRow; i++) {
		obj = arr[i];
		if(obj != null) {
			rowHtml = '<div id="item_' + obj.id + '" class="itemRow" onclick="onClickItem(' + i + ')">'; 
			rowHtml += '  <div class="itemTitle">' /*+ i + ": "*/ + obj.title + '</div>';
			rowHtml += '  <div class="itemDetails">';
			rowHtml += '    דירוג: ' + obj.vote_average + ', פופולריות: ' + obj.popularity + ', תאריך יציאה: ' + obj.release_date
			rowHtml += '  </div>';
			rowHtml += '</div>';
			
			rowsHtml.push(rowHtml);
		}
	}
	
	if(resultsElem != null) {
		if(rowsHtml.length > 0) {
			resultsElem.insertAdjacentHTML("beforeend", rowsHtml.join("\n"));
		}
		else {
			if(fromRow == 0) {
				if(isFavs) {
					resultsElem.innerHTML = "אין לך סרטים מועדפים";
				}
				else {
					resultsElem.innerHTML = "לא נמצאו סרטים";
				}
			}
		}
	}
}

function maybeAddRow() {
	if(window.innerHeight > document.documentElement.scrollHeight - 5) {
		if(resultsElem != null) {
			createRowHTML(++iBottomItem, function(html) {
				if(html != "") {
					resultsElem.insertAdjacentHTML("beforeend", html);
					setTimeout(maybeAddRow, 10);
				}
			})
		}
	}
	else {
		console.log("enough");
	}
}

function displayResults(isFavs) {
	var isFavs = getIsFavs();
	var arr = isFavs ? favs : movies;
	var nItems = isFavs ? nFavs : nMovies;
	var html;
	
	maybeAddRow();
	
}

function movie(id, title, overview, popularity, vote_average, poster_path, genre_ids, release_date) {
	this.id = id;
	this.title = title;
	this.overview = overview;
	this.popularity = popularity;
	this.vote_average = vote_average;
	this.poster_path = poster_path;
	this.genre_ids = genre_ids.slice();
	this.release_date = release_date;
}

function getAllFavs(onSuccess) {
	isFavsComplete = false;
	favs = [];
	getFavsPage(0, onSuccess);
}

function getAndFillMovies() {
	getMoviesPage(0, onSuccess);
	
	function onSuccess() {
		displayResults(false);
	}
}

function getMoviesPage(iPage, onSuccess) {
	if(!callTmdbMethod(false, "GET", "discover/movie", movieParams + "&page=" + (iPage + 1), null, onMoviesSuccess)) {
		return;
	}
	
	function onMoviesSuccess(responseObj) {
		nMovies = responseObj.total_results;
		pushResults(false, responseObj);
		
		if(iPage < minStoredPage) {
			minStoredPage = iPage;
		}
		
		if(iPage > maxStoredPage) {
			maxStoredPage = iPage;
		}
		
		console.log("page: " + (responseObj.page - 1) + " (zero-based) of " + responseObj.total_pages);

		if(onSuccess != null) {
			onSuccess(responseObj);
		}
	}
	
	function onError() {
	}
}

function getFavsPage(iPage, onSuccess) {
	if(!callTmdbMethod(true, "GET", "account/" + accountId + "/favorite/movies", "language=" + language + "&sort_by=created_at.asc&page=" + (iPage + 1) + "&session_id=" + sessionId, null, onFavsSuccess)) {
		return;
	}
	
	function onFavsSuccess(responseObj) {
		nFavs = responseObj.total_results;
		pushResults(true, responseObj);
		
		if(responseObj.page + 1 < responseObj.total_pages) {
			getFavsPage(responseObj.page /*+ 1*/, onSuccess);
		}
		else {
			isFavsComplete = true;
			if(onSuccess != null) {
				onSuccess(responseObj);
			}
		}
	}
}

function createSession() {
	if(!callTmdbMethod(true, "GET", "authentication/token/new", null, null, onTokenSuccess)) {
		return;
	}

	function onTokenSuccess(responseObj) {
		var body = {
		  "username": userName,
		  "password": password,
		  "request_token": responseObj.request_token
		}

		if(!callTmdbMethod(true, "POST", "authentication/token/validate_with_login", null, body, onValidateSuccess)) {
			return;
		}
		
		function onValidateSuccess(responseObj) {
			validatedRequestToken = responseObj.request_token;
			// *** TO DO: renew validation when necessary

			var body = {
				"request_token": validatedRequestToken
			}
			if(!callTmdbMethod(true, "POST", "authentication/session/new", null, body, onSessionSuccess)) {
				return;
			}
			
			function onSessionSuccess(responseObj) {
				sessionId = responseObj.session_id;
				getAllFavs();
			}
		}
	}
}

function callTmdbMethod(useV3, httpMethod, methodUrl, params, body, successCallback, errorCallback) {
	try {
		var xhr = new XMLHttpRequest();
		
		xhr.timeout = methodTimeout;
		
		xhr.ontimeout = function () {
			showErrorMessage("Timeout error calling " + url);
			if(errorCallback != null) {
				errorCallback("Timeout error");
			}
		}
		
		var url = (useV3 ? methodBaseUrlV3 : methodBaseUrlV4) + methodUrl + "?api_key=" + apiKey;
		if(params != null) {
			url += "&" + params;
		}
		
		xhr.open(httpMethod, url);
		
		if(body != null) {
			xhr.setRequestHeader("Content-Type", "application/json")
		}
		
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status == 200 || xhr.status == 201) {
					var responseObj = JSON.parse(xhr.responseText);
					
					if(responseObj.success === false) {
						var errorMessage = "Error calling " + url + "\n";
						
						if(responseObj.status_message != null) {
							errorMessage += "code: " + responseObj.status_code + "\n";
							errorMessage += "message: " + responseObj.status_message + "\n";
						}
						
						showErrorMessage(errorMessage);
						return;
					}

					if(successCallback != null) {
						successCallback(responseObj);
					}
				}
				else {
					showErrorMessage("Error calling " + url + ", status " + xhr.status);
					if(errorCallback != null) {
						errorCallback(xhr.status);
					}
				}
			}
		}
		
		if(body != null) {
			xhr.send(JSON.stringify(body));
		}
		else {
			xhr.send();
		}
		
		return true;
	}
	catch(e) {
		showErrorMessage("Caught error calling " + url + ", error " + e);
		if(errorCallback != null) {
			errorCallback(e);
		}
		
		return false;
	}
}	

function formattedTodayPlusWeeks(nWeeks) {
	var ms = new Date().getTime() + nWeeks * 7 * 24 * 3600 * 1000;
	return new Date(ms).toISOString().split('T')[0];
}

function resetMovieList() {
	iBottomItem = -1;
	iTopItem = 0;
	minStoredPage = 99999;
	maxStoredPage = -1;
	iGlobalFocusedItem = 0;
	
	window.scrollTo(0, 0);
	maxScrollY = 0;
	
	if(resultsElem != null) {
		resultsElem.innerHTML = "";
	}

	movies = [];
	movieParams = "";
	
	var filterType = "popular";
	if(filterElem != null) {
		filterType = filterElem.value;
	}
	
	switch(filterType) {
		case "popular":
			movieParams += "region=" + region + "&language=" + language + "&sort_by=popularity.desc";
			
			getAndFillMovies();
			break;
			
		case "fav":
			displayResults(true);
			break;
			
		case "playingNow":
			var nWeeks = 4;
			if(releasedElem != null) {
				nWeeks = releasedElem.value;
			}
			var gte = formattedTodayPlusWeeks(-nWeeks);
			var lte = formattedTodayPlusWeeks(1);
			
			// *** note: to use limited release date, use 3|2 instead of 2|3
			movieParams += "region=" + region + "&language=" + language + "&with_release_type=3|2&release_date.gte=" + gte + "&release_date.lte=" + lte;
			movieParams += "&sort_by=release_date.desc";
			
			getAndFillMovies();
			break;
			
		case "rated":
			var gte = 1;
			if(minAvgVoteElem != null) {
				gte = minAvgVoteElem.value;
			}
			movieParams += "region=" + region + "&language=" + language + "&vote_average.gte=" + (gte  - 0.1) + "&vote_count.gte=" + minVoteCount + "&sort_by=vote_average.desc";
			
			getAndFillMovies();
			break;
	}
}

function onFilterChanged() {
	switch(filterElem.value) {
		case "popular":
		case "fav":
			releasedElem.style.visibility = "hidden";
			minAvgVoteElem.style.visibility = "hidden";
			
			isReleasedElemVisible = false;
			isMinAvgVoteElemVisible = false;
			
			resetMovieList();
			break;
			
		case "playingNow":
			releasedElem.style.visibility = "visible";
			minAvgVoteElem.style.visibility = "hidden";
			
			isReleasedElemVisible = true;
			isMinAvgVoteElemVisible = false;
			
			resetMovieList();
			break;
			
		case "rated":
			releasedElem.style.visibility = "hidden";
			minAvgVoteElem.style.visibility = "visible";
			
			isReleasedElemVisible = false;
			isMinAvgVoteElemVisible = true;

			resetMovieList();
			break;
			
	}
}

function closeDetailsView() {
	isDetailsViewVisible = false;
	movieDetailsElem.style.display = "none";
	if(mustResetList) {
		resetMovieList();
		mustResetList = false;
	}
}

function toggleFav(id, isItemFav) {
	isItemFav = !isItemFav;
	
	var body = {
		"media_type": "movie",
		"media_id": id,
		"favorite": isItemFav
	}
	
	callTmdbMethod(true, "POST", "account/" + accountId + "/favorite", "session_id=" + sessionId, body, onSuccess);
	
	function onSuccess() {
		var toggleFavElem = document.querySelector("#toggleFav");
		
		if(toggleFavElem != null) {
			toggleFavElem.value = isItemFav ? removeFavText : addFavText;
		}
		
		getAllFavs(onGetSuccess);
		
		function onGetSuccess() {
			if(getIsFavs()) {
				mustResetList = true;
			}
		}
	}
}

function openDetailsView(iItem) {
	if(movieDetailsElem == null) {
		return;
	}
	
	isDetailsViewVisible = true;
	movieDetailsElem.style.display = "";
		
	var arr = getIsFavs() ? favs : movies;
	var rowsHtml = [];
	var rowHtml;
	var isItemFav;
	
	obj = arr[iItem];
	if(obj != null) {
		isItemFav = favs.filter(function(favObj) { return favObj.id == obj.id }).length > 0;
		
		rowHtml = '<div id="item_' + obj.id + '" class="itemRow">';
		rowHtml += '  <input id="closeButton" type="button" onclick="closeDetailsView()" value="X"></input>';
		rowHtml += '  <input id="toggleFav" type="button" onclick="toggleFav(' + obj.id + ',' + isItemFav + ')" value="' + (isItemFav ? removeFavText : addFavText) + '"></input>';
		rowHtml += '  <div class="itemTitle">' + obj.title + '</div>';
		rowHtml += '  <div class="itemOverview">' + obj.overview + '</div>';
		rowHtml += '  <div class="itemDetails">';
		rowHtml += '    <div class="itemVoteAverage">דירוג: ' + obj.vote_average + '</div>';
		rowHtml += '    <div class="itemPopularity">פופולריות: ' + obj.popularity + '</div>';
		rowHtml += '    <div class="itemVoteAverage">תאריך יציאה: ' + obj.release_date + '</div>';
		rowHtml += '  </div>';
		rowHtml += '</div>';
		
		rowsHtml.push(rowHtml);
	}
	
	if(rowsHtml.length > 0) {
		movieDetailsElem.innerHTML = rowsHtml.join("\n");
	}
}

function onReleasedChanged() {
	resetMovieList();
}

function onMinAvgVoteChanged() {
	resetMovieList();
}

function getIsFavs() {
	var filterType = "popular";
	if(filterElem != null) {
		filterType = filterElem.value;
	}
	return filterType == "fav";
}

function onOk(e) {
	if(document.activeElement != null && document.activeElement.tagName == "SELECT") {
		return;
	}
	
	if(isDetailsViewVisible) {
		
	}
	else {
		openDetailsView();
	}
}
function setSizes() {
}

function onResized() {
	setSizes();
}

function onOrientationChanged() {
	setSizes();
}

function setItemFocus(iNewFocusedItem) {
	return;
	/*
	var elem;
	
	elem = document.querySelectorAll(".itemRow")[iFocusedItem];
	if(elem != null) {
		elem.className = elem.className.replace("focused", "");
	}
	
	iFocusedItem = iNewFocusedItem;

	elem = document.querySelectorAll(".itemRow")[iFocusedItem];
	if(elem != null) {
		elem.className += " focused";
	}
	*/
}


function onDown(e) {
	if(isDetailsViewVisible) {
		e.preventDefault();
		return;
	}
	
	if(document.activeElement != null && document.activeElement.tagName == "SELECT") {
		//e.preventDefault();
		return;
	}
	
	var isFavs = getIsFavs();
	var nItems = isFavs ? nFavs : nMovies;
	
	var lastIndex = nDisplayedItems - 1;
	if(iTopItem + lastIndex > nItems - 1) {
		lastIndex = nItems - iTopItem - 1;
	}
	
	if(iFocusedItem < lastIndex) {
		++iGlobalFocusedItem;
		setItemFocus(iFocusedItem + 1);
	}
	else {
		if(iTopItem + iFocusedItem < nItems - 1) {
			++iGlobalFocusedItem;
			iTopItem += nDisplayedItems;
			var maxPossible = nItems - nDisplayedItems + 1;
			if(iTopItem > maxPossible) {
				iTopItem = maxPossible;
			}
			scrollToItem(isFavs);
		}
	}
}

function onUp(e) {
	if(isDetailsViewVisible) {
		e.preventDefault();
		return;
	}
	
	if(document.activeElement != null && document.activeElement.tagName == "SELECT") {
		//e.preventDefault();
		return;
	}
	
	var isFavs = getIsFavs();
	
	if(iFocusedItem > 0) {
		--iGlobalFocusedItem;
		setItemFocus(iFocusedItem - 1);
	}
	else {
		if(iGlobalFocusedItem > 0) {
			--iGlobalFocusedItem;
			iTopItem -= nDisplayedItems;
			if(iTopItem < 0) {
				iTopItem = 0;
			}
			scrollToItem(isFavs);
		}
	}
}

function onLeft(e) {
	if(isDetailsViewVisible) {
		e.preventDefault();
		return;
	}

	if(filterElem != null && document.activeElement == filterElem) {
		e.preventDefault();
		
		if(isReleasedElemVisible) {
			releasedElem.focus();
		}
		else if(isMinAvgVoteElemVisible) {
			minAvgVoteElem.focus();
		}
	}
	else if(releasedElem != null && document.activeElement == releasedElem || minAvgVoteElem != null && document.activeElement == minAvgVoteElem) {
		e.preventDefault();
	}
}

function onRight(e) {
	if(isDetailsViewVisible) {
		e.preventDefault();
		return;
	}

	if(document.activeElement == document.body) {
		var now = new Date().getTime();
		if(window.scrollX == 0) {
			if(now - lastRightArrowPressTime > 800) {
				e.preventDefault();
				if(filterElem != null) {
					filterElem.focus();
				}
			}
		}
		lastRightArrowPressTime = now;
	}
	else if(releasedElem != null && document.activeElement == releasedElem || minAvgVoteElem != null && document.activeElement == minAvgVoteElem) {
		e.preventDefault();
		if(filterElem != null) {
			filterElem.focus();
		}
	}
	else if(filterElem != null && document.activeElement == filterElem) {
		e.preventDefault();
	}
}

function onWheel(e) {
	if(document.activeElement == document.body) {
		if(e.deltaY > 0) {
			onDown(e);
		}
		else if(e.deltaY < 0) {
			onUp(e);
		}
	}
}

function onKeyDown(e) {
	switch(e.key) {
		case "ArrowLeft":
			if(mustHandleArrowKeyPresses) {
				onLeft(e);
			}
			break;

		case "ArrowRight":
			if(mustHandleArrowKeyPresses) {
				onRight(e);
			}
			break;
			
		case "ArrowDown":
			if(mustHandleArrowKeyPresses) {
				onDown(e);
			}
			break;
			
		case "ArrowUp":
			if(mustHandleArrowKeyPresses) {
				onUp(e);
			}
			break;
			
		case "Enter":
			onOk(e);
			break;
			
		case "Escape":
			if(isDetailsViewVisible) {
				closeDetailsView();
			}
			else {
				if(document.activeElement != document.body) {
					if(document.activeElement != null && document.activeElement.blur != null) {
						document.activeElement.blur();
					}
					document.body.focus();
				}
			}
			break;
	}
}

function createPost(){
	if(resultsElem != null) {
		createRowHTML(++iBottomItem, function(html) {
			if(html == undefined) {
				console.log("what?");
			}
			if(html != "") {
				resultsElem.insertAdjacentHTML("beforeend", html);
				setTimeout(maybeAddRow, 1000);
			}
			else {
				//resultsElem.insertAdjacentHTML("beforeend", "<h1>enddddddddddddddddddd</h1>");
			}
		})
	}
	/*
	const post = document.createElement("div");
	post.className = "text";
	post.innerHTML = `<h1>Lorem ipsum dolor sit amet</h1>
	<p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Doloremque eos, atque sed saepe
	   tempore, sequi qui excepturi voluptate ut perspiciatis culpa sit harum, corrupti ullam 
	   voluptatibus obcaecati sint dignissimos quas.</p>`;
	resultsElem.appendChild(post);
	}
	*/
}

function loadHandler() {
	controlsElem = document.querySelector("#controls");
	resultsElem = document.querySelector("#results");
	movieDetailsElem = document.querySelector("#movieDetails");
	filterElem = document.querySelector("#filter");
	releasedElem = document.querySelector("#released");
	minAvgVoteElem = document.querySelector("#minAvgVote");
	
	window.addEventListener("resize", onResized);
	window.addEventListener("orientationchange", onOrientationChanged);
	window.addEventListener("keydown", onKeyDown);
	//window.addEventListener("wheel", onWheel);
	
	window.addEventListener("scroll", function (e) {
		if(window.scrollY > maxScrollY) {
			if(isWaitingForPageAtBottom) {
				console.log("isWaitingForPageAtBottom");
				e.preventDefault();
			}
			else {
				var scrollHeight = document.documentElement.scrollHeight;
				if(window.scrollY + window.innerHeight > scrollHeight - 5){
					setTimeout(createPost, 100);
				}
				maxScrollY = window.scrollY;
			}
		}
	});

	if(filterElem != null) {
		filterElem.addEventListener("change", onFilterChanged);
	}
	
	if(releasedElem != null) {
		releasedElem.addEventListener("change", onReleasedChanged);
	}
	
	if(minAvgVoteElem != null) {
		minAvgVoteElem.addEventListener("change", onMinAvgVoteChanged);
	}
	
	setSizes();
}

