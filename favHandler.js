/*
=============================================================================
favHandler.js
Version 1.1.0 2026-06-25 14h00
=============================================================================
*/

const DFC_FAV_UI = {
	btnApplyFavDblValues: null,
	btnApplyFavTrpValues: null,
	favDblEls: [],
	favDblHeader: null,
	favDblOpen: false,
	favDblSliderLines: [],
	favDblSliderRow: null,
	favTrpEls: [],
	favTrpHeader: null,
	favTrpOpen: false,
	favTrpSliderLines: [],
	favTrpSliderRow: null
};

//==============================================================================
function cacheFavoriteUiElements(){
	DFC_FAV_UI.btnApplyFavDblValues = gid( "btnApplyFavDblValues" );
	DFC_FAV_UI.btnApplyFavTrpValues = gid( "btnApplyFavTrpValues" );
	DFC_FAV_UI.favDblEls = [ gid( "favD1" ), gid( "favD2" ), gid( "favD3" ) ];
	DFC_FAV_UI.favTrpEls = [ gid( "favT1" ), gid( "favT2" ), gid( "favT3" ) ];
	DFC_FAV_UI.favDblHeader = gid( "favDblHeader" );
	DFC_FAV_UI.favTrpHeader = gid( "favTrpHeader" );
	DFC_FAV_UI.favDblHeader.style.cursor = "pointer";
	DFC_FAV_UI.favTrpHeader.style.cursor = "pointer";
	DFC_FAV_UI.favDblSliderRow = gid( "favDblSliderRow" );
	DFC_FAV_UI.favTrpSliderRow = gid( "favTrpSliderRow" );
	DFC_FAV_UI.favDblSliderLines = qsa( "[data-fav-slider-line='DBL']" );
	DFC_FAV_UI.favTrpSliderLines = qsa( "[data-fav-slider-line='TRP']" );
}
//==============================================================================
function bindFavoriteUiEvents(){
	for( let button of qsa( "[data-fav-delta]" ) ){button.addEventListener( "click", handleFavoriteStepButtonClick );}

	for( let slider of qsa( "[data-fav-slider]" ) ){
		slider.addEventListener( "input", handleFavoriteSliderInput );
		slider.addEventListener( "change", handleFavoriteSliderChange );
	}

	for( let value of qsa( "[data-fav-value]" ) ){value.addEventListener( "click", handleFavoriteValueClick );}

	DFC_FAV_UI.favDblHeader.addEventListener( "click", ()=>{toggleFavoriteSliderPanel( "DBL" );});
	DFC_FAV_UI.favTrpHeader.addEventListener( "click", ()=>{toggleFavoriteSliderPanel( "TRP" );});
	DFC_FAV_UI.btnApplyFavDblValues.addEventListener( "click", ()=>{handleApplyFavValuesClick( "DBL" );});
	DFC_FAV_UI.btnApplyFavTrpValues.addEventListener( "click", ()=>{handleApplyFavValuesClick( "TRP" );});
}
//==============================================================================
function handleApplyFavValuesClick( favType ){
	console.log( "handleApplyFavValuesClick: starting" );
	if( !hasDFCData() ){addMessage( "Data is not loaded yet." ); renderMessages(); return;}
	DFC_STATE.segmentById = createSegIdObject( DFC_STATE.segments );
	addMessage( ( favType === "DBL" ? "Double" : "Treble" ) + " favorite values applied. Segment difficulty refreshed." );
	renderFullUi();
}
//==============================================================================
function toggleFavoriteSliderPanel( favType ){
	if( favType === "DBL" ){DFC_FAV_UI.favDblOpen = !DFC_FAV_UI.favDblOpen;}
	else{DFC_FAV_UI.favTrpOpen = !DFC_FAV_UI.favTrpOpen;}
	renderFavoriteSliderPanels();
}
//==============================================================================
function handleFavoriteSliderInput( event ){
	let slider = event.target;
	setBalancedFavWeight( slider.dataset.favType, slider.dataset.favIndex, slider.value );
	renderFavoriteLists();
	renderFavoriteSliderValues( slider.dataset.favType );
}
//==============================================================================
function handleFavoriteSliderChange(){renderFavoriteSliderPanels();}
//==============================================================================
function handleFavoriteStepButtonClick( event ){
	let button = event.target;
	adjustBalancedFavWeight( button.dataset.favType, button.dataset.favIndex, button.dataset.favDelta );
	renderFavoriteLists();
	renderFavoriteSliderPanels();
}
//==============================================================================
function handleFavoriteValueClick( event ){
	let valueEl = event.currentTarget;
	let favList = getFavList( valueEl.dataset.favType );
	let favIndex = parseInt( valueEl.dataset.favIndex, 10 );
	let curWeight = favList[favIndex].favWeight;
	let inputValue = prompt( "Set " + favList[favIndex].seg + " weight", curWeight );
	if( inputValue === null ){return;}
	setFavWeightExact( valueEl.dataset.favType, favIndex, inputValue );
	renderFavoriteLists();
	renderFavoriteSliderPanels();
}
//==============================================================================
function getFavEntriesSortedByWeight( favType ){
	let retArr = [];
	let favList = getFavList( favType );
	for( let i = 0; i < favList.length; i++ ){retArr.push({ favIndex: i, fav: favList[i] });}
	retArr.sort( ( a, b )=>{
		if( a.fav.favWeight !== b.fav.favWeight ){return b.fav.favWeight - a.fav.favWeight;}
		return a.fav.seg.localeCompare( b.fav.seg );
	});
	return retArr;
}
//==============================================================================
function renderFavoriteLists(){
	let favDblEntries = getFavEntriesSortedByWeight( "DBL" );
	let favTrpEntries = getFavEntriesSortedByWeight( "TRP" );

	for( let i = 0; i < 3; i++ ){
		DFC_FAV_UI.favDblEls[i].textContent = favDblEntries[i].fav.seg;
		DFC_FAV_UI.favTrpEls[i].textContent = favTrpEntries[i].fav.seg;
	}
}
//==============================================================================
function renderFavoriteSliderPanels(){
	let favDblEntries = getFavEntriesSortedByWeight( "DBL" );
	let favTrpEntries = getFavEntriesSortedByWeight( "TRP" );

	DFC_FAV_UI.favDblHeader.textContent = DFC_FAV_UI.favDblOpen ? "Fav Double ▾" : "Fav Double ▸";
	DFC_FAV_UI.favTrpHeader.textContent = DFC_FAV_UI.favTrpOpen ? "Fav Treble ▾" : "Fav Treble ▸";

	if( DFC_FAV_UI.favDblOpen ){DFC_FAV_UI.favDblSliderRow.classList.remove( "isHidden" );}
	else{DFC_FAV_UI.favDblSliderRow.classList.add( "isHidden" );}

	if( DFC_FAV_UI.favTrpOpen ){DFC_FAV_UI.favTrpSliderRow.classList.remove( "isHidden" );}
	else{DFC_FAV_UI.favTrpSliderRow.classList.add( "isHidden" );}

	for( let i = 0; i < 3; i++ ){
		updateFavoriteSliderLine( DFC_FAV_UI.favDblSliderLines[i], "DBL", favDblEntries[i] );
		updateFavoriteSliderLine( DFC_FAV_UI.favTrpSliderLines[i], "TRP", favTrpEntries[i] );
	}
}
//==============================================================================
function updateFavoriteSliderLine( line, favType, entry ){
	let label = line.querySelector( "[data-fav-label]" );
	let minus = line.querySelector( "[data-fav-delta='-2']" );
	let slider = line.querySelector( "[data-fav-slider]" );
	let plus = line.querySelector( "[data-fav-delta='2']" );
	let value = line.querySelector( "[data-fav-value]" );
	let parity = entry.fav.favWeight % 2;

	line.dataset.favType = favType;
	line.dataset.favIndex = entry.favIndex;
	label.textContent = entry.fav.seg;

	minus.dataset.favType = favType;
	minus.dataset.favIndex = entry.favIndex;

	slider.dataset.favType = favType;
	slider.dataset.favIndex = entry.favIndex;
	slider.min = parity.toString();
	slider.max = parity === 0 ? "100" : "99";
	slider.value = entry.fav.favWeight;
	paintFavoriteSlider( slider, entry.fav.favWeight );

	plus.dataset.favType = favType;
	plus.dataset.favIndex = entry.favIndex;

	value.dataset.favType = favType;
	value.dataset.favIndex = entry.favIndex;
	value.textContent = formatFavWeight( entry.fav.favWeight );
}
//==============================================================================
function paintFavoriteSlider( slider, favWeight ){slider.style.setProperty( "--fav-level", favWeight + "%" );}
//==============================================================================
function renderFavoriteSliderValues( favType ){
	let favList = getFavList( favType );
	let lines = favType === "DBL" ? DFC_FAV_UI.favDblSliderLines : DFC_FAV_UI.favTrpSliderLines;

	for( let line of lines ){
		let slider = line.querySelector( "[data-fav-slider]" );
		let value = line.querySelector( "[data-fav-value]" );
		let fav = favList[parseInt( slider.dataset.favIndex, 10 )];
		let parity = fav.favWeight % 2;

		slider.min = parity.toString();
		slider.max = parity === 0 ? "100" : "99";
		slider.value = fav.favWeight;
		paintFavoriteSlider( slider, fav.favWeight );
		value.textContent = formatFavWeight( fav.favWeight );
	}
}
//==============================================================================