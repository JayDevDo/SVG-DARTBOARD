/*
=============================================================================
svgDartBoard.js
Version 1.1.0 2026-06-25 14h00
=============================================================================
*/

const SVG_NS = "http://www.w3.org/2000/svg";
const BOARD_RADII = [ 0, 0.0500, 0.1200, 0.4900, 0.5900, 0.8100, 0.8900, 0.8907, 0.9999 ];
const BOARD_TEXT_COLOR = "#99CCFF";
const BOARD_TEXT_STROKE = "#000000";
const SELECTED_SEGMENT_COLOR = "#99CCFF";

//==============================================================================
function degToRad( deg ){return ( deg - 90 ) * Math.PI / 180;}
//==============================================================================
function polarToCartesian( cx, cy, radius, angleDeg ){
	let angleRad = degToRad( angleDeg );
	return { x: cx + ( radius * Math.cos( angleRad ) ), y: cy + ( radius * Math.sin( angleRad ) ) };
}
//==============================================================================
function annularSectorPath( cx, cy, innerRadius, outerRadius, startAngle, endAngle ){
	let angleSize = Math.abs( endAngle - startAngle );

	if( angleSize >= 359.99 ){
		if( innerRadius <= 0 ){
			return [
				"M", cx, cy - outerRadius,
				"A", outerRadius, outerRadius, 0, 1, 1, cx, cy + outerRadius,
				"A", outerRadius, outerRadius, 0, 1, 1, cx, cy - outerRadius,
				"Z"
			].join( " " );
		}

		return [
			"M", cx, cy - outerRadius,
			"A", outerRadius, outerRadius, 0, 1, 1, cx, cy + outerRadius,
			"A", outerRadius, outerRadius, 0, 1, 1, cx, cy - outerRadius,
			"Z",
			"M", cx, cy - innerRadius,
			"A", innerRadius, innerRadius, 0, 1, 0, cx, cy + innerRadius,
			"A", innerRadius, innerRadius, 0, 1, 0, cx, cy - innerRadius,
			"Z"
		].join( " " );
	}

	let outerStart = polarToCartesian( cx, cy, outerRadius, startAngle );
	let outerEnd = polarToCartesian( cx, cy, outerRadius, endAngle );
	let innerStart = polarToCartesian( cx, cy, innerRadius, endAngle );
	let innerEnd = polarToCartesian( cx, cy, innerRadius, startAngle );
	let largeArcFlag = ( endAngle - startAngle ) > 180 ? 1 : 0;

	return [
		"M", outerStart.x, outerStart.y,
		"A", outerRadius, outerRadius, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y,
		"L", innerStart.x, innerStart.y,
		"A", innerRadius, innerRadius, 0, largeArcFlag, 0, innerEnd.x, innerEnd.y,
		"Z"
	].join( " " );
}
//==============================================================================
function segmentCenterPoint( cx, cy, radius, startAngle, endAngle ){
	let midAngle = startAngle + (( endAngle - startAngle ) / 2 );
	return polarToCartesian( cx, cy, radius, midAngle );
}
//==============================================================================
function clearElement( element ){while( element.firstChild ){element.removeChild( element.firstChild );}}
//==============================================================================
function createSvgElement( tagName ){return document.createElementNS( SVG_NS, tagName );}
//==============================================================================
function getBoardRenderSize( targetElement ){
	let targetRect = targetElement.getBoundingClientRect();
	let width = parseInt( targetRect.width );
	if( width > 0 ){return width;}
	return 300;
}
//==============================================================================
function setSelectedDartSegmentColor( pathId ){let path = document.getElementById( pathId ); if( path ){path.style.fill = SELECTED_SEGMENT_COLOR;}}
//==============================================================================
function getSegmentRenderData( segment, scoreBefore, dih ){
	let scoreInfo = DFC_STATE.scores[scoreBefore];
	let scoreAfter = scoreBefore - segment.SegVal;
	let isWinner = scoreAfter === 0 && segment.SegMulti === 2;
	let dnBefore = getDN( scoreBefore );
	let dnAfter = getDN( scoreAfter );
	let dnDiff = dnBefore - dnAfter;
	let nextDbClrNr = 3;

	if( !isBustScore( scoreAfter ) && !( scoreAfter === 0 && segment.SegMulti !== 2 ) ){
		nextDbClrNr = NDP_COLORS[dnDiff + 1] ? dnDiff + 1 : 3;
	}

	return {
		SB: scoreBefore,
		SBIsFinish: scoreInfo ? scoreInfo.ISFINISH : false,
		SegId: segment.SegId,
		SegGrp: segment.SegGrp,
		SegVal: segment.SegVal,
		SegMulti: segment.SegMulti,
		SegDF: segment.SegDF,
		DIH: dih,
		DN_Bfr: dnBefore,
		SA: scoreAfter,
		IsWinner: isWinner,
		DN_Aftr: dnAfter,
		DN_Diff: dnDiff,
		SegOgClr: segment.SegColor,
		SegDNClr: NDP_COLORS[nextDbClrNr]
	};
}
//==============================================================================
function createBoardSegmentPath( segment, boardIndex, boardSize, scoreBefore, dih ){
	let center = boardSize / 2;
	let boardRadius = boardSize * 0.4995;
	let innerRadius = boardRadius * BOARD_RADII[segment.SegInRad];
	let outerRadius = boardRadius * BOARD_RADII[segment.SegOutRad];
	let segmentData = getSegmentRenderData( segment, scoreBefore, dih );
	let segmentColor = segment.SegMulti > 0 ? segmentData.SegDNClr : segmentData.SegOgClr;
	let path = createSvgElement( "path" );

	path.setAttribute( "d", annularSectorPath( center, center, innerRadius, outerRadius, segment.SegSA, segment.SegEA ) );
	path.setAttribute( "id", "board" + ( boardIndex + 1 ) + "_" + segment.SegId );

	path.segmentData = segmentData;
	path.style.fill = segmentColor;
	path.style.stroke = "#C0C0C0";
	path.style.strokeWidth = "0";

	path.addEventListener( "click", ()=>{onDartBoardSegmentClick( path.id, segmentData );});

	return path;
}
//==============================================================================
function createBoardSegmentText( segment, boardIndex, boardSize ){
	let center = boardSize / 2;
	let boardRadius = boardSize * 0.4995;
	let textRadius = boardRadius * 0.945;
	let textPoint = segmentCenterPoint( center, center, textRadius, segment.SegSA, segment.SegEA );
	let text = createSvgElement( "text" );

	text.setAttribute( "x", textPoint.x );
	text.setAttribute( "y", textPoint.y );
	text.setAttribute( "text-anchor", "middle" );
	text.setAttribute( "dominant-baseline", "middle" );

	text.style.fill = BOARD_TEXT_COLOR;
	text.style.stroke = BOARD_TEXT_STROKE;
	text.style.strokeWidth = "0.75px";
	text.style.fontFamily = "Arial, Helvetica, sans-serif";
	text.style.fontSize = Math.max( 9, parseInt( boardSize / 32 ) ) + "px";
	text.style.fontWeight = "bold";
	text.style.pointerEvents = "none";

	text.textContent = parseInt( segment.SegGrp );

	return text;
}
//==============================================================================
function renderDartBoard( options ){
	console.log( "renderDartBoard: starting" );
	let targetElement = document.getElementById( options.targetId );
	let boardIndex = options.boardIndex;
	let scoreBefore = options.scoreBefore;
	let segments = options.segments;
	let dih = options.dih;
	let boardSize = getBoardRenderSize( targetElement );

	if( dih === undefined ){dih = 3 - boardIndex;}

	clearElement( targetElement );

	let svg = createSvgElement( "svg" );

	svg.setAttribute( "id", "dartBoardSvg" + ( boardIndex + 1 ) );
	svg.setAttribute( "viewBox", "0 0 " + boardSize + " " + boardSize );
	svg.setAttribute( "width", boardSize );
	svg.setAttribute( "height", boardSize );
	svg.setAttribute( "role", "img" );
	svg.setAttribute( "aria-label", "Dartboard " + ( boardIndex + 1 ) );

	let background = createSvgElement( "rect" );

	background.setAttribute( "x", 0 );
	background.setAttribute( "y", 0 );
	background.setAttribute( "width", boardSize );
	background.setAttribute( "height", boardSize );
	background.style.fill = "#000000";

	let segmentGroup = createSvgElement( "g" );
	let textGroup = createSvgElement( "g" );

	segmentGroup.setAttribute( "id", "dartBoardSegments" + ( boardIndex + 1 ) );
	textGroup.setAttribute( "id", "dartBoardTexts" + ( boardIndex + 1 ) );

	svg.appendChild( background );
	svg.appendChild( segmentGroup );
	svg.appendChild( textGroup );

	for( let segment of segments ){
		segmentGroup.appendChild( createBoardSegmentPath( segment, boardIndex, boardSize, scoreBefore, dih ) );
	}

	for( let segment of segments ){
		if( parseInt( segment.SegMulti ) === 0 && segment.SegId.slice( 0, 1 ) === "M" ){
			textGroup.appendChild( createBoardSegmentText( segment, boardIndex, boardSize ) );
		}
	}

	targetElement.appendChild( svg );
}
//==============================================================================
function renderAllDartBoards(){
	console.log( "renderAllDartBoards: starting" );
	for( let boardIndex = 0; boardIndex < 3; boardIndex++ ){
		renderDartBoard({
			targetId: "dartBoard" + ( boardIndex + 1 ),
			boardIndex: boardIndex,
			scoreBefore: getSB_FromIdx( boardIndex ),
			dih: 3 - boardIndex,
			segments: DFC_STATE.segments
		});
	}
}
//==============================================================================
function renderDartBoardsFrom( startBoardIndex ){
	console.log( "renderDartBoardsFrom: starting" );
	for( let boardIndex = startBoardIndex; boardIndex < 3; boardIndex++ ){
		renderDartBoard({
			targetId: "dartBoard" + ( boardIndex + 1 ),
			boardIndex: boardIndex,
			scoreBefore: getSB_FromIdx( boardIndex ),
			dih: 3 - boardIndex,
			segments: DFC_STATE.segments
		});
	}
}
//==============================================================================