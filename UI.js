/*
=============================================================================
UI.js
Version 1.0.6b 2026-06-10 22h00
=============================================================================
*/

const TARGET_TABLE_MAX_ROWS = 62;

const DFC_UI = {
	boardsBuilt: false,
	btnResetBoards: null,
	btnScoreOk: null,
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
	DFC_UI.finishTableEls = [ gid( "finishTableDart1" ), gid( "finishTableDart2" ), gid( "finishTableDart3" ) ];
	DFC_UI.messagePanel = gid( "messagePanel" );
	DFC_UI.numPadButtons = qsa( "[data-numpad-value]" );
	DFC_UI.scoreAfterEls = [ gid( "scoreAfterDart1" ), gid( "scoreAfterDart2" ), gid( "scoreAfterDart3" ) ];
	DFC_UI.scoreBeforeEls = [ gid( "scoreBeforeDart1" ), gid( "scoreBeforeDart2" ), gid( "scoreBeforeDart3" ) ];
	DFC_UI.scoreDisplay = gid( "scoreDisplay" );
	DFC_UI.scoreFinal = gid( "scoreFinal" );
	DFC_UI.segmentEls = [ gid( "segmentDart1" ), gid( "segmentDart2" ), gid( "segmentDart3" ) ];
	DFC_UI.valueEls = [ gid( "valueDart1" ), gid( "valueDart2" ), gid( "valueDart3" ) ];
	cacheFavoriteUiElements();
}
//==============================================================================
function bindUiEvents(){
	for( let button of DFC_UI.numPadButtons ){button.addEventListener( "click", ()=>{handleNumPadInput( button.dataset.numpadValue );});}
	DFC_UI.btnScoreOk.addEventListener( "click", handleScoreOkClick );
	DFC_UI.btnResetBoards.addEventListener( "click", handleResetBoardsClick );
	bindFavoriteUiEvents();
}
//==============================================================================
async function initDFC(){
	console.log( "initDFC: starting" );
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
	if( value === "delete" ){deleteScoreInputDigit();}
	else{addScoreInputDigit( value );}
	renderScoreInput();
}
//==============================================================================
function handleScoreOkClick(){
	if( !hasDFCData() ){addMessage( "Data is not loaded yet." ); renderMessages(); return;}
	clearMessages();
	setStartScore( getParsedScoreInput() );
	clearDartBoardsAndTables();
	DFC_UI.boardsBuilt = true;
	addMessage( "Score set to " + DFC_STATE.startScore + "." );
	renderFullUi();
}
//==============================================================================
function handleResetBoardsClick(){
	resetDarts();
	clearDartBoardsAndTables();
	addMessage( "Dartboards reset." );
	renderFullUi();
}
//==============================================================================
function onDartBoardSegmentClick( pathId, segmentData ){
	let boardIndex = 3 - segmentData.DIH;
	if( !DFC_UI.boardsBuilt ){return;}
	if( boardIndex !== DFC_STATE.darts.length ){return;}
	if( !setDartSegment( boardIndex, segmentData ) ){return;}
	setSelectedDartSegmentColor( pathId );
	addMessage( "Dart " + ( boardIndex + 1 ) + ": " + segmentData.SegId + " hit for " + segmentData.SegVal + "." );
	renderFullUi();
}
//==============================================================================
function renderFullUi(){
	renderScoreInput();
	renderFavoriteLists();
	renderFavoriteSliderPanels();
	renderScorePanels();
	if( DFC_UI.boardsBuilt ){renderActiveDartBoardAndTable();}
	renderMessages();
}
//==============================================================================
function renderScoreInput(){DFC_UI.scoreDisplay.textContent = getScoreInput();}
//==============================================================================
function renderScorePanels(){
	for( let dartIndex = 0; dartIndex < 3; dartIndex++ ){
		let SB = getSB_FromIdx( dartIndex );
		let dartValue = getDartValue( dartIndex );
		let scoreAfter = SB - dartValue;
		DFC_UI.scoreBeforeEls[dartIndex].textContent = SB;
		DFC_UI.segmentEls[dartIndex].textContent = getDartSegmentName( dartIndex );
		DFC_UI.valueEls[dartIndex].textContent = dartValue;
		DFC_UI.scoreAfterEls[dartIndex].textContent = getDartSegment( dartIndex ) ? scoreAfter : "";
	}
	DFC_UI.scoreFinal.textContent = getDisplayFinalScore();
}
//==============================================================================
function getDisplayFinalScore(){return getCurrentScore();}
//==============================================================================
function clearDartBoardsAndTables(){
	for( let i = 1; i <= 3; i++ ){
		clearElement( gid( "dartBoard" + i ) );
		clearElement( DFC_UI.finishTableEls[i - 1] );
	}
}
//==============================================================================
function renderActiveDartBoardAndTable(){
	let dartNr = DFC_STATE.darts.length + 1;
	let dartBrdIdx = dartNr - 1;
	if( !DFC_UI.boardsBuilt || dartNr > 3 ){return;}

	renderDartBoard({
		targetId: "dartBoard" + dartNr,
		boardIndex: dartBrdIdx,
		scoreBefore: getCurrentScore(),
		segments: DFC_STATE.segments
	});

	renderFinishTable( dartNr );
}
//==============================================================================
function getTargetMatrixRows( SB, dih ){
	console.log( "getTargetMatrixRows: starting" );
	let rows = [];
	const SBDN = DFC_STATE.scores[SB].DARTSNEEDED;

	for( let segment of DFC_STATE.segments ){
		if( segment.SegMulti <= 0 || segment.SegInRad === 2 ){continue;}
		if( SBDN === 3 && segment.SegMulti === 2 ){continue;}

		let SA = SB - segment.SegVal;
		let SADN = DFC_STATE.scores[SA] ? DFC_STATE.scores[SA].DARTSNEEDED : 99;
		if( SADN >= SBDN ){continue;}
		let matrix = defineTargetMatrix( segment.SegId );
		if( !matrix ){continue;}

		let targetEval = getMatrixEval( matrix, SB, dih );
		if( !targetEval || targetEval.DF >= 999 ){continue;}

		rows.push({
			seg: segment.SegId,
			SADN: SADN,
			segDF: segment.SegDF,
			mtrxDN: targetEval.DN,
			mtrxOO: targetEval.OO,
			mtrxDF: targetEval.DF
		});
	}

	rows.sort( ( a, b )=>{
		if( a.SADN !== b.SADN ){return a.SADN - b.SADN;}
		if( a.segDF !== b.segDF ){return a.segDF - b.segDF;}
		if( a.mtrxDN !== b.mtrxDN ){return a.mtrxDN - b.mtrxDN;}
		if( a.mtrxDF !== b.mtrxDF ){return a.mtrxDF - b.mtrxDF;}
		return b.seg.localeCompare( a.seg );
	});

	return rows.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function renderFinishTable( dartNr ){
	let dartBrdIdx = dartNr - 1;
	let targetElement = DFC_UI.finishTableEls[dartBrdIdx];
	let SB = getCurrentScore();
	let dih = 3 - DFC_STATE.darts.length;
	let rows = getTargetMatrixRows( SB, dih );

	clearElement( targetElement );
	if( rows.length === 0 ){renderNoFinishRoute( targetElement ); return;}

	let table = document.createElement( "table" );
	let thead = document.createElement( "thead" );
	let tbody = document.createElement( "tbody" );

	renderFinishTableHeader( thead );
	renderFinishTableBody( tbody, rows );

	table.appendChild( thead );
	table.appendChild( tbody );
	targetElement.appendChild( table );
}
//==============================================================================
function renderFinishTableHeader( thead ){
	let row = document.createElement( "tr" );
	appendTableCell( row, "th", "Segment" );
	appendTableCell( row, "th", "DN" );
	appendTableCell( row, "th", "DN mtrx" );
	appendTableCell( row, "th", "DF" );
	appendTableCell( row, "th", "DF mtrx" );
	appendTableCell( row, "th", "OO mtrx" );
	thead.appendChild( row );
}
//==============================================================================
function renderFinishTableBody( tbody, rows ){
	for( let targetRow of rows ){
		let row = document.createElement( "tr" );
		appendTableCell( row, "td", targetRow.seg );
		appendTableCell( row, "td", targetRow.SADN );
		appendTableCell( row, "td", targetRow.mtrxDN );
		appendTableCell( row, "td", targetRow.segDF );
		appendTableCell( row, "td", targetRow.mtrxDF );
		appendTableCell( row, "td", targetRow.mtrxOO );
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
function renderNoFinishRoute( targetElement ){
	let div = document.createElement( "div" );
	div.className = "noFinishRoute";
	div.textContent = "No target rows";
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