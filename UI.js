/*
=============================================================================
UI.js
Version 1.0.3 2026-06-06 17h30
============================================================================= 
*/

const DFC_UI = {
	boardsBuilt: false,
	btnResetBoards: null,
	btnScoreOk: null,
	dihButtons: [],
	favDblEls: [],
	favDblHeader: null,
	favDblOpen: false,
	favDblSliderLines: [],
	favDblSliderRow: null,
	favTrpEls: [],
	favTrpHeader: null,
	favTrpOpen: false,
	favTrpSliderLines: [],
	favTrpSliderRow: null,
	finishTableEls: [],
	messagePanel: null,
	numPadButtons: [],
	scoreAfterEls: [],
	scoreBeforeEls: [],
	scoreDisplay: null,
	scoreFinal: null,
	segmentEls: [],
	valueEls: []
};

//==============================================================================
function gid( id ){return document.getElementById( id );}
//==============================================================================
function qsa( selector ){return document.querySelectorAll( selector );}
//==============================================================================
function cacheUiElements(){
	DFC_UI.btnResetBoards = gid( "btnResetBoards" );
	DFC_UI.btnScoreOk = gid( "btnScoreOk" );
	DFC_UI.dihButtons = qsa( ".dihButton" );
	DFC_UI.favDblEls = [ gid( "favD1" ), gid( "favD2" ), gid( "favD3" ) ];
	DFC_UI.favTrpEls = [ gid( "favT1" ), gid( "favT2" ), gid( "favT3" ) ];
	DFC_UI.finishTableEls = [ gid( "finishTableDart1" ), gid( "finishTableDart2" ), gid( "finishTableDart3" ) ];
	DFC_UI.messagePanel = gid( "messagePanel" );
	DFC_UI.numPadButtons = qsa( "[data-numpad-value]" );
	DFC_UI.scoreAfterEls = [ gid( "scoreAfterDart1" ), gid( "scoreAfterDart2" ), gid( "scoreAfterDart3" ) ];
	DFC_UI.scoreBeforeEls = [ gid( "scoreBeforeDart1" ), gid( "scoreBeforeDart2" ), gid( "scoreBeforeDart3" ) ];
	DFC_UI.scoreDisplay = gid( "scoreDisplay" );
	DFC_UI.scoreFinal = gid( "scoreFinal" );
	DFC_UI.segmentEls = [ gid( "segmentDart1" ), gid( "segmentDart2" ), gid( "segmentDart3" ) ];
	DFC_UI.valueEls = [ gid( "valueDart1" ), gid( "valueDart2" ), gid( "valueDart3" ) ];

	DFC_UI.favDblHeader = gid( "favDblHeader" );
	DFC_UI.favTrpHeader = gid( "favTrpHeader" );
	DFC_UI.favDblHeader.style.cursor = "pointer";
	DFC_UI.favTrpHeader.style.cursor = "pointer";
	DFC_UI.favDblSliderRow = gid( "favDblSliderRow" );
	DFC_UI.favTrpSliderRow = gid( "favTrpSliderRow" );
	DFC_UI.favDblSliderLines = qsa( "[data-fav-slider-line='DBL']" );
	DFC_UI.favTrpSliderLines = qsa( "[data-fav-slider-line='TRP']" );
}
//==============================================================================
function bindUiEvents(){
	for( let button of DFC_UI.numPadButtons ){button.addEventListener( "click", ()=>{handleNumPadInput( button.dataset.numpadValue );});}
	for( let button of DFC_UI.dihButtons ){button.addEventListener( "click", ()=>{handleDihButtonClick( button );});}
	for( let button of qsa( "[data-fav-delta]" ) ){button.addEventListener( "click", handleFavoriteStepButtonClick );}
	for( let slider of qsa( "[data-fav-slider]" ) ){
		slider.addEventListener( "input", handleFavoriteSliderInput );
		slider.addEventListener( "change", handleFavoriteSliderChange );
	}
	for( let value of qsa( "[data-fav-value]" ) ){value.addEventListener( "click", handleFavoriteValueClick );}

	DFC_UI.favDblHeader.addEventListener( "click", ()=>{toggleFavoriteSliderPanel( "DBL" );});
	DFC_UI.favTrpHeader.addEventListener( "click", ()=>{toggleFavoriteSliderPanel( "TRP" );});
	DFC_UI.btnScoreOk.addEventListener( "click", handleScoreOkClick );
	DFC_UI.btnResetBoards.addEventListener( "click", handleResetBoardsClick );
}
//==============================================================================
async function initDFC(){
	cacheUiElements();
	bindUiEvents();
	renderScoreInput();
	renderFavoriteLists();
	renderFavoriteSliderPanels();
	renderScorePanels();
	renderMessages();
	try{
		await loadDFCData();
		addMessage( "Data loaded. Enter score and press OK." );
		renderMessages();
	}catch( error ){
		addMessage( "Data load failed: " + error.message );
		renderMessages();
	}
}
//==============================================================================
function handleNumPadInput( value ){
	if( value === "delete" ){
		deleteScoreInputDigit();
	}else{
		addScoreInputDigit( value );
	} 
	renderScoreInput();
}
//==============================================================================
function handleScoreOkClick(){
	if( !hasDFCData() ){addMessage( "Data is not loaded yet." ); renderMessages(); return;}
	clearMessages();
	setStartScore( getParsedScoreInput() );
	DFC_UI.boardsBuilt = true;
	addMessage( "Score set to " + DFC_STATE.startScore + "." );
	renderFullUi();
}
//==============================================================================
function handleResetBoardsClick(){resetDarts(); addMessage( "Dartboards reset." ); renderFullUi();}
//==============================================================================
function handleDihButtonClick( button ){
	setDartsInHand( button.dataset.dih );
	resetDarts();
	addMessage( DFC_STATE.dartsInHand + " darts in hand." );
	renderFullUi();
}
//==============================================================================
function toggleFavoriteSliderPanel( favType ){
	if( favType === "DBL" ){DFC_UI.favDblOpen = !DFC_UI.favDblOpen;}
	else{DFC_UI.favTrpOpen = !DFC_UI.favTrpOpen;}
	renderFavoriteSliderPanels();
}
//==============================================================================
function handleFavoriteSliderInput( event ){
	let slider = event.target;
	setBalancedFavWeight( slider.dataset.favType, slider.dataset.favIndex, slider.value );
	renderFavoriteLists();
	renderFavoriteSliderValues( slider.dataset.favType );
	if( DFC_UI.boardsBuilt ){renderAllDartBoards(); renderFinishTablesFrom( 0 );}
}
//==============================================================================
function handleFavoriteSliderChange(){renderFavoriteSliderPanels();}
//==============================================================================
function handleFavoriteStepButtonClick( event ){
	let button = event.target;
	adjustBalancedFavWeight( button.dataset.favType, button.dataset.favIndex, button.dataset.favDelta );
	renderFavoriteLists();
	renderFavoriteSliderPanels();
	if( DFC_UI.boardsBuilt ){renderAllDartBoards(); renderFinishTablesFrom( 0 );}
}
//==============================================================================
function handleFavoriteValueClick( event ){
	let valueEl = event.currentTarget;
	let favList = getFavList( valueEl.dataset.favType );
	let favIndex = parseInt( valueEl.dataset.favIndex );
	let curWeight = favList[favIndex].favWeight;
	let inputValue = prompt( "Set " + favList[favIndex].seg + " weight", curWeight );
	if( inputValue === null ){return;}
	setFavWeightExact( valueEl.dataset.favType, favIndex, inputValue );
	renderFavoriteLists();
	renderFavoriteSliderPanels();
	if( DFC_UI.boardsBuilt ){renderAllDartBoards(); renderFinishTablesFrom( 0 );}
}
//==============================================================================
function onDartBoardSegmentClick( boardIndex, segment ){
	if( !DFC_UI.boardsBuilt ){return;}
	setDartSegment( boardIndex, segment );
	addMessage( "Dart " + ( boardIndex + 1 ) + ": " + segment.SegId + " hit for " + segment.SegVal + "." );
	renderScorePanels();
	renderDartBoardsFrom( boardIndex );
	renderFinishTablesFrom( boardIndex );
	renderMessages();
}
//==============================================================================
function renderFullUi(){
	renderScoreInput();
	renderFavoriteLists();
	renderFavoriteSliderPanels();
	renderDihButtons();
	renderScorePanels();
	if( DFC_UI.boardsBuilt ){renderAllDartBoards(); renderFinishTablesFrom( 0 );}
	renderMessages();
}
//==============================================================================
function renderScoreInput(){DFC_UI.scoreDisplay.textContent = getScoreInput();}
//==============================================================================
function getFavEntriesSortedByWeight( favType ){
	let retArr = [];
	let favList = getFavList( favType );
	for( let i = 0; i < favList.length; i++ ){retArr.push({ favIndex: i, fav: favList[i] });}
	retArr.sort( ( a, b )=>{
		if( a.fav.favWeight !== b.fav.favWeight ){return b.fav.favWeight - a.fav.favWeight;}
		return a.fav.seg.localeCompare( b.fav.seg );
	});
	return retArr;
}
//==============================================================================
function renderFavoriteLists(){
	let favDblEntries = getFavEntriesSortedByWeight( "DBL" );
	let favTrpEntries = getFavEntriesSortedByWeight( "TRP" );
	for( let i = 0; i < 3; i++ ){
		DFC_UI.favDblEls[i].textContent = favDblEntries[i].fav.seg;
		DFC_UI.favTrpEls[i].textContent = favTrpEntries[i].fav.seg;
	}
}
//==============================================================================
function renderFavoriteSliderPanels(){
	let favDblEntries = getFavEntriesSortedByWeight( "DBL" );
	let favTrpEntries = getFavEntriesSortedByWeight( "TRP" );

	DFC_UI.favDblHeader.textContent = DFC_UI.favDblOpen ? "Fav Double ▾" : "Fav Double ▸";
	DFC_UI.favTrpHeader.textContent = DFC_UI.favTrpOpen ? "Fav Treble ▾" : "Fav Treble ▸";

	if( DFC_UI.favDblOpen ){DFC_UI.favDblSliderRow.classList.remove( "isHidden" );}
	else{DFC_UI.favDblSliderRow.classList.add( "isHidden" );}

	if( DFC_UI.favTrpOpen ){DFC_UI.favTrpSliderRow.classList.remove( "isHidden" );}
	else{DFC_UI.favTrpSliderRow.classList.add( "isHidden" );}

	for( let i = 0; i < 3; i++ ){
		updateFavoriteSliderLine( DFC_UI.favDblSliderLines[i], "DBL", favDblEntries[i] );
		updateFavoriteSliderLine( DFC_UI.favTrpSliderLines[i], "TRP", favTrpEntries[i] );
	}
}
//==============================================================================
function updateFavoriteSliderLine( line, favType, entry ){
	let label = line.querySelector( "[data-fav-label]" );
	let minus = line.querySelector( "[data-fav-delta='-2']" );
	let slider = line.querySelector( "[data-fav-slider]" );
	let plus = line.querySelector( "[data-fav-delta='2']" );
	let value = line.querySelector( "[data-fav-value]" );
	let parity = entry.fav.favWeight % 2;

	line.dataset.favType = favType;
	line.dataset.favIndex = entry.favIndex;
	label.textContent = entry.fav.seg;

	minus.dataset.favType = favType;
	minus.dataset.favIndex = entry.favIndex;

	slider.dataset.favType = favType;
	slider.dataset.favIndex = entry.favIndex;
	slider.min = parity.toString();
	slider.max = parity === 0 ? "100" : "99";
	slider.value = entry.fav.favWeight;
	paintFavoriteSlider( slider, entry.fav.favWeight );

	plus.dataset.favType = favType;
	plus.dataset.favIndex = entry.favIndex;

	value.dataset.favType = favType;
	value.dataset.favIndex = entry.favIndex;
	value.textContent = formatFavWeight( entry.fav.favWeight );
}
//==============================================================================
function paintFavoriteSlider( slider, favWeight ){slider.style.setProperty( "--fav-level", favWeight + "%" );}
//==============================================================================
function renderFavoriteSliderValues( favType ){
	let favList = getFavList( favType );
	let lines = favType === "DBL" ? DFC_UI.favDblSliderLines : DFC_UI.favTrpSliderLines;

	for( let line of lines ){
		let slider = line.querySelector( "[data-fav-slider]" );
		let value = line.querySelector( "[data-fav-value]" );
		let fav = favList[parseInt( slider.dataset.favIndex )];
		let parity = fav.favWeight % 2;

		slider.min = parity.toString();
		slider.max = parity === 0 ? "100" : "99";
		slider.value = fav.favWeight;
		paintFavoriteSlider( slider, fav.favWeight );
		value.textContent = formatFavWeight( fav.favWeight );
	}
}
//==============================================================================
function renderDihButtons(){
	for( let button of DFC_UI.dihButtons ){
		if( parseInt( button.dataset.dih ) === DFC_STATE.dartsInHand ){button.setAttribute( "data-selected", "true" );}
		else{button.removeAttribute( "data-selected" );}
	}
}
//==============================================================================
function renderScorePanels(){
	for( let dartIndex = 0; dartIndex < 3; dartIndex++ ){
		let scoreBefore = getSB_FromIdx( dartIndex );
		let dartValue = getDartValue( dartIndex );
		let scoreAfter = scoreBefore - dartValue;
		DFC_UI.scoreBeforeEls[dartIndex].textContent = scoreBefore;
		DFC_UI.segmentEls[dartIndex].textContent = getDartSegmentName( dartIndex );
		DFC_UI.valueEls[dartIndex].textContent = dartValue;
		DFC_UI.scoreAfterEls[dartIndex].textContent = getDartSegment( dartIndex ) ? scoreAfter : "";
	}
	DFC_UI.scoreFinal.textContent = getDisplayFinalScore();
}
//==============================================================================
function getDisplayFinalScore(){
	let finalScore = DFC_STATE.startScore;
	for( let dartIndex = 0; dartIndex < 3; dartIndex++ ){finalScore = finalScore - getDartValue( dartIndex );}
	return finalScore;
}
//==============================================================================
function renderFinishTablesFrom( startBoardIndex = 0 ){
	for( let boardIndex = startBoardIndex; boardIndex < 3; boardIndex++){ renderFinishTable( boardIndex );}
}
//==============================================================================
function renderFinishTable( boardIndex ){
	let targetElement = DFC_UI.finishTableEls[boardIndex];
	let scoreBefore = getSB_FromIdx( boardIndex );
	let dartsInHand = 3 - boardIndex;
	let routes = getFinishRoutes( scoreBefore, dartsInHand, boardIndex );
	clearElement( targetElement );
	if( routes.length === 0 ){renderNoFinishRoute( targetElement ); return;}
	let table = document.createElement( "table" );
	let thead = document.createElement( "thead" );
	let tbody = document.createElement( "tbody" );
	renderFinishTableHeader( thead, boardIndex );
	renderFinishTableBody( tbody, routes, boardIndex );
	table.appendChild( thead );
	table.appendChild( tbody );
	targetElement.appendChild( table );
}
//==============================================================================
function renderFinishTableHeader( thead, boardIndex ){
	let row = document.createElement( "tr" );
	for( let dartIndex = boardIndex; dartIndex < 3; dartIndex++ ){appendTableCell( row, "th", "D" + ( dartIndex + 1 ) );}
	appendTableCell( row, "th", "DF" );
	thead.appendChild( row );
}
//==============================================================================
function renderFinishTableBody( tbody, routes, boardIndex ){
	for( let route of routes ){
		let row = document.createElement( "tr" );
		for( let dartIndex = boardIndex; dartIndex < 3; dartIndex++ ){appendTableCell( row, "td", getRouteDartText( route, dartIndex - boardIndex, boardIndex ) );}
		appendTableCell( row, "td", route.diff );
		tbody.appendChild( row );
	}
}
//==============================================================================
function appendTableCell( row, tagName, text ){
	let cell = document.createElement( tagName );
	if( typeof text === "number" ){text = ( Math.round( text * 100 ) / 100 ).toString();}
	cell.textContent = text;
	row.appendChild( cell );
}
//==============================================================================
function getRouteDartText( route, routeDartIndex, boardIndex ){
	if( !route.darts[routeDartIndex] ){return "DNN";}
	let dartText = route.darts[routeDartIndex].seg;
	if( boardIndex === 2 && route.type === "setup" ){return dartText + " (" + getScoreAfterSegmentDisplay( route.scoreAfter ) + ")";}
	return dartText;
}
//==============================================================================
function getScoreAfterSegmentDisplay( scoreAfter ){
	for( let segment of DFC_STATE.segments ){
		if( segment.SegMulti !== 2 ){continue;}
		if( segment.SegVal === scoreAfter ){return segment.SegId;}
	}
	return scoreAfter;
}
//==============================================================================
function renderNoFinishRoute( targetElement ){
	let div = document.createElement( "div" );
	div.className = "noFinishRoute";
	div.textContent = "No route";
	targetElement.appendChild( div );
}
//==============================================================================
function renderMessages(){
	clearElement( DFC_UI.messagePanel );
	for( let message of getMessages() ){
		let div = document.createElement( "div" );
		div.className = "messageLine";
		div.textContent = message;
		DFC_UI.messagePanel.appendChild( div );
	}
}
//==============================================================================
initDFC();