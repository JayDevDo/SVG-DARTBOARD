/*=============================================================================
targetMatrix.js
Version 1.0.6 2026-06-09 12h30
=============================================================================*/

function scrAftrEval( SA, DIH ){
	let scrInfo = DFC_STATE.scores[SA];
	if( !scrInfo ){
		return {
			EZP: { DF: profileDFMap["BUST-BUST-BUST"][0], DN: profileDFMap["BUST-BUST-BUST"][1], ALIVE: false },
			NVP: { DF: profileDFMap["BUST-BUST-BUST"][0], DN: profileDFMap["BUST-BUST-BUST"][1], ALIVE: false },
			DN: 99,
			ALIVE: false,
			DF: profileDFMap["BUST-BUST-BUST"][0]
		};
	}

	let retObj = {
		EZP: {
			DF: profileDFMap[scrInfo.EZVISITPROFILE][0],
			DN: profileDFMap[scrInfo.EZVISITPROFILE][1],
			ALIVE: profileDFMap[scrInfo.EZVISITPROFILE][1] <= DIH
		},
		NVP: {
			DF: profileDFMap[scrInfo.VISITPROFILE][0],
			DN: profileDFMap[scrInfo.VISITPROFILE][1],
			ALIVE: profileDFMap[scrInfo.VISITPROFILE][1] <= DIH
		},
		DN: scrInfo.DARTSNEEDED,
		ALIVE: scrInfo.DARTSNEEDED <= DIH
	};

	retObj.DF = retObj.EZP.ALIVE ? retObj.EZP.DF : retObj.NVP.DF;

	return retObj;
}
//==============================================================================
function defineTargetMatrix( targetSegId ){
	console.log( "defineTargetMatrix: starting" );

	if( !DFC_STATE.dataLoaded ){return null;}
	if( BULL_TARGET_MATRICES[targetSegId] ){return BULL_TARGET_MATRICES[targetSegId];}

	let targetSegment = DFC_STATE.segmentById[targetSegId];
	if( !targetSegment ){return null;}

	let targetOrder = targetSegment.DartBoardOrder.toFixed( 2 );
	let targetOrderParts = targetOrder.split( "." );

	let targetWedge = parseInt( targetOrderParts[0] );
	let targetRing = parseInt( targetOrderParts[1] );

	let prevWedge = targetWedge - 1;
	let nextWedge = targetWedge + 1;

	let outerRing = targetRing - 1;
	let innerRing = targetRing + 1;

	if( prevWedge < 1 ){prevWedge = 20;}
	if( nextWedge > 20 ){nextWedge = 1;}

	let outerRingKey = "." + outerRing.toString().padStart( 2, "0" );
	let targetRingKey = "." + targetRing.toString().padStart( 2, "0" );
	let innerRingKey = "." + innerRing.toString().padStart( 2, "0" );

	let matrix = [
		[ "DNN", "DNN", "DNN" ],
		[ "DNN", targetSegId, "DNN" ],
		[ "DNN", "DNN", "DNN" ]
	];

	for( let segment of DFC_STATE.segments ){
		let order = segment.DartBoardOrder.toFixed( 2 );

		if( order.startsWith( prevWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){matrix[0][0] = segment.SegId;}
			if( order.endsWith( targetRingKey ) ){matrix[1][0] = segment.SegId;}
			if( order.endsWith( innerRingKey ) ){matrix[2][0] = segment.SegId;}
		}

		if( order.startsWith( targetWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){matrix[0][1] = segment.SegId;}
			if( order.endsWith( innerRingKey ) ){matrix[2][1] = segment.SegId;}
		}

		if( order.startsWith( nextWedge + "." ) ){
			if( order.endsWith( outerRingKey ) ){matrix[0][2] = segment.SegId;}
			if( order.endsWith( targetRingKey ) ){matrix[1][2] = segment.SegId;}
			if( order.endsWith( innerRingKey ) ){matrix[2][2] = segment.SegId;}
		}
	}

	return matrix;
}
//==============================================================================
function getMatrixEval( matrix, SB, DIH ){
	console.log( "getMatrixEval: starting" );

	if( !DFC_STATE.dataLoaded ){return { DN: 999, DF: 999 };}
	if( !matrix ){return { DN: 999, DF: 999 };}

	let ttlDN = 0;
	let ttlDF = 0;
	let segsDone = 0;

	for( let row of matrix ){
		for( let segId of row ){
			let segment = DFC_STATE.segmentById[segId];
			if( !segment ){continue;}

			let segValue = segment.SegVal || 0;
			let SA = SB - segValue;
			let SA_Info = scrAftrEval( SA, DIH );
			let segDN = SA_Info.DN;
			let segDF = SA_Info.DF;

			if( segDN !== null && segDN !== undefined ){
				segsDone++;
				ttlDN = ttlDN + segDN;
				ttlDF = ttlDF + segDF;
			}
		}
	}

	if( segsDone === 0 ){return { DN: 999, DF: 999 };}

	return {
		DN: parseFloat(( ttlDN / segsDone ).toFixed( 2 )),
		DF: parseFloat(( ttlDF / segsDone ).toFixed( 2 ))
	};
}
//==============================================================================
function checkTargetMatrixSystem(){
	console.log( "checkTargetMatrixSystem: starting" );

	if( !DFC_STATE.dataLoaded ){console.log( "targetMatrix CHECK: data not loaded yet" ); return false;}

	let tests = [ "M20", "D20", "B20", "T20", "SBL", "DBL" ];

	for( let targetSegId of tests ){
		let matrix = defineTargetMatrix( targetSegId );
		if( !matrix ){console.error( "targetMatrix CHECK: no matrix for target:", targetSegId ); continue;}

		for( let row of matrix ){
			for( let segId of row ){
				if( !DFC_STATE.segmentById[segId] ){
					console.error( "targetMatrix CHECK: missing mapped segment:", segId, "in target:", targetSegId );
				}
			}
		}
	}

	console.log( "targetMatrix CHECK: getMatrixEval( T20, 80, 2 )", getMatrixEval( defineTargetMatrix( "T20" ), 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( T20, 80, 3 )", getMatrixEval( defineTargetMatrix( "T20" ), 80, 3 ) );
	console.log( "--" );
	console.log( "targetMatrix CHECK: getMatrixEval( B20, 80, 2 )", getMatrixEval( defineTargetMatrix( "B20" ), 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( B20, 80, 3 )", getMatrixEval( defineTargetMatrix( "B20" ), 80, 3 ) );
	console.log( "--" );
	console.log( "targetMatrix CHECK: getMatrixEval( D20, 80, 2 )", getMatrixEval( defineTargetMatrix( "D20" ), 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( D20, 80, 3 )", getMatrixEval( defineTargetMatrix( "D20" ), 80, 3 ) );

	return true;
}
//==============================================================================