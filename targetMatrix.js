/*=============================================================================
targetMatrix.js
Version 1.1.0 2026-06-25 14h00
=============================================================================*/

const MATRIX_CENTER_AXIS_SAME_DN_REWARD = 10; // %

//==============================================================================
function scrAftrEval( SA, DIH ){
	let scrInfo = DFC_STATE.scores[SA];
	if( !scrInfo ){
		return {
			EZP: { DF: profileDFMap["BUST-BUST-BUST"][0], DN: profileDFMap["BUST-BUST-BUST"][1], ALIVE: false },
			NVP: { DF: profileDFMap["BUST-BUST-BUST"][0], DN: profileDFMap["BUST-BUST-BUST"][1], ALIVE: false },
			DN: 99,
			ALIVE: false,
			DF: profileDFMap["BUST-BUST-BUST"][0],
			OO: 0
		};
	}
	/*
	console.log(
		"scrAftrEval | SA: ", SA, "DIH: ", DIH,
		"scrInfo-EZ: ", scrInfo.EZVISITPROFILE,
		"scrInfo-N: ", scrInfo.VISITPROFILE,
		"scrInfo-OO: ", scrInfo.OUTOPTIONS
	);
	*/
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
		ALIVE: scrInfo.DARTSNEEDED <= DIH,
		OO: scrInfo.OUTOPTIONS
	};

	retObj.DF = retObj.EZP.ALIVE ? retObj.EZP.DF : retObj.NVP.DF;
	return retObj;
}
//==============================================================================
function getMatrixEval( matrix, SB, DIH ){
	console.log( "getMatrixEval: starting" );

	if( !DFC_STATE.dataLoaded || !matrix ){return { DN: 999, DF: 999, OO: 0 };}

	let ttlDN = 0;
	let ttlDF = 0;
	let ttlOO = 0;
	let segsDone = 0;
	let resMtrx = [];

	for( let rwIdx = 0; rwIdx < matrix.length; rwIdx++ ){
		resMtrx[rwIdx] = [];

		for( let colIdx = 0; colIdx < matrix[rwIdx].length; colIdx++ ){
			let segId = matrix[rwIdx][colIdx];
			let segment = DFC_STATE.segmentById[segId];
			resMtrx[rwIdx][colIdx] = [ 99, 99 ];
			if( !segment ){continue;}

			let segValue = segment.SegVal || 0;
			let SA = SB - segValue;
			let SA_Info = scrAftrEval( SA, DIH );
			let segDN = SA_Info.DN;
			let segDF = SA_Info.DF;
			let segOO = SA_Info.OO;

			if( segDN !== null && segDN !== undefined ){
				segsDone++;
				ttlDN = ttlDN + segDN;
				ttlDF = ttlDF + segDF;
				ttlOO = ttlOO + segOO;
			}

			resMtrx[rwIdx][colIdx] = [ segDN, segDF ];
		}
	}

	if( segsDone === 0 ){return { DN: 999, DF: 999, OO: 0 };}

	let avgDN = ttlDN / segsDone;
	let avgDF = ttlDF / segsDone;
	let avgOO = ttlOO / segsDone;

	if( resMtrx[0][1][0] < 99 && resMtrx[0][1][0] === resMtrx[1][1][0] && resMtrx[1][1][0] === resMtrx[2][1][0] ){
		avgDF = avgDF * ( ( 100 - MATRIX_CENTER_AXIS_SAME_DN_REWARD ) / 100 );
	}

	return {
		DN: parseFloat(( avgDN ).toFixed( 2 )),
		DF: parseFloat(( Math.max( 0, avgDF ) ).toFixed( 2 )),
		OO: parseFloat(( avgOO ).toFixed( 2 ))
	};
}
//==============================================================================
function checkTargetMatrixSystem(){
	console.log( "checkTargetMatrixSystem: starting" );

	if( !DFC_STATE.dataLoaded ){console.log( "targetMatrix CHECK: data not loaded yet" ); return false;}

	let tests = [ "M20", "D20", "B20", "T20", "SBL", "DBL" ];

	for( let targetSegId of tests ){
		let segment = DFC_STATE.segmentById[targetSegId];
		if( !segment ){console.error( "targetMatrix CHECK: missing target segment:", targetSegId ); continue;}

		let matrix = segment.SegTargetMatrix;
		if( !matrix ){console.error( "targetMatrix CHECK: no cached matrix for target:", targetSegId ); continue;}

		for( let row of matrix ){
			for( let segId of row ){
				if( !DFC_STATE.segmentById[segId] ){
					console.error( "targetMatrix CHECK: missing mapped segment:", segId, "in target:", targetSegId );
				}
			}
		}
	}

	console.log( "targetMatrix CHECK: getMatrixEval( T20, 80, 2 )", getMatrixEval( DFC_STATE.segmentById["T20"].SegTargetMatrix, 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( T20, 80, 3 )", getMatrixEval( DFC_STATE.segmentById["T20"].SegTargetMatrix, 80, 3 ) );
	console.log( "--" );
	console.log( "targetMatrix CHECK: getMatrixEval( B20, 80, 2 )", getMatrixEval( DFC_STATE.segmentById["B20"].SegTargetMatrix, 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( B20, 80, 3 )", getMatrixEval( DFC_STATE.segmentById["B20"].SegTargetMatrix, 80, 3 ) );
	console.log( "--" );
	console.log( "targetMatrix CHECK: getMatrixEval( D20, 80, 2 )", getMatrixEval( DFC_STATE.segmentById["D20"].SegTargetMatrix, 80, 2 ) );
	console.log( "targetMatrix CHECK: getMatrixEval( D20, 80, 3 )", getMatrixEval( DFC_STATE.segmentById["D20"].SegTargetMatrix, 80, 3 ) );

	return true;
}
//==============================================================================