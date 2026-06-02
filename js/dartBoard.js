let CurDrtBid = "mySVGdartBoardDart1";
let JDDbRadPercArr = [ 0, 0.0500, 0.1200, 0.4900, 0.5900, 0.8100, 0.8900, 0.8907, 0.9999 ];
let JDDbTxtClr = "#FFFFFF" ;
let actDim = 0 ;

FnSegmentClick = (d,i,e)=>{
	let ClickedSegment = d ;
	let newDartVal 	= ClickedSegment.SegVal ; 
	let newDartSeg 	= ClickedSegment.SegId ; 
	let segClass	= e[i].classList[0].split("_")[0] ; 
	let dartNrArr 	= segClass.split("") ;
	let dartNr 		= dartNrArr[dartNrArr.length-1] ;
	let msg 		= [ "On dartboard #", dartNr, " You clicked on: ", newDartSeg, " which has a value of: ", newDartVal].join("") ; 
	let curMsgCount = curMsgArr.size() ;
	let msgHeight 	= ((actDim / 8) + 5) ;
	/* 
		console.log( "segClass", segClass ) ;
		console.log( "dartNrArr", dartNrArr ) ;
		console.log( "dartNr", dartNr ) ;
	*/
	mySvgMsgCntr
		.insert("div",":first-child")
			.text( msg )
			.attr("font-family", "Verdana")
			.attr("font-size", "24px")
			.attr("class", "dbMsgT")
		;

	console.log( "dartBoard.js-FnSegmentClick: newDartSeg: ", newDartSeg, "newDartVal: ", newDartVal );

	let dartValElId = "valD"+ dartNr ;
	let dartSegElId = "segD"+ dartNr ;
	let dartSBElId 	= "scrBfrDart"+ dartNr ;
	let dartSAlId 	= "scrAftrDart"+ dartNr ;
	let dartNrCls 	= " dart" + dartNr ;
	let dihBttn 	= "btnDart" + dartNr ;

	document.getElementById( dartValElId ).innerText = newDartVal ;
	document.getElementById( dartSegElId ).innerText = newDartSeg ;	
	document.getElementById( dartSAlId ).innerText = ( parseInt(document.getElementById( dartSBElId ).innerText) - newDartVal ).toString() ;
	e[i].setAttribute("style", "fill:"+dartColors[dartNr]+";" ) ;

	document.getElementById( dihBttn ).innerText = newDartSeg ;
	document.getElementById( dihBttn ).setAttribute('style', 'background-color:'+dartColors[ dartNr ]+";" ) ;
	updateScores() ;
}

/*'style', 'background-color:' + dartColors[ dartNr ] + ";" */

segIdGenerator = ( drtBrdId, segId)=>{
	/* console.log("generating id for ",drtBrdId, "and", segId ) ; */
	return (drtBrdId+segId).toString() ;
}

setPathColor = ( dartBoardId, segId, color )=>{
	let theDrtBrd 	= d3.select( "#" + dartBoardId ) ; 
	let theSegment 	= theDrtBrd.select( "#" + segId ) ; 
	console.log("setPathColor(", dartBoardId, ",", segId, ",", color,")" ) ;
	console.log("theSegment:", theSegment.size() ) ;
}


