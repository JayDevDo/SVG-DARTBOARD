
function openNumpad(){ 	numpadDiv.className += " active"; }


function numPadInput(num){
	let sbInp = cnst_SB_Element.innerText.toString() ;
	curSB = [];
   /* console.log("sbInp bfr input:", sbInp ); */

	if(num==='d'){
		curSB = Array.from( sbInp );
		curSB.pop();
	}else{
		if( sbInp.length == 3){
			curSB.push(num);
		}else if( curSB.length < 3 ){
			curSB.push(sbInp );
			curSB.push(num.toString() );
		}else{
			curSB.push(num);
		}
	}

	/* console.log( "sb aftr input:", curSB.join("") ); */
	cnst_SB_Element.innerText = curSB.join("") ;
}


function sb(){
	let newSB = 121;
	let sbEl = cnst_SB;
	console.log("function sb:", sbEl , "const SB:", cnst_SB );
	if( (sbEl==undefined) || (sbEl==0) ){ sbEl = newSB; }

	cnst_SB_Element.innerText = sbEl ; 
	console.log("constant sb = ", cnst_SB ) ;
	sbDnr(dartNr=1) ;
	sbDnr(dartNr=2) ;
	sbDnr(dartNr=3) ;
	return sbEl;
}


function sbDnr(dartNr=1){
	if ( dartNr <= 0 ){
		dartNr=1
	}else if( dartNr > 3 ){
		dartNr=3
	}

	let newSB = sbVals[0];
	/* let sbEl = cnst_SB_Element.innerText ; */ 
	let sbEl = sbVals[dartNr-1];
	console.log("function sbDnr:", dartNr, "sbEl:", sbEl );
	if( (sbEl==undefined) || (sbEl==0) ){ sbEl = newSB; }

	for( dartNr; dartNr < 4; dartNr++ ){ document.getElementById(scrBfrSpans[dartNr]).innerText = sbEl; }
}


function getDN(score){
	let retvalDN = 0;
	if( score  && (scores.length>1) ){
		/* console.log( "getDN ", score, "scores[score]", scores[score] ); */
		return scores[score].DARTSNEEDED;
	}else{
		/* console.log("scores.length !> 1"); */
		return 9;
	}
}


function ndpClrs(dnDiff){
	switch(dnDiff){
		case -1: 
			return clrArr[2] ;
		case 0:
			return clrArr[0] ;
		case 1:
			return clrArr[1] ;
		case 2:
			return clrArr[3] ;
		default:
			return clrArr[3] ;
	}	
}


function getNDPData(){
	/* 
		console.log(
			"array stati:", 
			"scores", scores.length,
			"jsonSegArr", jsonSegArr.length,
			"sb", getDN( sb() )
		);
	*/
	d3.select(".dbMsgT").remove();
	let dbDivCntr = 0 ;
	updateScores() ;

	for( dbDivCntr = 0; dbDivCntr < dbDivs.length; dbDivCntr++ ){
		console.log("Creating dartboard ", dbDivCntr, " " , dbDivs[dbDivCntr] ) ;
		let svgWrapper = dbDivs[dbDivCntr] ;
		createDBforTarget( svgWrapper ) ;
		ndpSegArray = [] ;
		let fnsb = getSBs(dbDivCntr) ;
		let sbdn = getDN( fnsb ) ; 
		console.log("getNDPData: fnsb:", 	fnsb 	);
		console.log("getNDPData: sbdn:", 	sbdn 	);

		getNDPathToFD( finSB = fnsb , dartNr = dbDivCntr+1, dih = 3-dbDivCntr ) ;
		/* 	  */

		for( i=0; i < jsonSegArr.length; i++){

			let seg = jsonSegArr[i] ;

			if( seg.SegMulti > 0 ){

				let thisSegSA   = ( fnsb - seg.SegVal ) ; 
				let thisSegDN   = getDN( thisSegSA )  	;
				let thisDNDiff  = ( sbdn - thisSegDN )  ; 
				let arrEntry    = {} ;

				arrEntry.SegId				=  seg.SegId ;
				arrEntry.NextDartsNeeded	=  getDN( thisSegSA ) ;
				arrEntry.ScoreAfterDart		=  thisSegSA ;
				arrEntry.NewColor 			=  ndpClrs( thisDNDiff ) ;


				if( thisDNDiff == 0 ){ arrEntry.NewColor = "#006400"; }
				let thisDBSegs = d3.select('#' + svgWrapper + '_DbGrpSgmnts' ) ;
				let theSegment = thisDBSegs.select('#' + seg.SegId ) ;
				theSegment.style( "fill",  arrEntry.NewColor ) ;
				//theSegment.attr("style", "fill:"+arrEntry.NewColor+";" ) ;
				/* 
					console.log(
						"checking dartboard ", svgWrapper, 
						"segId", 				seg.SegId,
						"segVal",				seg.SegVal,
						"thisSegSA",			thisSegSA,
						"thisSegDN",			thisSegDN,
						"thisDNDiff",			thisDNDiff,
						"arrEntry:",			arrEntry
					);
					let theSegment = d3.select("#" + svgWrapper + seg.SegId ) ;
					theSegment.style( "fill",  arrEntry.NewColor ) ;				
				*/
			}
		}

	}
}


