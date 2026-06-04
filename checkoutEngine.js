/*=============================================================================
	checkoutEngine.js
	Version 1.0.2
	2026-06-04
============================================================================= */

const NDP_COLORS = [
	"#FFAB00",	// diff = -1, worse
	"#006400",	// diff = 0, same
	"#00FF00",	// diff = 1, better
	"#FF0000"	// bust / fallback
] ;

const FAV_DBL_BONUS_MAX = 0.25 ;
const FAV_TRP_BONUS_MAX = 0.25 ;
const MAX_FINISH_ROUTES = 60 ;

//==============================================================================
function getScoreRow( score ){
	let scoreInt = parseInt( score ) ;
	return DFC_STATE.scores[scoreInt] || null ;
}

//==============================================================================
function getDartsNeeded( score ){
	let scoreInt = parseInt( score ) ;
	if( scoreInt < 0 || scoreInt === 1 ){ return 99 ;}

	let scoreInfo = DFC_STATE.scores[scoreInt] ;
	if( !scoreInfo ){ return 9 ;}

	return scoreInfo.DARTSNEEDED ;
}

//==============================================================================
function isFinishLive( scoreBefore, dartsInHand ){ return getDartsNeeded( scoreBefore ) <= dartsInHand ; }

//==============================================================================
function isFinishScore( score ){
	let scoreInfo = DFC_STATE.scores[score] ;
	if( !scoreInfo ){ return false ;}

	return scoreInfo.ISFINISH === true ;
}

//==============================================================================
function isBustScore( score ){ return score < 0 || score === 1 ; }

//==============================================================================
function isSmallSegment( segment ){ return segment.SegInRad === 2 ; }

//==============================================================================
function getScoreBeforeDart( dartIndex ){
	let score = DFC_STATE.startScore ;

	for( let i = 0 ; i < dartIndex ; i++ ){ score = score - getDartValue( i ) ;}

	return score ;
}

//==============================================================================
function getSegmentAdviceColor( scoreBefore, segment ){
	let scoreAfter = scoreBefore - segment.SegVal ;
	if( isBustScore( scoreAfter ) ){ return NDP_COLORS[3] ;}

	let diff = getDartsNeeded( scoreBefore ) - getDartsNeeded( scoreAfter ) ;
	return NDP_COLORS[diff + 1] || NDP_COLORS[3] ;
}

//==============================================================================
function getScoringSegments(){
	let retArr = [] ;

	for( let segment of DFC_STATE.segments ){
		if( isSmallSegment( segment ) ){ continue ;}
		if( segment.SegMulti > 0 && segment.SegVal > 0 ){ retArr.push( segment ) ;}
	}

	return retArr ;
}

//==============================================================================
function getSetupSegments(){
	let retArr = [] ;

	for( let segment of DFC_STATE.segments ){
		if( isSmallSegment( segment ) ){ continue ;}
		if( segment.SegMulti === 2 && segment.SegId !== "DBL" ){ continue ;}
		if( segment.SegMulti > 0 && segment.SegVal > 0 ){ retArr.push( segment ) ;}
	}

	return retArr ;
}

//==============================================================================
function getFinishDoubleSegments(){
	let retArr = [] ;

	for( let segment of DFC_STATE.segments ){
		if( segment.SegId === "DBL" ){ retArr.push( segment ) ; continue ;}
		if( segment.SegMulti === 2 && segment.SegVal > 0 ){ retArr.push( segment ) ;}
	}

	return retArr ;
}

//==============================================================================
function getSegmentBaseDifficulty( segment ){
	let segId = segment.SegId ;
	let segMulti = segment.SegMulti ;

	if( segId === "DBL" ){ return 20 ;}
	if( segId === "SBL" ){ return 3.5 ;}
	if( segMulti === 1 && segment.SegInRad === 2 ){ return 1.5 ;}
	if( segMulti === 1 ){ return 1 ;}
	if( segMulti === 2 ){ return 5.5 ;}
	if( segMulti === 3 ){ return 9 ;}

	return 99 ;
}

//==============================================================================
function getSegmentFavWeight( segment ){
	for( let favDbl of DFC_STATE.favDbls ){
		if( favDbl.seg === segment.SegId ){ return favDbl.favWeight ;}
	}

	for( let favTrp of DFC_STATE.favTrpls ){
		if( favTrp.seg === segment.SegId ){ return favTrp.favWeight ;}
	}

	return 0 ;
}