createDBforTarget = ( targetElementId = "mySVGdartBoardDart1" )=>{

	actDim = dbSize ; 
	let curDartBoardId = targetElementId ;
	let curDBsvgID = curDartBoardId + "_jdDartBoard" ;
	let curDBBackGrndClss = curDartBoardId + "_dartboardbg" ;
	let curDBCanvasClss = curDartBoardId + "_JDDbCanvas" ;
	let curDBSegmentGrpId = curDartBoardId + "_DbGrpSgmnts" ;
	let curDBSegmentGrpCls = curDartBoardId + "_JDDbSgmnt" ;
	let curDBSegTextGrpId = curDartBoardId + "_JDDbSgmntTxts" ;
	let curDBSegTextGrpCls = curDartBoardId + "_JDDbSgmntTxt" ;
	let curDBSegmentClss = curDartBoardId + "_JDDbSgmnt" ;

	console.log("dartBoard for: ", curDartBoardId, "actDim:", actDim );
	d3.select( "."+curDBCanvasClss	).remove();
	d3.select("."+curDBBackGrndClss ).remove();
	d3.select("#"+curDBSegmentGrpId ).remove();
	d3.select("."+curDBSegmentGrpCls).remove();
	d3.select("."+curDBSegTextGrpCls).remove();

	let mySvg = d3.select( "#" + curDartBoardId )
		.attr("width",  actDim )
		.attr("height", actDim )
			.append("svg")
				.attr("id",		curDBsvgID )
				.attr("class", 	curDBCanvasClss )
				.attr("dartBoardId", curDartBoardId )
				.attr("x", 		"1px" )
				.attr("y", 		"1px" )
				.attr("width", 	actDim )
				.attr("height", actDim )
				.attr("fill", 	"#000000" )
	;

	let JDDbSgmntCount 		= 0 	;
	let JDDbCrclTxtSTAngle 	= 288 	;
	let JDDbCrclTxtEndAngle = 72 	;
	let JDDbCrclStartAngle 	= 9 	;
	let JDDbCrcSgmntPerc 	= 18 	;
	let JDDbCntr 			= ( actDim * 0.5 ) ; 
	let JDDbR 				= ( actDim * 0.4995) ;	
	let JDDbMDOTxtSz 		= ((( JDDbR * (JDDbRadPercArr[8] - JDDbRadPercArr[7])) / 21) * 0.85 ) ;

	d3.select( "." + curDBCanvasClss )
		.append("rect")
			.attr("x", '0px')
			.attr("y", '0px') 
			.attr("width", (actDim))
			.attr("height", (actDim))
			.attr("dartBoardId", curDartBoardId )
			.attr("class", curDBBackGrndClss )
			.attr("fill", "#000000")
	;

	let JDDbSgmntGrp = d3.select( "." + curDBCanvasClss )
		.append("g")
			.attr("id", curDBSegmentGrpId )
			.attr("class", curDBSegmentGrpCls )
			.attr("dartBoardId", curDartBoardId )
			.attr("stroke-width", 0)
			.attr("stroke", "#C0C0C0")
			.attr("transform", "translate(" + JDDbCntr + "," + JDDbCntr + ")")
	;

	let JDDbSgmntTxtGrp = d3.select( "." + curDBCanvasClss )
		.append("g")
			.style("font-family", "helvetica")
			.style("font-size", JDDbMDOTxtSz + "em")
			.attr("id", curDBSegTextGrpId )
			.attr("dartBoardId", curDartBoardId )
			.attr("class", 	curDBSegTextGrpCls )
			.attr("stroke", "#FFFFFF")
			.attr("stroke-width", 2)
			.attr("style", 	"stroke:#000000;")
			.attr("style", 	"fill:#99CCFF;")
			.attr("text-anchor", "middle" )
			.attr("transform", "translate(" + JDDbCntr + "," + JDDbCntr + ")")
	;

	let JDDbSgmntArc = d3.arc()
		.innerRadius( (data)=>{ return ( JDDbR * JDDbRadPercArr[ data.SegInRad ]);})
		.outerRadius( (data)=>{ return ( (JDDbR * 0.995) * JDDbRadPercArr[ data.SegOutRad ]);})
		.startAngle(  (data)=>{ return ( data.SegSA * (Math.PI/180)); }) 
		.endAngle(	  (data)=>{ return ( data.SegEA * (Math.PI/180)); }) 
	;

	JDDbSgmntGrp.selectAll("path")
		.data(jsonSegArr).enter().append("path") /* starting the json data loop here jdMNSegArr */ 
			.attr("d", JDDbSgmntArc)
			.attr("id",         (data)=>{ return data.SegId;})
			.attr("DartBoardId", curDartBoardId )
			.attr("SegId",      (data)=>{ return data.SegId;})
			.attr("SegVal",     (data)=>{ return data.SegVal;})
			.attr("SegGrp",     (data)=>{ return data.SegGrp;})
			.attr("SegMulti",   (data)=>{ return data.SegMulti;})
			.attr("style",      (data)=>{ return "fill:" + data.SegColor + ";";} ) 
			.attr("SegColor",   (data)=>{ return data.SegColor;})
			.attr("jdcolored", 'false') 
			.attr("class", 		curDBSegmentClss )
			.on('click', 		FnSegmentClick )
	; 

	JDDbSgmntTxtGrp.selectAll("text")
		.data(jsonSegArr).enter().append("text")
			.filter( ( data )=>{ return data.SegMulti < 1; } )
			.attr("id",	( data )=>{ return data.SegId;} )
			.attr("DartBoardId", curDartBoardId )
			.attr("SegId", ( data )=>{ return data.SegId;} )
			.attr( "dx", 1 )
			.attr( "dy", 5 )
			.attr( "SegVal", '0' 	)
			.attr( "SegGrp", '0' 	)
			.attr( "SegMulti", '0' 	)
			.attr( "class", curDBSegmentClss )
			.text( ( data )=>{ return parseInt( data.SegGrp, 10 ); } )
			.attr( "transform", 
				( data )=>{ 
					data.innerRadius = ( JDDbR * data.SegInRad  );
					data.outerRadius = ( JDDbR * data.SegOutRad );
					return "translate(" + JDDbSgmntArc.centroid(data) +") rotate(" + 1 + ")";
				}
			)
			.on( "click", FnSegmentClick )
	;
}