function getNDPathToFD( 
	finSB = sb(), 
	dartNr = 1, 
	dih = 3 
){

	let dn 				= getDN( finSB ) ;
	let finishesAll     = [] ;
	let finishesFDbl    = [] ;
	let finishesFTrpl   = [] ;
	let sbProfile 		= scores[finSB].VISITPROFILE.split("-") ;
	let sbProfileEZ 	= scores[finSB].EZVISITPROFILE.split("-") ;

	let pathAlive = true; 
	/* positive start ;-) */ 

	console.log(
		"getNDPathToFD finSB:", finSB, 
		"dn:", dn, "dartNr:", dartNr, "dih:", dih,
		"Profiles:", sbProfile.valueOf(), sbProfileEZ.valueOf() 
	) ;

	switch( dn ){
		/* if dn = 0 */
		case 0:
			/* no route to fav Dbls */ 
			pathAlive = false ;
			break ;

		/* if dn = 1 */
		case 1:   
			/* only 1 route to fav Dbls */ 
			pathAlive = false ; 
			if( finSB == favDbls[0].val ){
				pathAlive = true ; 
				finishesFDbl.push({ 'dart': 1, 'seg': favDbls[0].seg , 'val': favDbls[0].val } )
			}else if( finSB == favDbls[1].val ){
				pathAlive = true; 
				finishesFDbl.push({ 'dart': 1, 'seg': favDbls[1].seg , 'val': favDbls[1].val } )
			}else if( finSB == favDbls[2].val ){
				pathAlive = true; 
				finishesFDbl.push({ 'dart': 1, 'seg': favDbls[2].seg , 'val': favDbls[2].val } )
			}

			/* console.log("switch( dn 1: pathAlive ", pathAlive, finishesFDbl ); */ 
			break;

		/* if dn = 2 */
		case 2:     
			/* 2 darters all fav ds can be possible */
			let fdArrVals = [
				favDbls[0].val,
				favDbls[1].val,
				favDbls[2].val
			];

			pathAlive = false; 

				/* console.log("switch( dn 2: pathAlive ", pathAlive ); */ 
				for(fdval=0; fdval<3; fdval++){
					console.log("case 2 each fd val", fdArrVals[fdval] );
					let segExixts = lpThruVal( (finSB - fdArrVals[fdval]) ,"board") ;
						if( segExixts.status == true ){ 
							pathAlive = true ;
							/* let df = ( drt1SegId.SegMulti * 2 ); */ 
							let flOption = 
								[
									{ 'dart': 1, 'seg':segExixts.seg ,'val': segExixts.val },
									{ 'dart': 2, 'seg':favDbls[fdval].seg ,'val': favDbls[fdval].val },
									{ 'dart': 3, 'seg':"DNN" ,'val': 0 },
									{ 'diff': 0 }
								];
							finishesFDbl.push( flOption );                       
						}
				}
				/* console.log("switch( dn 2: pathAlive ", pathAlive, finishesFDbl ); */ 
			break;

		/* if dn = 3 */
		case 3:     
			/* 3 darters .. */ 
			pathAlive = false; 
			finishesFDbl = get3Darter(finSB,sbProfile,sbProfileEZ);
			console.log("resultarr len", finishesFDbl.length );
			console.log("switch( dn 3: pathAlive ", pathAlive, finishesFDbl );
			break;

		/* if dn > 3 */
		default: 	
			pathAlive = false ;
			console.log("switch( dn defauly: pathAlive ", pathAlive, finishesFDbl ) ;
			break ;
	}

	addFinishTable( finishesFDbl , dartNr)

}

function get2Darter(){
	
}