//==============================================================================
function getSegmentFavBonus( segment ){
	for( let favDbl of DFC_STATE.favDbls ){
		if( favDbl.seg === segment.SegId ){ return favDbl.favWeight / 100 * FAV_DBL_BONUS_MAX ;}
	}

	for( let favTrp of DFC_STATE.favTrpls ){
		if( favTrp.seg === segment.SegId ){ return favTrp.favWeight / 100 * FAV_TRP_BONUS_MAX ;}
	}

	return 0 ;
}

//==============================================================================
function getSegmentDifficulty( segment ){
	let baseDF = getSegmentBaseDifficulty( segment ) ;
	let favBonus = getSegmentFavBonus( segment ) ;

	return baseDF * ( 1 - favBonus ) ;
}

//==============================================================================
function getRouteDiff( segments ){
	let diff = 1 ;

	for( let segment of segments ){ diff = diff * getSegmentDifficulty( segment ) ;}

	return diff ;
}

//==============================================================================
function normalizeVisitProfile( profile ){
	if( !profile ){ return "NO-PROFILE" ;}

	let parts = profile.split( "-" ) ;
	let retArr = [] ;

	for( let part of parts ){
		if( part === "SB" ){ retArr.push( "SBL" ) ;}
		else if( part === "DB" ){ retArr.push( "DBL" ) ;}
		else{ retArr.push( part ) ;}
	}

	return retArr.join( "-" ) ;
}

//==============================================================================
function getProfileTokenDifficulty( token ){
	if( token === "DNN" ){ return 0 ;}
	if( token === "S" ){ return 1 ;}
	if( token === "SBL" ){ return 3 ;}
	if( token === "D" ){ return 5 ;}
	if( token === "DBL" ){ return 9 ;}
	if( token === "T" ){ return 12 ;}

	return 99 ;
}

//==============================================================================
function getProfileDifficulty( profile ){
	let diff = 0 ;
	let parts = normalizeVisitProfile( profile ).split( "-" ) ;

	for( let part of parts ){ diff = diff + getProfileTokenDifficulty( part ) ;}

	return diff ;
}

//==============================================================================
function getLeaveDifficulty( score ){
	let scoreInfo = DFC_STATE.scores[score] ;
	if( !scoreInfo || isBustScore( score ) ){ return [ 99, "BUST" ] ;}

	return [
		scoreInfo.DARTSNEEDED,
		normalizeVisitProfile( scoreInfo.EZVISITPROFILE || scoreInfo.VISITPROFILE )
	] ;
}
//==============================================================================
function compareLeaveDifficulty( a, b ){
	if( a[0] !== b[0] ){ return a[0] - b[0] ;}

	let profileDiffA = getProfileDifficulty( a[1] ) ;
	let profileDiffB = getProfileDifficulty( b[1] ) ;

	if( profileDiffA !== profileDiffB ){ return profileDiffA - profileDiffB ;}

	return a[1].localeCompare( b[1] ) ;
}

//==============================================================================
function setupRouteImprovesScore( scoreAfter, scoreBefore ){
	let leaveBefore = getLeaveDifficulty( scoreBefore ) ;
	let leaveAfter = getLeaveDifficulty( scoreAfter ) ;

	return compareLeaveDifficulty( leaveAfter, leaveBefore ) < 0 ;
}

//==============================================================================
function compareSetupSegments( a, b ){
	let favA = getSegmentFavWeight( a ) ;
	let favB = getSegmentFavWeight( b ) ;
	let valA = a.SegVal ;
	let valB = b.SegVal ;
	let dfA = getSegmentDifficulty( a ) ;
	let dfB = getSegmentDifficulty( b ) ;

	if( favA !== favB ){ return favB - favA ;}
	if( valA !== valB ){ return valB - valA ;}
	if( dfA !== dfB ){ return dfA - dfB ;}

	return a.SegId.localeCompare( b.SegId ) ;
}

//==============================================================================
function getCanonicalSetupSegments( segments ){
	let retArr = segments.slice() ;
	retArr.sort( compareSetupSegments ) ;

	return retArr ;
}

//==============================================================================
function makeRouteDart( segment ){
	return {
		seg: segment.SegId,
		val: segment.SegVal,
		multi: segment.SegMulti,
		df: getSegmentDifficulty( segment )
	} ;
}

//==============================================================================
function makeFinishRoute( segments ){
	let darts = [] ;

	for( let segment of segments ){ darts.push( makeRouteDart( segment ) ) ;}

	return {
		diff: getRouteDiff( segments ),
		darts: darts,
		leaveDF: [ 0, "FINISH" ],
		scoreAfter: 0,
		text: routeTextFromSegments( segments ),
		type: "finish"
	} ;
}

