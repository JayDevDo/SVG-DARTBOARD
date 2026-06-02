/*

1: get all possibilities.
2: remove doubles.
3: rank results by:
	-- favDbls
	-- favTrpls
	-- sameSeg,
	-- totalTargetSurface
*/


let radii = [
	0.0001,
	0.1250,
	0.2500,
	0.6000,
	0.6700,
	0.9000,
	0.9900,
	0.9907,
	0.9999
];

segSurface = (segRadiusIndex)=>{
	/*
		A = (θ/360°) × π r2 .
			Where: 	θ 	is always 18 (360/20) => parseFloat(18/360) = 0.05
			And 	r 	is radii[SegOutRad]
			And 	π 	will be calculated as parseFloat( 22 / 7 )

		parseFloat(250 * radii[ segRadiusIndex ]) * parseFloat()
	*/
	let absRad 	= parseFloat( 250 * radii[ segRadiusIndex ] ) ;
	let segSurf = parseFloat( parseFloat(18/360) * parseFloat( parseFloat(22/7) * ( absRad * absRad ) ) ) ;

	console.log("segSurface|",
		"--segRadiusIndex: ", 	segRadiusIndex,
		"--segRadius: ", 		radii[segRadiusIndex],
		"--absRad: ", 			absRad,
		"--segSurf: ",			segSurf
	) ;
	return segSurf ;
}



console.log("test segSurface DBL: ", parseInt( segSurface(1) - segSurface(0) ) );
console.log("test segSurface SBL: ", parseInt( segSurface(2) - segSurface(1) ) );
console.log("test segSurface S00: ", parseInt( segSurface(3) - segSurface(2) ) );
console.log("test segSurface T00: ", parseInt( segSurface(4) - segSurface(3) ) );
console.log("test segSurface B00: ", parseInt( segSurface(5) - segSurface(4) ) );
console.log("test segSurface D00: ", parseInt( segSurface(6) - segSurface(5) ) );
console.log("test segSurface M00: ", parseInt( segSurface(8) - segSurface(6) ) );


const segRadAbs = (segInRad)=>{
	// the segOutRad is always the next in radii array
	// surface is calculated by subtracting the area of the smallest ( inner ) segment from the area of the largest (outer) segment
	// Using this function for calculating an area:

	switch( segInRad ){

		case 0:
			// DBL (SegIn 0, SegOut 1)
			break;

		case 1:
			// SBL (SegIn 1, SegOut 2)
			break;

		case 2:
			// small segment  (SegIn 2, SegOut 3 )
			break;

		case 3:
			// Treble segment (SegIn 3, SegOut 4 )
			break;

		case 4:
			// Big segment (SegIn 4, SegOut 5 )
			break;

		case 5:
			// Double segment (SegIn 5, SegOut 6 )
			break;

		case 7:
			// Missed (SegIn 7, SegOut 8 )
			break;

		default:
			break;
	}
}


let allFins = [];

/*
	if( !scores ){
		console.log("allFinishes.js scores doesn't exist" );
	}else{

		if( scores.length > 1 ){
			console.log("allFinishes.js scores exists + loaded", scores.length );
		}else{
			scoresJsonPath.then(
				( data )=>{
					scores = data;
					console.log("allFinishes.js scores existed but then not loaded", scores.length );
				}
			).then(
				()=>{
					console.log("choose to start finish view = off");
					getNDPData();
				}
			);
		}
	}


	if( !jsonSegArr ){
		console.log("allFinishes.js jsonSegArr doesn't exist" );
	}else{
		if( jsonSegArr.length > 1 ){
			console.log("allFinishes.js jsonSegArr exists + loaded", jsonSegArr.length ) ;
		}else{
			jdata.then(
				(data)=>{
					jsonSegArr = data ;
					console.log("allFinishes.js jsonSegArr existed but then not loaded, now =", jsonSegArr.length );
				}
			);
		}
	}
*/


loopThreeDarts = (trgtScr)=>{

	let dart1Arr = [] ;
	let dart2Arr = [] ;
	let dart3Arr = [] ;

	let allDoublesArr 	= [] ;
	let retFinTable 	= [] ;

	console.log("loopThreeDarts: trgtScr: ", trgtScr ) ;
	console.log("loopThreeDarts: len(scores): ", scores.length ) ;
	console.log("loopThreeDarts: len(jsonSegArr): ", jsonSegArr.length ) ;

	if( jsonSegArr.length > 0 ){

		dart1Arr = jsonSegArr ;
		dart2Arr = jsonSegArr ;
		allDoublesArr = segArrayMultiFilter( 2 ) ;
	}


	for( lc1 = 0; lc1 < dart1Arr.length; lc1++){
		let d1 = dart1Arr[lc1] ;

		let d1surface = 1 + 1 ;

		for( lc2 = 0; lc2 < dart2Arr.length; lc2++){

			let d2 = dart2Arr[lc2] ;

			for( lc3 = 0; lc3 < allDoublesArr.length; lc3++){

				let d3 = allDoublesArr[lc3] ;

				if(	(d1.SegVal + d2.SegVal + d3.SegVal) == trgtScr ){

					console.log( d1.SegId, " + ", d2.SegId," + ", d3.SegId, " is a match for ", trgtScr ) ;
					retFinTable.push(
						{
							"score":trgtScr,
							"d1": 	d1,
							"d2": 	d2,
							"d3": 	d3,
							"DF": 	0,
						}
					)
				}

			} // End of loop 3
		} // End of loop 2
	} // End of loop 1


	// setPathColor( "mySVGdartBoardDart1", "B20", "#00FF00" );
}


rateResultsTable = (finTable)=>{
	console.log("rateResultsTable: finTable: ", finTable.length ) ;

}