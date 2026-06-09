/*
=============================================================================
checkoutEngine.js
Version 1.0.5 2026-06-08 16h30
=============================================================================
*/

//==============================================================================
function sortRoutes( routes ){
	routes.sort(
		( a, b )=>{
			if( a.diff !== b.diff ){return a.diff - b.diff;}
			return 0;
		}
	);
}
//==============================================================================
function getDN( score ){
	let scoreInfo = DFC_STATE.scores[score];
	if( !scoreInfo ){return 99;}
	return scoreInfo.DARTSNEEDED;
}
//==============================================================================
function isBustScore( score ){return score < 0 || score === 1; }
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
	let scoreInfo = DFC_STATE.scores[scoreAfter];isBustScore
	let leaveProfile = scoreInfo.EZVISITPROFILE;
	let segmentDF = segment.SegDF;
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
	console.log( "getRoutes: starting" );
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