//==============================================================================
function makeSetupRoute( segments, scoreBefore ){
	let darts = [] ;
	let scoreAfter = scoreBefore ;

	for( let segment of segments ){
		darts.push( makeRouteDart( segment ) ) ;
		scoreAfter = scoreAfter - segment.SegVal ;
	}

	return {
		diff: getRouteDiff( segments ),
		darts: darts,
		dnAfter: getDartsNeeded( scoreAfter ),
		dnBefore: getDartsNeeded( scoreBefore ),
		dnDiff: getDartsNeeded( scoreBefore ) - getDartsNeeded( scoreAfter ),
		leaveDF: getLeaveDifficulty( scoreAfter ),
		scoreAfter: scoreAfter,
		text: routeTextFromSegments( segments ),
		type: "setup"
	} ;
}

//==============================================================================
function sortFinishRoutes( routes ){
	routes.sort(
		(a, b)=>{
			if( a.diff !== b.diff ){ return a.diff - b.diff ;}
			return a.text.localeCompare( b.text ) ;
		}
	) ;
}

//==============================================================================
function sortSetupRoutes( routes ){
	routes.sort(
		(a, b)=>{
			if( a.dnAfter !== b.dnAfter ){ return a.dnAfter - b.dnAfter ;}
			if( a.dnDiff !== b.dnDiff ){ return b.dnDiff - a.dnDiff ;}

			let leaveCmp = compareLeaveDifficulty( a.leaveDF, b.leaveDF ) ;
			if( leaveCmp !== 0 ){ return leaveCmp ;}

			if( a.diff !== b.diff ){ return a.diff - b.diff ;}
			if( a.scoreAfter !== b.scoreAfter ){ return a.scoreAfter - b.scoreAfter ;}

			return a.text.localeCompare( b.text ) ;
		}
	) ;
}

//==============================================================================
function routeText( route ){
	let parts = [] ;

	for( let dart of route.darts ){ parts.push( dart.seg ) ;}

	return parts.join( "-" ) ;
}

//==============================================================================
function routeTextFromSegments( segments ){
	let parts = [] ;

	for( let segment of segments ){ parts.push( segment.SegId ) ;}

	return parts.join( "-" ) ;
}

//==============================================================================
function routeKeyFromSegments( segments ){
	let parts = [] ;

	for( let segment of segments ){ parts.push( segment.SegId ) ;}

	return parts.join( "-" ) ;
}

//==============================================================================
function canContinueAfterScore( score ){ return score > 1 ; }

//==============================================================================
function getFinishRoutes( scoreBefore, dartsInHand, boardIndex ){
	if( isBustScore( scoreBefore ) ){ return [] ;}
	if( isFinishLive( scoreBefore, dartsInHand ) ){ return getLiveFinishRoutes( scoreBefore, dartsInHand ) ;}

	return getSetupRoutes( scoreBefore, dartsInHand ) ;
}

//==============================================================================
function getLiveFinishRoutes( scoreBefore, dartsInHand ){
	let routes = [] ;

	if( dartsInHand >= 1 ){ routes = routes.concat( getOneDartFinishRoutes( scoreBefore ) ) ;}
	if( dartsInHand >= 2 ){ routes = routes.concat( getTwoDartFinishRoutes( scoreBefore ) ) ;}
	if( dartsInHand >= 3 ){ routes = routes.concat( getThreeDartFinishRoutes( scoreBefore ) ) ;}

	sortFinishRoutes( routes ) ;

	return routes.slice( 0, MAX_FINISH_ROUTES ) ;
}

//==============================================================================
function getSetupRoutes( scoreBefore, dartsInHand ){
	let routes = [] ;
	let routeKeys = {} ;

	if( dartsInHand >= 1 ){ addOneDartSetupRoutes( routes, routeKeys, scoreBefore ) ;}
	if( dartsInHand >= 2 ){ addTwoDartSetupRoutes( routes, routeKeys, scoreBefore ) ;}
	if( dartsInHand >= 3 ){ addThreeDartSetupRoutes( routes, routeKeys, scoreBefore ) ;}

	sortSetupRoutes( routes ) ;

	return routes.slice( 0, MAX_FINISH_ROUTES ) ;
}

