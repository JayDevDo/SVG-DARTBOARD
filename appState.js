/*
=============================================================================
appState.js
Version 1.1.0 2026-06-25 14h00
=============================================================================
*/

//==============================================================================
function setScoreInput( value ){DFC_STATE.scoreInput = value.toString();}
//==============================================================================
function getScoreInput(){return DFC_STATE.scoreInput;}
//==============================================================================
function resetScoreInput(){DFC_STATE.scoreInput = DFC_DEFAULT_SCORE.toString();}
//==============================================================================
function addScoreInputDigit( digit ){
	let curScore = DFC_STATE.scoreInput.toString();
	if( curScore === DFC_SCORE_PLACEHOLDER || curScore.length >= 3 ){DFC_STATE.scoreInput = digit.toString(); return;}
	DFC_STATE.scoreInput = curScore + digit.toString();
}
//==============================================================================
function deleteScoreInputDigit(){
	let curScore = DFC_STATE.scoreInput.toString();
	if( curScore === DFC_SCORE_PLACEHOLDER ){return;}
	if( curScore.length <= 1 ){DFC_STATE.scoreInput = DFC_SCORE_PLACEHOLDER; return;}
	DFC_STATE.scoreInput = curScore.slice( 0, -1 );
}
//==============================================================================
function getParsedScoreInput(){
	if( DFC_STATE.scoreInput === DFC_SCORE_PLACEHOLDER ){return DFC_DEFAULT_SCORE;}
	let parsedScore = parseInt( DFC_STATE.scoreInput );
	if( isNaN( parsedScore ) ){return DFC_DEFAULT_SCORE;}
	return parsedScore;
}
//==============================================================================
function setStartScore( score ){DFC_STATE.startScore = parseInt( score ); resetDarts();}
//==============================================================================
function resetDarts(){DFC_STATE.darts = [];}
//==============================================================================
function resetDartsFrom( dartIndex ){DFC_STATE.darts.splice( dartIndex );}
//==============================================================================
function setDartSegment( dartIndex, segment ){
	if( dartIndex > DFC_STATE.darts.length || dartIndex > 2 ){return false;}
	DFC_STATE.darts[dartIndex] = segment;
	resetDartsFrom( dartIndex + 1 );
	return true;
}
//==============================================================================
function getDartValue( dartIndex ){
	let segment = DFC_STATE.darts[dartIndex];
	if( !segment ){return 0;}
	return segment.SegVal;
}
//==============================================================================
function getSB_FromIdx( dartIndex ){
	let score = DFC_STATE.startScore;
	for( let i = 0; i < dartIndex; i++ ){score = score - getDartValue( i );}
	return score;
}
//==============================================================================
function getCurrentScore(){return getSB_FromIdx( DFC_STATE.darts.length );}
//==============================================================================
function getDih(){return 3 - DFC_STATE.darts.length;}
//==============================================================================
function hasDFCData(){return DFC_STATE.dataLoaded;}
//==============================================================================
function addMessage( message ){DFC_STATE.messages.push( message );}
//==============================================================================
function clearMessages(){DFC_STATE.messages = [];}
//==============================================================================
function getMessages(){return DFC_STATE.messages;}
//==============================================================================
function getFavList( favType ){return favType === "DBL" ? DFC_STATE.favDbls : DFC_STATE.favTrpls;}
//==============================================================================
function clampFavWeight( favWeight ){
	if( favWeight < 0 ){return 0;}
	if( favWeight > 100 ){return 100;}
	return favWeight;
}
//==============================================================================
function formatFavWeight( favWeight ){return Math.round( favWeight ).toString();}
//==============================================================================
function getFavOtherIndexes( favIndex ){
	let retArr = [];
	for( let i = 0; i < 3; i++ ){if( i !== parseInt( favIndex ) ){retArr.push( i );}}
	return retArr;
}
//==============================================================================
function roundFavZeroPair( favList ){
	let zeroIndexes = [];
	let activeIndexes = [];

	for( let i = 0; i < favList.length; i++ ){
		if( favList[i].favWeight === 0 ){zeroIndexes.push( i );}
		else{activeIndexes.push( i );}
	}

	if( zeroIndexes.length !== 1 ){return;}

	let total = favList[activeIndexes[0]].favWeight + favList[activeIndexes[1]].favWeight;
	let diff = 100 - total;

	while( diff > 0 ){
		let addIndex = favList[activeIndexes[0]].favWeight <= favList[activeIndexes[1]].favWeight ? activeIndexes[0] : activeIndexes[1];
		favList[addIndex].favWeight++;
		diff--;
	}

	while( diff < 0 ){
		let subIndex = favList[activeIndexes[0]].favWeight >= favList[activeIndexes[1]].favWeight ? activeIndexes[0] : activeIndexes[1];
		favList[subIndex].favWeight--;
		diff++;
	}
}
//==============================================================================
function stepBalancedFavWeight( favList, favIndex, stepDelta ){
	let targetIndex = parseInt( favIndex );
	let otherIndexes = getFavOtherIndexes( targetIndex );
	let target = favList[targetIndex];
	let otherA = favList[otherIndexes[0]];
	let otherB = favList[otherIndexes[1]];

	if( stepDelta > 0 ){
		if( otherA.favWeight > 0 && otherB.favWeight > 0 ){
			target.favWeight = clampFavWeight( target.favWeight + 2 );
			otherA.favWeight--;
			otherB.favWeight--;
		}else if( otherA.favWeight > 1 ){
			target.favWeight = clampFavWeight( target.favWeight + 2 );
			otherA.favWeight = otherA.favWeight - 2;
		}else if( otherB.favWeight > 1 ){
			target.favWeight = clampFavWeight( target.favWeight + 2 );
			otherB.favWeight = otherB.favWeight - 2;
		}
	}else{
		if( target.favWeight === 0 ){return;}

		if( target.favWeight === 1 ){
			target.favWeight = 0;
			roundFavZeroPair( favList );
			return;
		}

		target.favWeight = target.favWeight - 2;
		otherA.favWeight++;
		otherB.favWeight++;
	}

	roundFavZeroPair( favList );
}
//==============================================================================
function setBalancedFavWeight( favType, favIndex, newWeight ){
	let favList = getFavList( favType );
	let targetIndex = parseInt( favIndex );
	let targetWeight = clampFavWeight( parseInt( newWeight ) );
	let guard = 0;

	while( favList[targetIndex].favWeight !== targetWeight && guard < 60 ){
		if( targetWeight > favList[targetIndex].favWeight ){stepBalancedFavWeight( favList, targetIndex, 2 );}
		else{stepBalancedFavWeight( favList, targetIndex, -2 );}
		guard++;
	}
}
//==============================================================================
function adjustBalancedFavWeight( favType, favIndex, weightDelta ){
	let favList = getFavList( favType );
	setBalancedFavWeight( favType, favIndex, favList[parseInt( favIndex )].favWeight + parseInt( weightDelta ) );
}
//==============================================================================
function rebalanceFavWeightsAfterExactSet( favList, targetIndex ){
	let otherIndexes = getFavOtherIndexes( targetIndex );
	let total = 0;
	for( let fav of favList ){total = total + fav.favWeight;}
	let diff = 100 - total;

	while( diff > 0 ){
		let addIndex = favList[otherIndexes[0]].favWeight <= favList[otherIndexes[1]].favWeight ? otherIndexes[0] : otherIndexes[1];
		favList[addIndex].favWeight++;
		diff--;
	}

	while( diff < 0 ){
		let subIndex = favList[otherIndexes[0]].favWeight >= favList[otherIndexes[1]].favWeight ? otherIndexes[0] : otherIndexes[1];
		if( favList[subIndex].favWeight === 0 ){return;}
		favList[subIndex].favWeight--;
		diff++;
	}

	roundFavZeroPair( favList );
}
//==============================================================================
function setFavWeightExact( favType, favIndex, newWeight ){
	let parsedWeight = parseInt( newWeight );
	if( isNaN( parsedWeight ) ){return;}
	let favList = getFavList( favType );
	let targetIndex = parseInt( favIndex );
	favList[targetIndex].favWeight = clampFavWeight( parsedWeight );
	rebalanceFavWeightsAfterExactSet( favList, targetIndex );
}
//==============================================================================
function getFavWeightTotal( favType ){
	let total = 0;
	for( let fav of getFavList( favType ) ){total = total + fav.favWeight;}
	return total;
}
//==============================================================================