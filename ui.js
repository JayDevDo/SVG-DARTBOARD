/*=============================================================================
	ui.js
	Version 1.0.3
	2026-06-04
============================================================================= */

const DFC_UI = {
	boardsBuilt: false,
	btnResetBoards: null,
	btnScoreOk: null,
	dihButtons: [],
	favDblEls: [],
	favDblHeader: null,
	favDblOpen: false,
	favDblSliderCell: null,
	favDblSliderRow: null,
	favTrpEls: [],
	favTrpHeader: null,
	favTrpOpen: false,
	favTrpSliderCell: null,
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

	DFC_UI.favDblHeader = DFC_UI.favDblEls[0].parentElement.previousElementSibling.children[0];
	DFC_UI.favTrpHeader = DFC_UI.favTrpEls[0].parentElement.previousElementSibling.children[0];
	DFC_UI.favDblHeader.style.cursor = "pointer";
	DFC_UI.favTrpHeader.style.cursor = "pointer";

	DFC_UI.favDblSliderRow = createFavoriteSliderRow( DFC_UI.favDblEls[0].parentElement );
	DFC_UI.favTrpSliderRow = createFavoriteSliderRow( DFC_UI.favTrpEls[0].parentElement );
	DFC_UI.favDblSliderCell = DFC_UI.favDblSliderRow.children[0];
	DFC_UI.favTrpSliderCell = DFC_UI.favTrpSliderRow.children[0];
}

//==============================================================================
function createFavoriteSliderRow( afterRow ){
	let row = document.createElement( "tr" );
	let cell = document.createElement( "td" );

	row.className = "isHidden";
	cell.colSpan = 3;
	cell.style.padding = "6px";

	row.appendChild( cell );
	afterRow.after( row );

	return row;
}

//==============================================================================
function bindUiEvents(){
	for( let button of DFC_UI.numPadButtons ){button.addEventListener( "click", ()=>{handleNumPadInput( button.dataset.numpadValue );});}
	for( let button of DFC_UI.dihButtons ){button.addEventListener( "click", ()=>{handleDihButtonClick( button );});}

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
function handleNumPadInput( value ){if( value === "delete" ){deleteScoreInputDigit();}else{addScoreInputDigit( value );} renderScoreInput();}

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
		DFC_UI.favDblEls[i].textContent = favDblEntries[i].fav.seg + " " + formatFavWeight( favDblEntries[i].fav.favWeight );
		DFC_UI.favTrpEls[i].textContent = favTrpEntries[i].fav.seg + " " + formatFavWeight( favTrpEntries[i].fav.favWeight );
	}
}

//==============================================================================
function renderFavoriteSliderPanels(){
	DFC_UI.favDblHeader.textContent = DFC_UI.favDblOpen ? "Fav Double ▾" : "Fav Double ▸";
	DFC_UI.favTrpHeader.textContent = DFC_UI.favTrpOpen ? "Fav Treble ▾" : "Fav Treble ▸";

	renderFavoriteSliderPanel( "DBL", DFC_UI.favDblSliderRow, DFC_UI.favDblSliderCell, DFC_UI.favDblOpen );
	renderFavoriteSliderPanel( "TRP", DFC_UI.favTrpSliderRow, DFC_UI.favTrpSliderCell, DFC_UI.favTrpOpen );
}

//==============================================================================
function renderFavoriteSliderPanel( favType, row, cell, isOpen ){
	clearElement( cell );
	if( !isOpen ){row.classList.add( "isHidden" ); return;}

	row.classList.remove( "isHidden" );
	for( let entry of getFavEntriesSortedByWeight( favType ) ){cell.appendChild( createFavoriteSliderLine( favType, entry ) );}
}

//==============================================================================
function createFavoriteSliderLine( favType, entry ){
	let line = document.createElement( "div" );
	let label = document.createElement( "span" );
	let minus = document.createElement( "button" );
	let slider = document.createElement( "input" );
	let plus = document.createElement( "button" );
	let value = document.createElement( "span" );
	let parity = entry.fav.favWeight % 2;

	line.className = "favSliderLine";
	label.textContent = entry.fav.seg;
	label.style.fontWeight = "bold";

	minus.type = "button";
	minus.className = "favStepButton";
	minus.textContent = "−";
	minus.dataset.favType = favType;
	minus.dataset.favIndex = entry.favIndex;
	minus.dataset.favDelta = "-2";
	minus.addEventListener( "click", handleFavoriteStepButtonClick );

	slider.type = "range";
	slider.min = parity.toString();
	slider.max = parity === 0 ? "100" : "99";
	slider.step = "2";
	slider.value = entry.fav.favWeight;
	slider.dataset.favType = favType;
	slider.dataset.favIndex = entry.favIndex;
	paintFavoriteSlider( slider, entry.fav.favWeight );
	slider.addEventListener( "input", handleFavoriteSliderInput );
	slider.addEventListener( "change", handleFavoriteSliderChange );

	plus.type = "button";
	plus.className = "favStepButton";
	plus.textContent = "+";
	plus.dataset.favType = favType;
	plus.dataset.favIndex = entry.favIndex;
	plus.dataset.favDelta = "2";
	plus.addEventListener( "click", handleFavoriteStepButtonClick );

	value.className = "favWeightValue";
	value.dataset.favValue = "true";
	value.dataset.favType = favType;
	value.dataset.favIndex = entry.favIndex;
	value.textContent = formatFavWeight( entry.fav.favWeight );
	value.title = "Click to set weight";
	value.addEventListener( "click", handleFavoriteValueClick );

	line.appendChild( label );
	line.appendChild( minus );
	line.appendChild( slider );
	line.appendChild( plus );
	line.appendChild( value );

	return line;
}

//==============================================================================
function paintFavoriteSlider( slider, favWeight ){slider.style.setProperty( "--fav-level", favWeight + "%" );}

//==============================================================================
function renderFavoriteSliderValues( favType ){
	let favList = getFavList( favType );
	let cell = favType === "DBL" ? DFC_UI.favDblSliderCell : DFC_UI.favTrpSliderCell;
	let sliders = cell.querySelectorAll( "input[data-fav-type='" + favType + "']" );

	for( let slider of sliders ){
		let fav = favList[parseInt( slider.dataset.favIndex )];
		let value = slider.parentElement.querySelector( "[data-fav-value]" );
		let parity = fav.favWeight % 2;

		slider.min = parity.toString();
		slider.max = parity === 0 ? "100" : "99";
		slider.value = fav.favWeight;
		paintFavoriteSlider( slider, fav.favWeight );
		if( value ){value.textContent = formatFavWeight( fav.favWeight );}
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
		let scoreBefore = getScoreBeforeDart( dartIndex );
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
function renderFinishTablesFrom( startBoardIndex = 0 ){for( let boardIndex = startBoardIndex; boardIndex < 3; boardIndex++ ){renderFinishTable( boardIndex );}}

//==============================================================================
function renderFinishTable( boardIndex ){
	let targetElement = DFC_UI.finishTableEls[boardIndex];
	let scoreBefore = getScoreBeforeDart( boardIndex );
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

//==============================================================================