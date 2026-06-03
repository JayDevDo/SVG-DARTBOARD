/*=============================================================================
	appState.js
	Version 1.0.1	2026-06-02 19h00
============================================================================= */

const SCORES_JSON_PATH = "scores.json" ;
const SEGMENTS_JSON_PATH = "jsonDartBoard102.json" ;
const DFC_DEFAULT_SCORE = 121 ;
const DFC_STATE = {
	startScore: DFC_DEFAULT_SCORE,
	scoreInput: "000",
	dartsInHand: 3,
	darts: [ null, null, null ],
	scores: [],
	segments: [],
	dataLoaded: false,
	favDbls: [
		{ seg: "D20", val: 40, favWeight: 40 },
		{ seg: "D16", val: 32, favWeight: 35 },
		{ seg: "D18", val: 36, favWeight: 25 }
	],
	favTrpls: [
		{ seg: "T20", val: 60, favWeight: 40 },
		{ seg: "T19", val: 57, favWeight: 50 },
		{ seg: "T18", val: 54, favWeight: 10 }
	],
	messages: []
} ;

//==============================================================================
async function loadJsonFile( path ){
	let response = await fetch( path ) ;
	if( !response.ok ){ throw new Error( "Could not load " + path + " status " + response.status ) ;}
	return await response.json() ;
}
//==============================================================================
async function loadDFCData(){
	let data = await Promise.all([ loadJsonFile( SCORES_JSON_PATH ), loadJsonFile( SEGMENTS_JSON_PATH ) ]) ;
	DFC_STATE.scores = data[0] ;
	DFC_STATE.segments = data[1] ;
	DFC_STATE.dataLoaded = true ;
	return DFC_STATE ;
}
//==============================================================================
function setScoreInput( value ){ DFC_STATE.scoreInput = value.toString() ; }
//==============================================================================
function getScoreInput(){ return DFC_STATE.scoreInput ; }
//==============================================================================
function resetScoreInput(){ DFC_STATE.scoreInput = "000" ; }
//==============================================================================
function addScoreInputDigit( digit ){
	let curScore = DFC_STATE.scoreInput.toString() ;
	if( curScore.length >= 3 ){ DFC_STATE.scoreInput = digit.toString() ; return ;}
	DFC_STATE.scoreInput = curScore + digit.toString() ;
}
//==============================================================================
function deleteScoreInputDigit(){
	let curScore = DFC_STATE.scoreInput.toString() ;
	if( curScore.length <= 1 ){ DFC_STATE.scoreInput = "000" ; return ;}
	DFC_STATE.scoreInput = curScore.slice( 0, -1 ) ;
}
//==============================================================================
function getParsedScoreInput(){let parsedScore = parseInt(DFC_STATE.scoreInput); if(isNaN(parsedScore)){return 0;} return parsedScore;}
//==============================================================================
function setStartScore( score ){DFC_STATE.startScore = parseInt( score ) ;resetDarts() ;}
//==============================================================================
function useScoreInputAsStartScore(){ setStartScore( getParsedScoreInput() ) ; }
//==============================================================================
function setDartsInHand( dartsInHand ){DFC_STATE.dartsInHand = parseInt( dartsInHand ) ;resetDartsFrom( DFC_STATE.dartsInHand ) ;}
//==============================================================================
function resetDarts(){ DFC_STATE.darts = [ null, null, null ] ; }
//==============================================================================
function resetDartsFrom( dartIndex ){for( let i = dartIndex ; i < 3 ; i++ ){ DFC_STATE.darts[i] = null ;}}
//==============================================================================
function setDartSegment( dartIndex, segment ){DFC_STATE.darts[dartIndex] = segment ;resetDartsFrom( dartIndex + 1 ) ;}
//==============================================================================
function getDartSegment( dartIndex ){ return DFC_STATE.darts[dartIndex] ; }
//==============================================================================
function getDartValue( dartIndex ){if( !DFC_STATE.darts[dartIndex] ){ return 0 ;}return parseInt( DFC_STATE.darts[dartIndex].SegVal ) ;}
//==============================================================================
function getDartSegmentName( dartIndex ){if( !DFC_STATE.darts[dartIndex] ){ return "DNT" ;}return DFC_STATE.darts[dartIndex].SegId ;}
//==============================================================================
function getSelectedSegmentId( dartIndex ){if( !DFC_STATE.darts[dartIndex] ){ return "" ;}return DFC_STATE.darts[dartIndex].SegId ;}
//==============================================================================
function setFavoriteDoubles( favDbls ){ DFC_STATE.favDbls = favDbls ; }
//==============================================================================
function setFavoriteTrebles( favTrpls ){ DFC_STATE.favTrpls = favTrpls ; }
//==============================================================================
function clearMessages(){ DFC_STATE.messages = [] ; }
//==============================================================================
function addMessage( message ){	DFC_STATE.messages.unshift( message ) ;	if( DFC_STATE.messages.length > 25 ){ DFC_STATE.messages.pop() ;}}
//==============================================================================
function getMessages(){ return DFC_STATE.messages ; }
//==============================================================================
function getSegmentById( segId ){for( let segment of DFC_STATE.segments ){ if( segment.SegId === segId ){ return segment ;}}return null ;}
//==============================================================================
function hasDFCData(){ return DFC_STATE.dataLoaded && DFC_STATE.scores.length > 0 && DFC_STATE.segments.length > 0 ; }
//==============================================================================
