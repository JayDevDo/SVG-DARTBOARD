/*
=============================================================================
checkoutEngine.js
Version 1.0.3 2026-06-06 17h30
============================================================================= 
*/

const NDP_COLORS = [
	"#FFAB00",	// diff = -1, worse
	"#006400",	// diff = 0, same
	"#00FF00",	// diff = 1, better
	"#FF0000"	// bust / fallback
];
const FAV_DBL_BONUS_MAX = 0.45;
const FAV_TRP_BONUS_MAX = 0.25;
const MAX_FINISH_ROUTES = 20;

const DFfromProfile = {
	"BUST":99,
	"D":3,
	"DBL":1,
	"DNN":0,
	"S":18,
	"SBL":6,
	"T":2,
	"OUT":0
};

//==============================================================================
function getSegDefaultDF( segment ){
	let segId = segment.SegId;
	if( segId === "DBL" || segId === "SBL" ){return DFfromProfile[segId];}
	let segMulti = segment.SegMulti;
	if( segMulti === 1 && segment.SegInRad === 2 ){return 12;}
	if( segMulti === 1 ){return DFfromProfile["S"];}
	if( segMulti === 2 ){return DFfromProfile["D"];}
	if( segMulti === 3 ){return DFfromProfile["T"];}
	return DFfromProfile["BUST"];
}
//==============================================================================
function getDN( score ){let scoreInfo = DFC_STATE.scores[score]; if( !scoreInfo ){return 99;} return scoreInfo.DARTSNEEDED;}
//==============================================================================
function isFinishLive( scoreBefore, dartsInHand ){return getDN( scoreBefore ) <= dartsInHand;}
//==============================================================================
function isFinishScore( score ){if( !DFC_STATE.scores[score] ){return false;} return DFC_STATE.scores[score].ISFINISH;}
//==============================================================================
function isBustScore( score ){return score < 0 || score === 1;}
//==============================================================================
function getSB_FromIdx( dartIndex ){
	let score = DFC_STATE.startScore;
	for( let i = 0; i < dartIndex; i++ ){score = score - getDartValue( i );}
	return score;
}
//==============================================================================
function getNxtDrtClr( scoreBefore, segment ){
	let scoreAfter = scoreBefore - segment.SegVal;
	if( isBustScore( scoreAfter ) ){return NDP_COLORS[3];}
	let diff = getDN( scoreBefore ) - getDN( scoreAfter );
	return NDP_COLORS[diff + 1] || NDP_COLORS[3];
}
//==============================================================================
function getScoreSegs(){
	// Only scoring segments. Excluding skinny singles ( SegInRad: 2 ) avoiding duplication and Outer Ring which has SegVal = 0.
	let retArr = [];
	for( let segment of DFC_STATE.segments ){if( segment.SegInRad !== 2 && segment.SegVal > 0 ){retArr.push( segment );}}
	return retArr;
}
//==============================================================================
function getDblSegs(){
	// Legal checkout segments. Normal doubles plus DBL.
	let retArr = [];
	for( let segment of DFC_STATE.segments ){if( segment.SegMulti === 2 ){retArr.push( segment );}}
	return retArr;
}
//==============================================================================
function getWinningDbl( score ){
	for( let segment of getDblSegs() ){if( segment.SegVal === score ){return segment;}}
	return null;
}
//==============================================================================
function getFavSegWght( segment ){
	for( let favDbl of DFC_STATE.favDbls ){if( favDbl.seg === segment.SegId ){return favDbl.favWeight;}}
	for( let favTrp of DFC_STATE.favTrpls ){if( favTrp.seg === segment.SegId ){return favTrp.favWeight;}}
	return 0;
}
//==============================================================================
function getFavSegBns( segment ){
	for( let favDbl of DFC_STATE.favDbls ){if( favDbl.seg === segment.SegId ){return favDbl.favWeight / 100 * FAV_DBL_BONUS_MAX;}}
	for( let favTrp of DFC_STATE.favTrpls ){if( favTrp.seg === segment.SegId ){return favTrp.favWeight / 100 * FAV_TRP_BONUS_MAX;}}
	return 0;
}
//==============================================================================
function getSegmentDifficulty( segment ){
	let baseDF = getSegDefaultDF( segment );
	let favBonus = getFavSegBns( segment );
	return baseDF * ( 1 + favBonus );
}
//==============================================================================
function getFinishRouteDiff( segments ){
	let diff = 1;
	for( let segment of segments ){diff = diff * getSegmentDifficulty( segment );}
	return diff;
}
//==============================================================================
function getSetupRouteDiff( segments, scoreBefore, scoreAfter ){
	if( segments.length === 1 && getDN( scoreBefore ) === 2 ){
		let finishSegment = getWinningDbl( scoreAfter );
		if( finishSegment ){return getSegmentDifficulty( segments[0] ) + getSegmentDifficulty( finishSegment );}
	}
	let diff = 1;
	for( let segment of segments ){diff = diff * getSegmentDifficulty( segment );}
	return diff;
}
//==============================================================================
function getProfileDF( profile ){
	let diff = 0;
	let parts = profile.split( "-" );
	for( let part of parts ){diff = diff + DFfromProfile[part];}
	return diff;
}
//==============================================================================
function getLeaveDifficulty( score ){
	let scoreInfo = DFC_STATE.scores[score];
	if( !scoreInfo || isBustScore( score ) ){return [ 99, "BUST" ];}
	return [ scoreInfo.DARTSNEEDED, scoreInfo.EZVISITPROFILE ];
}
//==============================================================================
function compareLeaveDifficulty( a, b ){
	if( a[0] !== b[0] ){return a[0] - b[0];}
	let profileDiffA = getProfileDF( a[1] );
	let profileDiffB = getProfileDF( b[1] );
	if( profileDiffA !== profileDiffB ){return profileDiffB - profileDiffA;}
	return a[1].localeCompare( b[1] );
}
//==============================================================================
function setupRouteImprovesScore( scoreAfter, scoreBefore ){
	let leaveBefore = getLeaveDifficulty( scoreBefore );
	let leaveAfter = getLeaveDifficulty( scoreAfter );
	return compareLeaveDifficulty( leaveAfter, leaveBefore ) < 0;
}
//==============================================================================
function compareSetupSegments( a, b ){
	let favA = getFavSegWght( a );
	let favB = getFavSegWght( b );
	if( favA !== favB ){return favB - favA;}
	let valA = a.SegVal;
	let valB = b.SegVal;
	if( valA !== valB ){return valB - valA;}
	let dfA = getSegmentDifficulty( a );
	let dfB = getSegmentDifficulty( b );
	if( dfA !== dfB ){return dfB - dfA;}
	return a.SegId.localeCompare( b.SegId );
}
//==============================================================================
function getCanonicalSetupSegments( segments ){
	let retArr = segments.slice();
	retArr.sort( compareSetupSegments );
	return retArr;
}
//==============================================================================
function makeFinishRoute( segments ){
	let darts = [];
	for( let segment of segments ){
		darts.push({ seg: segment.SegId, val: segment.SegVal, multi: segment.SegMulti, df: getSegmentDifficulty( segment ) });
	}
	return { 
		diff: getFinishRouteDiff( segments ), 
		darts: darts, 
		leaveDF: [ 0, "FINISH" ], 
		scoreAfter: 0, 
		text: routeTextFromSegments( segments ),
		type: "finish"
	};
}
//==============================================================================
function makeSetupRoute( segments, scoreBefore ){
	let darts = [];
	let scoreAfter = scoreBefore;
	for( let segment of segments ){
		darts.push({ seg: segment.SegId, val: segment.SegVal, multi: segment.SegMulti, df: getSegmentDifficulty( segment ) });
		scoreAfter = scoreAfter - segment.SegVal;
	}
	return {
		diff: getSetupRouteDiff( segments, scoreBefore, scoreAfter ),
		darts: darts,
		dnAfter: getDN( scoreAfter ),
		dnBefore: getDN( scoreBefore ),
		dnDiff: getDN( scoreBefore ) - getDN( scoreAfter ),
		leaveDF: getLeaveDifficulty( scoreAfter ),
		scoreAfter: scoreAfter,
		text: routeTextFromSegments( segments ),
		type: "setup"
	};
}
//==============================================================================
function sortFinishRoutes( routes ){
	routes.sort( ( a, b )=>{if( a.diff !== b.diff ){return b.diff - a.diff;} return a.text.localeCompare( b.text );});
}
//==============================================================================
function sortSetupRoutes( routes ){
	routes.sort(
		( a, b )=>{
			if( a.dnAfter !== b.dnAfter ){return a.dnAfter - b.dnAfter;}
			if( a.dnDiff !== b.dnDiff ){return b.dnDiff - a.dnDiff;}
			if( a.diff !== b.diff ){return b.diff - a.diff;}
			let leaveCmp = compareLeaveDifficulty( a.leaveDF, b.leaveDF );
			if( leaveCmp !== 0 ){return leaveCmp;}
			if( a.scoreAfter !== b.scoreAfter ){return a.scoreAfter - b.scoreAfter;}
			return a.text.localeCompare( b.text );
		}
	);
}
//==============================================================================
function routeText( route ){
	let parts = [];
	for( let dart of route.darts ){parts.push( dart.seg );}
	return parts.join( "-" );
}
//==============================================================================
function routeTextFromSegments( segments ){
	let parts = [];
	for( let segment of segments ){parts.push( segment.SegId );}
	return parts.join( "-" );
}
//==============================================================================
function routeKeyFromSegments( segments ){
	let parts = [];
	for( let segment of segments ){parts.push( segment.SegId );}
	return parts.join( "-" );
}
//==============================================================================
function canContinueAfterScore( score ){return score > 1;}
//==============================================================================
function getFinishRoutes( scoreBefore, dartsInHand, boardIndex ){
	if( isBustScore( scoreBefore ) ){return [];}
	if( isFinishLive( scoreBefore, dartsInHand ) ){return getLiveFinishRoutes( scoreBefore, dartsInHand );}
	return getSetupRoutes( scoreBefore, dartsInHand );
}
//==============================================================================
function getLiveFinishRoutes( scoreBefore, dartsInHand ){
	let routes = [];
	if( dartsInHand >= 1 ){routes = routes.concat( getOneDartFinishRoutes( scoreBefore ) );}
	if( dartsInHand >= 2 ){routes = routes.concat( getTwoDartFinishRoutes( scoreBefore ) );}
	if( dartsInHand >= 3 ){routes = routes.concat( getThreeDartFinishRoutes( scoreBefore ) );}
	sortFinishRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function getSetupRoutes( scoreBefore, dartsInHand ){
	let routes = [], routeKeys = {};
	if( dartsInHand >= 1 ){addOneDartSetupRoutes( routes, routeKeys, scoreBefore );}
	if( dartsInHand >= 2 ){addTwoDartSetupRoutes( routes, routeKeys, scoreBefore );}
	if( dartsInHand >= 3 ){addThreeDartSetupRoutes( routes, routeKeys, scoreBefore );}
	sortSetupRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function addOneDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getScoreSegs();
	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){continue;}
		if( !setupRouteImprovesScore( scoreAfterDart1, score ) ){continue;}
		addSetupRouteIfNew( routes, routeKeys, [ dart1 ], score );
	}
}
//==============================================================================
function addTwoDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getScoreSegs();
	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){continue;}
		for( let dart2 of setupSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){continue;}
			if( !setupRouteImprovesScore( scoreAfterDart2, score ) ){continue;}
			addSetupRouteIfNew( routes, routeKeys, [ dart1, dart2 ], score );
		}
	}
}
//==============================================================================
function addThreeDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getScoreSegs();
	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){continue;}
		for( let dart2 of setupSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){continue;}
			for( let dart3 of setupSegments ){
				let scoreAfterDart3 = scoreAfterDart2 - dart3.SegVal;
				if( !canContinueAfterScore( scoreAfterDart3 ) ){continue;}
				if( !setupRouteImprovesScore( scoreAfterDart3, score ) ){continue;}
				addSetupRouteIfNew( routes, routeKeys, [ dart1, dart2, dart3 ], score );
			}
		}
	}
}
//==============================================================================
function getOneDartFinishRoutes( score ){
	let routes = [], routeKeys = {};
	let finishDoubles = getDblSegs();
	for( let dbl of finishDoubles ){if( dbl.SegVal === score ){addRouteIfNew( routes, routeKeys, [ dbl ] );}}
	sortFinishRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function getTwoDartFinishRoutes( score ){
	let routes = [], routeKeys = {};
	let scoringSegments = getScoreSegs();
	let finishDoubles = getDblSegs();
	for( let dart1 of scoringSegments ){
		let scoreAfterDart1 = score - dart1.SegVal;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){continue;}
		for( let dart2 of finishDoubles ){
			if( dart1.SegVal + dart2.SegVal !== score ){continue;}
			addRouteIfNew( routes, routeKeys, [ dart1, dart2 ] );
		}
	}
	sortFinishRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function getThreeDartFinishRoutes( score ){
	let routes = [], routeKeys = {};
	let scoringSegments = getScoreSegs();
	let finishDoubles = getDblSegs();
	for( let dart1 of scoringSegments ){
		let scoreAfterDart1 = score - dart1.SegVal;
		if( getDN( scoreAfterDart1 ) > 2 ){continue;}
		for( let dart2 of scoringSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){continue;}
			for( let dart3 of finishDoubles ){
				if( dart1.SegVal + dart2.SegVal + dart3.SegVal !== score ){continue;}
				addRouteIfNew( routes, routeKeys, [ dart1, dart2, dart3 ] );
			}
		}
	}
	sortFinishRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================
function addRouteIfNew( routes, routeKeys, segments ){
	let routeKey = routeKeyFromSegments( segments );
	if( routeKeys[routeKey] ){return;}
	routeKeys[routeKey] = true;
	routes.push( makeFinishRoute( segments ) );
}
//==============================================================================
function addSetupRouteIfNew( routes, routeKeys, segments, scoreBefore ){
	let sortedSegments = getCanonicalSetupSegments( segments );
	let routeKey = routeKeyFromSegments( sortedSegments );
	if( routeKeys[routeKey] ){return;}
	routeKeys[routeKey] = true;
	routes.push( makeSetupRoute( sortedSegments, scoreBefore ) );
}
//==============================================================================