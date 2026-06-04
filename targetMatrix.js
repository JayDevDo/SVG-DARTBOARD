/*=============================================================================
	targetMatrix.js
	Version 1.0.0
	2026-06-03
============================================================================= */

const BULL_TARGET_MATRICES = {
	DBL: [
		[ "SBL", "SBL", "SBL" ],
		[ "SBL", "DBL", "SBL" ],
		[ "SBL", "SBL", "SBL" ]
	],
	SBL: [
		[ "S01", "S01", "S01" ],
		[ "S01", "SBL", "S01" ],
		[ "DBL", "DBL", "DBL" ]
	]
} ;

//==============================================================================
function defineTargetMatrix( targetSegId ){
	if( BULL_TARGET_MATRICES[targetSegId] ){ return BULL_TARGET_MATRICES[targetSegId] ;}

	let targetSegment = DFC_STATE.segments[targetSegId] ;
	let targetOrder = targetSegment.DartBoardOrder.toString() ;
	let targetOrderParts = targetOrder.split( "." ) ;
	let targetWedge = parseInt( targetOrderParts[0] ) ;
	let targetRing = parseInt( targetOrderParts[1] ) ;

	let prevWedge = targetWedge - 1 ;
	let nextWedge = targetWedge + 1 ;
	let outerRing = targetRing - 1 ;
	let innerRing = targetRing + 1 ;

	if( prevWedge < 1 ){ prevWedge = 20 ;}
	if( nextWedge > 20 ){ nextWedge = 1 ;}

	let outerRingKey = "." + outerRing.toString().padStart( 2, "0" ) ;
	let targetRingKey = "." + targetRing.toString().padStart( 2, "0" ) ;
	let innerRingKey = "." + innerRing.toString().padStart( 2, "0" ) ;

	let matrix = [
		[ null, null, null ],
		[ null, targetSegId, null ],
		[ null, null, null ]
	] ;

	for( let segment of DFC_STATE.segments ){
		let order = segment.DartBoardOrder.toString() ;

		if( order.startsWith( prevWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){ matrix[0][0] = segment.SegId ;}
			if( order.endsWith( targetRingKey ) ){ matrix[1][0] = segment.SegId ;}
			if( order.endsWith( innerRingKey ) ){ matrix[2][0] = segment.SegId ;}
		}

		if( order.startsWith( targetWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){ matrix[0][1] = segment.SegId ;}
			if( order.endsWith( innerRingKey ) ){ matrix[2][1] = segment.SegId ;}
		}

		if( order.startsWith( nextWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){ matrix[0][2] = segment.SegId ;}
			if( order.endsWith( targetRingKey ) ){ matrix[1][2] = segment.SegId ;}
			if( order.endsWith( innerRingKey ) ){ matrix[2][2] = segment.SegId ;}
		}
	}

	return matrix ;
}

//==============================================================================
function collectMatrixScoreProfiles( matrix, scoreBefore ){
	let retArr = [] ;

	for( let row of matrix ){
		let retRow = [] ;

		for( let segId of row ){
			let segVal = DFC_STATE.segments[segId].SegVal ;
			let scoreAfter = scoreBefore - segVal ;
			let scoreInfo = DFC_STATE.scores[scoreAfter] ;

			retRow.push({
				segId: segId,
				segVal: segVal,
				scoreAfter: scoreAfter,
				dartsNeeded: scoreInfo ? scoreInfo.DARTSNEEDED : 99,
				ezProfile: scoreInfo ? scoreInfo.EZVISITPROFILE : "NO-SCORE-ROW"
			}) ;
		}

		retArr.push( retRow ) ;
	}

	return retArr ;
}

//==============================================================================