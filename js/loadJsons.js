getScoresData = async ()=>{
	let scoresPrms = new Promise( ( myScoresResolve )=> {
		let scoresXhttp = new XMLHttpRequest();
		scoresXhttp.open("GET", scoresArrJsonPath, true ) ; 
		scoresXhttp.send() ; 

		scoresXhttp.onreadystatechange = ()=>{
			if ( (scoresXhttp.readyState == 4) && (scoresXhttp.status == 200) ){
				let scoresResponse = JSON.parse( scoresXhttp.responseText ) ; 
				myScoresResolve( scoresResponse ) ; 
			}}});

	return await scoresPrms ;
};

getSegArrData = async ()=>{
	let segArrPrms = new Promise( ( mySegArrResolve )=> {
		let segArrXhttp = new XMLHttpRequest();
		segArrXhttp.open("GET", segArrJsonPath, true ) ; 
		segArrXhttp.send() ; 

		segArrXhttp.onreadystatechange = ()=>{
			if ( (segArrXhttp.readyState == 4) && (segArrXhttp.status == 200) ){
				let segArrResponse = JSON.parse( segArrXhttp.responseText ) ; 
				mySegArrResolve( segArrResponse ) ; 
			}}});

	return await segArrPrms ;
};