function get3Darter( finSB, sbProfile, sbProfileEZ ){
	let srchForArr      = [];
	let srchForArrEZ    = [];
	let resultArr       = [];

	for(p=0;p<sbProfile.length;p++ ){
		if( sbProfile[p] == "T" ){ srchForArr.push(3) }
		if( sbProfile[p] == "D" | sbProfile[p] == "DB"  ){ srchForArr.push(2) }
		if( sbProfile[p] == "S" | sbProfile[p] == "SB" ){ srchForArr.push(1) }    
	}

	for(p=0;p<sbProfileEZ.length;p++ ){
		if( sbProfileEZ[p] == "T" ){ srchForArrEZ.push(3) }
		if( sbProfileEZ[p] == "D" | sbProfileEZ[p] == "DB"  ){ srchForArrEZ.push(2) }
		if( sbProfileEZ[p] == "S" | sbProfileEZ[p] == "SB" ){ srchForArrEZ.push(1) }    
	}

	/* console.log("checking 3 darter ", finSB, "prf:", sbProfile, "srchForArr", srchForArr ); */  
	for( drt1=0; drt1<jsonSegArr.length; drt1++){

		let drt1SegId = jsonSegArr[drt1];
		if(  getDN( finSB - drt1SegId.SegVal ) != 2 ){  continue ; }
		/* if( drt1SegId.SegMulti=3 && drt1SegId.SegVal < 21 ){ continue  } */ 
		
		if( ( srchForArr[0] == drt1SegId.SegMulti) || (srchForArrEZ[0] == drt1SegId.SegMulti) ){

			/* dartvalue of drt1 != 0, need to check ! */ 
			for( drt2=0; drt2<jsonSegArr.length; drt2++){

				let drt2SegId = jsonSegArr[drt2];

				if( (srchForArr[1] == drt2SegId.SegMulti) || (srchForArrEZ[1] == drt2SegId.SegMulti) ){
					/* dartvalue of drt1 != 0, need to check ! */ 

					for( drt3=0; drt3<3 ;drt3++){
						let drt3SegId = favDbls[drt3];
						let isCscore  = ( ((drt1SegId.SegVal)+(drt2SegId.SegVal)+(drt3SegId.val)) == finSB )

						if(isCscore){ 
							pathAlive = true; 
							let df = ( drt1SegId.SegMulti * drt2SegId.SegMulti * 2 );

							if( drt1SegId.SegId == "DBL" ){
								df = ( ( drt1SegId.SegMulti * 1.5 ) * drt2SegId.SegMulti * 2 );
							}else if( drt2SegId.SegId == "DBL" ){
								df = ( ( drt2SegId.SegMulti * 1.5 ) * drt1SegId.SegMulti * 2 );
							}else if( drt3SegId.seg == "DBL" ){
								df = ( drt1SegId.SegMulti * drt2SegId.SegMulti * 3 );
							}
							/*
								console.log(
									"this path is a possible option for", finSB, 
									drt1SegId.SegId, 
									drt2SegId.SegId,
									drt3SegId.seg,
									"=", isCscore ,
									"df", df
								)
							*/

							if( (drt2SegId.SegVal > drt1SegId.SegVal) && (srchForArr[0] == "T") ){
								/*skip this option we'll take with the highest T first*/ 
							}else if( (drt1SegId.SegId.slice(0,1)=="S") && (drt1SegId.SegId != "SBL") ){  
								/* skip this option we'll take with the highest T first */ 
							}else if( (drt2SegId.SegId.slice(0,1)=="S") && (drt2SegId.SegId != "SBL")  ){  
								/* skip this option we'll take with the highest T first */ 
							}else{
								let flOption = [
													{ 'dart': 1, 'seg':drt1SegId.SegId ,   'val': drt1SegId.SegVal     },
													{ 'dart': 2, 'seg':drt2SegId.SegId ,   'val': drt2SegId.SegVal     },
													{ 'dart': 3, 'seg':drt3SegId.seg ,     'val': drt3SegId.val   },
													{ 'diff': df }
								];
								resultArr.push( flOption );                                     
							}
						}
					} /* End of: dart 3 loop */ 

				}else{
					/* dartvalue of drt2 == 0, no need to check. */ 
				}     
			} /* End of: dart 2 loop */ 

		}else{
			/* dartvalue of drt1 == 0, no need to check. */ 
		} /* End of: dartvalue of drt1 != 0, need to check ! */ 
	} /* End of: dart 1 loop */ 

	return resultArr;
}


