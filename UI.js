/*
=============================================================================
UI.js
Version 1.0.7 2026-06-13 16h00
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
	let scoreBeforeInfo = DFC_STATE.scores[SB];
	if( !scoreBeforeInfo ){return rows;}
	let SBDN = scoreBeforeInfo.DARTSNEEDED;

	for( let segment of DFC_STATE.segments ){
		if( segment.SegMulti <= 0 || segment.SegInRad === 2 ){continue;}
		if( SBDN === 3 && segment.SegMulti === 2 ){continue;}

		let SA = SB - segment.SegVal;
		let scoreAfterInfo = DFC_STATE.scores[SA];
		let SADN = scoreAfterInfo ? scoreAfterInfo.DARTSNEEDED : 99;
		if( SADN >= SBDN ){continue;}

		let firstMatrix = defineTargetMatrix( segment.SegId );
		if( !firstMatrix ){continue;}
		let firstMatrixEval = getMatrixEval( firstMatrix, SB, dih );
		if( !firstMatrixEval || firstMatrixEval.DF >= 999 ){continue;}

		let finishSegment = null;
		let secondMatrixEval = null;

		if( SBDN === 2 ){
			// if( dih < 2 || SADN !== 1 ){continue;}

			for( let routeSegment of DFC_STATE.segments ){
				if( routeSegment.SegVal === SA && routeSegment.SegMulti === 2 ){finishSegment = routeSegment; break;}
			}

			if( !finishSegment ){continue;}
			let secondMatrix = defineTargetMatrix( finishSegment.SegId );
			if( !secondMatrix ){continue;}
			secondMatrixEval = getMatrixEval( secondMatrix, SA, dih - 1 );
			if( !secondMatrixEval || secondMatrixEval.DF >= 999 ){continue;}
		}
		const d3DF = finishSegment ? finishSegment.SegDF : 99;
		const ttlDF = segment.SegDF + d3DF;
		const d3OO = secondMatrixEval ? secondMatrixEval.OO : 0;

		rows.push({
			route: segment.SegId,
			SADN: SADN,
			firstSeg: segment.SegId,
			firstSegDF: segment.SegDF,
			firstMtrxDN: firstMatrixEval.DN,
			firstMtrxDF: firstMatrixEval.DF,
			firstMtrxOO: firstMatrixEval.OO,
			secondSeg: finishSegment ? finishSegment.SegId : "",
			secondSegDF: d3DF,
			secondMtrxDF: secondMatrixEval ? secondMatrixEval.DF : 99,
			secondMtrxOO: d3OO,
			ttlDF: ttlDF
		});
	}

	rows.sort( ( a, b )=>{
		if( SBDN === 2 && a.ttlDF !== b.ttlDF ){ return a.ttlDF - b.ttlDF; }
		if( a.SADN !== b.SADN ){return a.SADN - b.SADN;}
		if( a.firstSegDF !== b.firstSegDF ){return a.firstSegDF - b.firstSegDF;}
		if( a.firstMtrxDF !== b.firstMtrxDF ){return a.firstMtrxDF - b.firstMtrxDF;}
		if( a.secondSegDF !== null && b.secondSegDF !== null && a.secondSegDF !== b.secondSegDF ){return a.secondSegDF - b.secondSegDF;}
		if( a.secondMtrxDF !== null && b.secondMtrxDF !== null && a.secondMtrxDF !== b.secondMtrxDF ){return a.secondMtrxDF - b.secondMtrxDF;}
		return a.route.localeCompare( b.route );
	});

	return rows.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function renderFinishTable( dartNr ){
	console.log( "renderFinishTable: starting" );
	let dartBrdIdx = dartNr - 1;
	let targetElement = DFC_UI.finishTableEls[dartBrdIdx];
	let SB = getCurrentScore();
	let dih = 3 - DFC_STATE.darts.length;
	let scoreBeforeInfo = DFC_STATE.scores[SB];
	let rows = getTargetMatrixRows( SB, dih );

	clearElement( targetElement );
	if( rows.length === 0 ){renderNoFinishRoute( targetElement ); return;}

	let table = document.createElement( "table" );
	let thead = document.createElement( "thead" );
	let tbody = document.createElement( "tbody" );
	let SBDN = scoreBeforeInfo ? scoreBeforeInfo.DARTSNEEDED : 99;

	renderFinishTableHeader( thead, SBDN );
	renderFinishTableBody( tbody, rows, SBDN );

	table.appendChild( thead );
	table.appendChild( tbody );
	targetElement.appendChild( table );
}
//==============================================================================
function renderFinishTableHeader( thead, SBDN ){
	let row = document.createElement( "tr" );
	if( SBDN === 2 ){
		appendTableCell( row, "th", "D1" );
		appendTableCell( row, "th", "D1 DF" );
		appendTableCell( row, "th", "D2" );
		appendTableCell( row, "th", "D2 DF" );
		appendTableCell( row, "th", "Ttl DF" );
	}else{
		appendTableCell( row, "th", "Dart" );
		appendTableCell( row, "th", "DN" );
		appendTableCell( row, "th", "DN mtrx" );
		appendTableCell( row, "th", "DF" );
		appendTableCell( row, "th", "DF mtrx" );
		appendTableCell( row, "th", "OO mtrx" );
	}
	thead.appendChild( row );
}
//==============================================================================
function renderFinishTableBody( tbody, rows, SBDN ){
	for( let targetRow of rows ){
		let row = document.createElement( "tr" );
		if( SBDN === 2 ){
			appendTableCell( row, "td", targetRow.firstSeg );
			appendTableCell( row, "td", targetRow.firstSegDF );
			appendTableCell( row, "td", targetRow.secondSeg );
			appendTableCell( row, "td", targetRow.secondSegDF );
			appendTableCell( row, "td", targetRow.ttlDF );
		}else{
			appendTableCell( row, "td", targetRow.firstSeg );
			appendTableCell( row, "td", targetRow.SADN );
			appendTableCell( row, "td", targetRow.firstMtrxDN );
			appendTableCell( row, "td", targetRow.firstSegDF );
			appendTableCell( row, "td", targetRow.firstMtrxDF );
			appendTableCell( row, "td", targetRow.firstMtrxOO );
		}
		tbody.appendChild( row );
	}
}
//==============================================================================
function appendTableCell( row, tagName, text ){
	let cell = document.createElement( tagName );
	// if( typeof text === "number" ){text = ( Math.round( text * 100 ) / 100 ).toString();}
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
//==============================================================================