//==============================================================================
function addOneDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getSetupSegments() ;

	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal ;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){ continue ;}
		if( !setupRouteImprovesScore( scoreAfterDart1, score ) ){ continue ;}

		addSetupRouteIfNew( routes, routeKeys, [ dart1 ], score ) ;
	}
}

//==============================================================================
function addTwoDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getSetupSegments() ;

	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal ;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){ continue ;}

		for( let dart2 of setupSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal ;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){ continue ;}
			if( !setupRouteImprovesScore( scoreAfterDart2, score ) ){ continue ;}

			addSetupRouteIfNew( routes, routeKeys, [ dart1, dart2 ], score ) ;
		}
	}
}

//==============================================================================
function addThreeDartSetupRoutes( routes, routeKeys, score ){
	let setupSegments = getSetupSegments() ;

	for( let dart1 of setupSegments ){
		let scoreAfterDart1 = score - dart1.SegVal ;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){ continue ;}

		for( let dart2 of setupSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal ;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){ continue ;}

			for( let dart3 of setupSegments ){
				let scoreAfterDart3 = scoreAfterDart2 - dart3.SegVal ;
				if( !canContinueAfterScore( scoreAfterDart3 ) ){ continue ;}
				if( !setupRouteImprovesScore( scoreAfterDart3, score ) ){ continue ;}

				addSetupRouteIfNew( routes, routeKeys, [ dart1, dart2, dart3 ], score ) ;
			}
		}
	}
}

//==============================================================================
function getOneDartFinishRoutes( score ){
	let routes = [] ;
	let routeKeys = {} ;
	let finishDoubles = getFinishDoubleSegments() ;

	for( let dbl of finishDoubles ){
		if( dbl.SegVal === score ){ addRouteIfNew( routes, routeKeys, [ dbl ] ) ;}
	}

	sortFinishRoutes( routes ) ;

	return routes.slice( 0, MAX_FINISH_ROUTES ) ;
}

//==============================================================================
function getTwoDartFinishRoutes( score ){
	let routes = [] ;
	let routeKeys = {} ;
	let scoringSegments = getScoringSegments() ;
	let finishDoubles = getFinishDoubleSegments() ;

	for( let dart1 of scoringSegments ){
		let scoreAfterDart1 = score - dart1.SegVal ;
		if( !canContinueAfterScore( scoreAfterDart1 ) ){ continue ;}

		for( let dart2 of finishDoubles ){
			if( dart1.SegVal + dart2.SegVal !== score ){ continue ;}
			addRouteIfNew( routes, routeKeys, [ dart1, dart2 ] ) ;
		}
	}

	sortFinishRoutes( routes ) ;

	return routes.slice( 0, MAX_FINISH_ROUTES ) ;
}

//==============================================================================
function getThreeDartFinishRoutes( score ){
	let routes = [] ;
	let routeKeys = {} ;
	let scoringSegments = getScoringSegments() ;
	let finishDoubles = getFinishDoubleSegments() ;

	for( let dart1 of scoringSegments ){
		let scoreAfterDart1 = score - dart1.SegVal ;
		if( getDartsNeeded( scoreAfterDart1 ) > 2 ){ continue ;}

		for( let dart2 of scoringSegments ){
			let scoreAfterDart2 = scoreAfterDart1 - dart2.SegVal ;
			if( !canContinueAfterScore( scoreAfterDart2 ) ){ continue ;}

			for( let dart3 of finishDoubles ){
				if( dart1.SegVal + dart2.SegVal + dart3.SegVal !== score ){ continue ;}
				addRouteIfNew( routes, routeKeys, [ dart1, dart2, dart3 ] ) ;
			}
		}
	}

	sortFinishRoutes( routes ) ;

	return routes.slice( 0, MAX_FINISH_ROUTES ) ;
}

//==============================================================================
function addRouteIfNew( routes, routeKeys, segments ){
	let routeKey = routeKeyFromSegments( segments ) ;
	if( routeKeys[routeKey] ){ return ;}

	routeKeys[routeKey] = true ;
	routes.push( makeFinishRoute( segments ) ) ;
}

//==============================================================================
function addSetupRouteIfNew( routes, routeKeys, segments, scoreBefore ){
	let sortedSegments = getCanonicalSetupSegments( segments ) ;
	let routeKey = routeKeyFromSegments( sortedSegments ) ;
	if( routeKeys[routeKey] ){ return ;}

	routeKeys[routeKey] = true ;
	routes.push( makeSetupRoute( sortedSegments, scoreBefore ) ) ;
}

//==============================================================================