function lpThruVal( val, arrName ){
	let retvalLp = { status: false, seg: "", val: 0 };
	if(arrName == "favs"){
		let fd=0;
		for(fd; fd<favDbls.length; fd++){
			/* loop thru the three fav doubles and see if a finish can be made */ 
			let fdSeg = favDbls[fd];
			
			if( fdSeg.val == val ){ 
				retvalLp.status = true;
				retvalLp.seg = fdSeg.seg ;
				retvalLp.val = fdSeg.val ;
			  /* console.log("found match !", fdSeg ) */ 
			}
			
			/* console.log("retvalLp", retvalLp) */ 
		} 
		return retvalLp ;
	}else if(arrName == "board"){
		let fd = 0 ;
		for( fd; fd < jsonSegArr.length; fd++ ){
			/* loop thru the dartboard segments and see if a finish can be made */ 
			let fdSeg =  jsonSegArr[fd];

			if( fdSeg.SegVal == val ){ 
				retvalLp.status = true;
				retvalLp.seg = fdSeg.SegId ;
				retvalLp.val = fdSeg.SegVal ;
			   /* console.log("found match !", fdSeg ) */ 
			}

				/* console.log("retvalLp", retvalLp) */
		} 
		return retvalLp ;
	}
}


function addFinishTable( finArr, dartNr ){

	let finGroup =  d3.select( "#" + finTableIds[dartNr] ) ;
	let hasTable = finGroup.selectAll('table.'+ finTableIds[dartNr] ).size() ;

	console.log("addFinishTable dartNr:", dartNr, "tableId:", finTableIds[dartNr], "finArr:", finArr, "hasTable", hasTable ) ;
	/* sorting to diff */ 
	finArr.sort( (a, b)=>{ return a[3].diff - b[3].diff; } );

    let column_names = [ "Diff", "Dart1", "Dart2", "Dart3" ];

	if( hasTable == 1 ){ 
		finGroup.select('table.'+ finTableIds[dartNr]).remove('thead') ;
		finGroup.select('table.'+ finTableIds[dartNr]).remove('tbody') ;
	}

	let table = finGroup.append("table").attr("class", finTableIds[dartNr]) ; 
    table.append("thead").append("tr");
    
    let headers = table.select("tr").selectAll("th")
		.data(column_names).enter()
			.append("th")
			.text( (d)=>{ return d; });

    table.append("tbody");
    table.select("tbody").selectAll("tr")
        .data(finArr).enter()
			.append("tr")
			.html(
				(d)=>{ 
					let finTrow = 	[ 
										"<tr>", 
											"<td>", d[3].diff, "</td>",
											"<td>", d[0].seg, "</td>",
											"<td>", d[1].seg, "</td>",
											"<td>", d[2].seg, "</td>",
										"</tr>"
					]; 
					return finTrow.join("");
				}
			);

}

/* 

    let finGroup =  d3.select("#finTable") ;
    d3.select(".finTableRes").remove();
    var table = d3.select("#finTable").append("table").attr("class", "finTableRes"); 
    table.append("thead").append("tr");
    
    var headers =   table.select("tr").selectAll("th")
                        .data(column_names)
                            .enter()
                                .append("th")
                                .text(function(d) { return d; })
                    ;

    table.append("tbody");
    table.select("tbody").selectAll("tr")
        .data(finArr)
            .enter()
                .append("tr").html(
                    (d)=>{ 
                        let finTrow =   [   "<tr>", 
                                                "<td>", d[3].diff, "</td>",
                                                "<td>", d[0].seg, "</td>",
                                                "<td>", d[1].seg, "</td>",
                                                "<td>", d[2].seg, "</td>",                            
                                            "</tr>"
                                        ]; 
                        return finTrow.join("");
                    }
                )
    ;

*/

nextDartPreview = ( segId, dih, dartNr, scrBfr )=>{

	if( scores.length ==0 | jsonSegArr.length == 0){
		return "#0000AA" ;
	}else{
		console.log(
			"nextDartPreview(",
			"--segId=",segId,
			"--dih=",dih,
			"--dartNr=",dartNr,
			"--scrBfr=",scrBfr
		) ;
		let allDoubles = segArrayMultiFilter(2);

		let ndpRetObj = {
			'Score_Bfr': 0,
			'SBIsFinish': false,
			'SegId': segId,
			'dartVal': 0,
			'DIH_Bfr': dih,
			'DN_Bfr': 0,
			'Scr_Aftr': 0,
			'IsF_Aftr': false,
			'DIH_Aftr': dih-1,
			'DN_Aftr': 0,
			'DN_Diff':0,
			'NextDbClrNr': 0,
			'Segmnt_ClrCd': "",
			'NxtDrt_ClrCd': "",
			'DrtsNdd_ClrCd': "",
			'Alive': false,
			'Winner': false
		}



	}

}