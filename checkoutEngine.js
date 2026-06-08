/*
=============================================================================
checkoutEngine.js
Version 1.0.5 2026-06-08 16h30
============================================================================= 
*/

const NDP_COLORS = [
	"#FFAB00",	// diff = -1, worse
	"#006400",	// diff = 0, same
	"#00FF00",	// diff = 1, better
	"#FF0000"	// bust / fallback
];

const MAX_FINISH_ROUTES = 20;
const LEAVE_DN_MULTIPLIER = 100;
const FAV_DBL_BONUS_MAX = 0.45;
const FAV_TRP_BONUS_MAX = 0.25;

//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX		THESE STAY TOGETHER UP TOP  		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
const DFfromProfile = {
	"BUST": 99,
	"OUT": 0,
	"DNN": 0,
	"S": 1,
	"SBL": 3,
	"D": 6,
	"T": 12,
	"DBL": 36
};
//==============================================================================
function getSegmentDifficulty( segment ){
	let baseDF = DFfromProfile["BUST"];
	if( segment.SegId === "DBL" || segment.SegId === "SBL" ){baseDF = DFfromProfile[segment.SegId];}
	else if( segment.SegMulti === 1 && segment.SegInRad === 2 ){baseDF = 2.5;} // no point in returning the same as the next line    
	else if( segment.SegMulti === 1 ){baseDF = DFfromProfile["S"];}
	else if( segment.SegMulti === 2 ){baseDF = DFfromProfile["D"];}
	else if( segment.SegMulti === 3 ){baseDF = DFfromProfile["T"];}
	for( let favDbl of DFC_STATE.favDbls ){
		// bonus + : if( favDbl.seg === segment.SegId ){return baseDF * ( 1 + ( favDbl.favWeight / 100 * FAV_DBL_BONUS_MAX ) );}
		// bonus - : 
		if( favDbl.seg === segment.SegId ){return baseDF * ( 1 - ( favDbl.favWeight / 100 * FAV_DBL_BONUS_MAX ) );}
	}
	for( let favTrp of DFC_STATE.favTrpls ){
		// bonus + : if( favTrp.seg === segment.SegId ){return baseDF * ( 1 + ( favTrp.favWeight / 100 * FAV_TRP_BONUS_MAX ) );}
		// bonus - : 
		if( favTrp.seg === segment.SegId ){return baseDF * ( 1 - ( favTrp.favWeight / 100 * FAV_TRP_BONUS_MAX ) );}
	}
	return baseDF;
}
//==============================================================================
function sortRoutes( routes ){
	routes.sort(
		( a, b )=>{
			// asc: 
			if( a.diff !== b.diff ){return a.diff - b.diff;}
			// desc: if( a.diff !== b.diff ){return b.diff - a.diff;}
			return 0;
		}
	);
}
//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX		THESE STAY TOGETHER UP TOP  		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

//==============================================================================
function getDN( score ){
	let scoreInfo = DFC_STATE.scores[score];
	if( !scoreInfo ){return 99;}
	return scoreInfo.DARTSNEEDED;
}
//==============================================================================
function isBustScore( score ){return score < 0 || score === 1;}
//==============================================================================
function getNxtDrtClr( scoreBefore, segment ){
	let scoreAfter = scoreBefore - segment.SegVal;
	if( isBustScore( scoreAfter ) || ( scoreAfter === 0 && segment.SegMulti !== 2 ) ){return NDP_COLORS[3];}
	let diff = getDN( scoreBefore ) - getDN( scoreAfter );
	return NDP_COLORS[diff + 1] || NDP_COLORS[3];
}
//==============================================================================
function getProfileDF( profile ){
	let diff = 0;
	let parts = profile.split( "-" );
	for( let part of parts ){diff = diff + DFfromProfile[part];}
	return diff;
}
//==============================================================================
function makeRoute( segment, scoreBefore, scoreAfter ){
	let scoreInfo = DFC_STATE.scores[scoreAfter];
	let leaveProfile = scoreInfo.EZVISITPROFILE;
	let segmentDF = getSegmentDifficulty( segment );
	let diff = segmentDF + ( scoreInfo.DARTSNEEDED * LEAVE_DN_MULTIPLIER ) + getProfileDF( leaveProfile );

	return {
		diff: diff,
		darts: [
			{
				seg: segment.SegId,
				val: segment.SegVal,
				multi: segment.SegMulti,
				df: segmentDF
			}
		],
		dnAfter: getDN( scoreAfter ),
		dnBefore: getDN( scoreBefore ),
		dnDiff: getDN( scoreBefore ) - getDN( scoreAfter ),
		leaveDF: [ getDN( scoreAfter ), leaveProfile ],
		scoreAfter: scoreAfter,
		type: scoreAfter === 0 ? "finish" : "setup"
	};
}
//==============================================================================
function getRoutes( scoreBefore, dih ){
	let routes = [];
	let routeKeys = {};
	let dnBefore = getDN( scoreBefore );

	if( isBustScore( scoreBefore ) || dih <= 0 ){return routes;}

	for( let segment of DFC_STATE.segments ){
		let scoreAfter = scoreBefore - segment.SegVal;
		if( segment.SegVal <= 0 ){continue;}
		if( isBustScore( scoreAfter ) || ( scoreAfter === 0 && segment.SegMulti !== 2 ) ){continue;}
		if( getDN( scoreAfter ) !== dnBefore - 1 ){continue;}

		let routeKey = segment.SegId + "-" + scoreAfter;
		if( routeKeys[routeKey] ){continue;}

		routeKeys[routeKey] = true;
		routes.push( makeRoute( segment, scoreBefore, scoreAfter ) );
	}

	sortRoutes( routes );
	return routes.slice( 0, MAX_FINISH_ROUTES );
}
//==============================================================================