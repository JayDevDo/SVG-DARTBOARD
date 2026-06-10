	/*
=============================================================================
init.js
Version 1.0.6 2026-06-10 20h00
=============================================================================
*/

const SCORES_JSON_PATH = "scores.json";
const SEGMENTS_JSON_PATH = "jsonDartBoard102.json";

const DFC_DEFAULT_SCORE = 121;
const DFC_SCORE_PLACEHOLDER = "___";

const NDP_COLORS = [
	"#FFAB00",	// diff = -1, worse
	"#006400",	// diff = 0, same
	"#00FF00",	// diff = 1, better
	"#FF0000"	// bust / fallback
];

const MAX_FINISH_ROUTES = 30;
const LEAVE_DN_MULTIPLIER = 100;
const FAV_DBL_BONUS_MAX = 0.45;
const FAV_TRP_BONUS_MAX = 0.20;

const DFfromProfile = {
	"BUST": 99,
	"OUT": 0,
	"DNN": 0,
	"S": 1,
	"SBL": 3,
	"D": 6,
	"T": 12,
	"DBL": 36
};

const profileDFMap = {
	"BUST-BUST-BUST": [ 99, 0 ],
	"OUT-BUST-FINISH": [ 99, 0 ],
	"BOGEY-BOGEY-BOGEY": [ 99, 4 ],
	"D-DNN-DNN": [ 6, 1 ],
	"D-S-DBL": [ 43, 3 ],
	"S-D-DNN": [ 7, 2 ],
	"S-S-D": [ 8, 3 ],
	"S-D-D": [ 13, 3 ],
	"S-S-DBL": [ 38, 3 ],
	"SBL-D-D": [ 15, 3 ],
	"SBL-D-DNN": [ 9, 2 ],
	"SBL-DBL-DNN": [ 39, 2 ],
	"SBL-S-D": [ 10, 3 ],
	"SBL-T-D": [ 21, 3 ],
	"SBL-S-DBL": [ 40, 3 ],
	"SBL-T-DBL": [ 51, 3 ],
	"DBL-DNN-DNN": [ 36, 1 ],
	"DBL-D-DNN": [ 42, 2 ],
	"T-S-D": [ 19, 3 ],
	"T-S-DBL": [ 49, 3 ],
	"T-D-DNN": [ 18, 2 ],
	"T-D-D": [ 24, 3 ],
	"T-DBL-DNN": [ 48, 2 ],
	"T-T-S": [ 25, 3 ],
	"T-T-D": [ 30, 3 ],
	"T-T-T": [ 36, 3 ],
	"T-T-DBL": [ 60, 3 ]
};

const BULL_TARGET_MATRICES = {
	DBL: [
		[ "SBL", "SBL", "SBL" ],
		[ "SBL", "DBL", "SBL" ],
		[ "SBL", "SBL", "SBL" ]
	],
	SBL: [
		[ "S01", "DBL", "S01" ],
		[ "SBL", "SBL", "SBL" ],
		[ "S01", "DBL", "S01" ]
	]
};

const MISS_RATIOS = {
	M: [
		[ 0.00, 0.00, 0.00 ],
		[ 0.25, 0.50, 0.25 ],
		[ 0.12, 0.80, 0.12 ]
	],
	D: [
		[ 0.04, 0.66, 0.04 ],
		[ 0.08, 0.33, 0.08 ],
		[ 0.04, 0.66, 0.04 ]
	],
	B: [
		[ 0.01, 0.01, 0.01 ],
		[ 0.05, 0.90, 0.05 ],
		[ 0.01, 0.01, 0.01 ]
	],
	T: [
		[ 0.04, 0.66, 0.04 ],
		[ 0.08, 0.33, 0.08 ],
		[ 0.04, 0.66, 0.04 ]
	],
	S: [
		[ 0.04, 0.10, 0.04 ],
		[ 0.08, 0.66, 0.08 ],
		[ 0.08, 0.16, 0.08 ]
	],
	SBL: [
		[ 0.25, 0.50, 0.25 ],
		[ 0.50, 0.90, 0.50 ],
		[ 0.25, 0.50, 0.25 ]
	],
	DBL: [
		[ 0.50, 0.50, 0.50 ],
		[ 0.50, 0.25, 0.50 ],
		[ 0.50, 0.50, 0.50 ]
	],
	DNN: [
		[ 1 ]
	]
};

const DFC_STATE = {
	startScore: DFC_DEFAULT_SCORE,
	scoreInput: DFC_DEFAULT_SCORE.toString(),
	darts: [],
	scores: [],
	segments: [],
	segmentById: {},
	dataLoaded: false,
	favDbls: [
		{ seg: "D20", val: 40, favWeight: 40 },
		{ seg: "D16", val: 32, favWeight: 40 },
		{ seg: "D18", val: 36, favWeight: 20 }
	],
	favTrpls: [
		{ seg: "T20", val: 60, favWeight: 38 },
		{ seg: "T19", val: 57, favWeight: 38 },
		{ seg: "T18", val: 54, favWeight: 24 }
	],
	messages: []
};

//==============================================================================
async function loadJsonFile( path ){
	let response = await fetch( path );
	if( !response.ok ){throw new Error( "Could not load " + path + " status " + response.status );}
	return await response.json();
}
//==============================================================================
function createSegIdObject( segments ){
	console.log( "createSegIdObject: starting" );
	let segObj = {};

	for( let segment of segments ){
		let baseDF = DFfromProfile["BUST"];

		if( segment.SegId === "DBL" || segment.SegId === "SBL" ){baseDF = DFfromProfile[segment.SegId];}
		else if( segment.SegMulti === 1 && segment.SegInRad === 2 ){baseDF = 2.5;}
		else if( segment.SegMulti === 1 ){baseDF = DFfromProfile["S"];}
		else if( segment.SegMulti === 2 ){baseDF = DFfromProfile["D"];}
		else if( segment.SegMulti === 3 ){baseDF = DFfromProfile["T"];}

		for( let favDbl of DFC_STATE.favDbls ){
			if( favDbl.seg === segment.SegId ){baseDF = baseDF * ( 1 - ( favDbl.favWeight / 100 * FAV_DBL_BONUS_MAX ) );}
		}

		for( let favTrp of DFC_STATE.favTrpls ){
			if( favTrp.seg === segment.SegId ){baseDF = baseDF * ( 1 - ( favTrp.favWeight / 100 * FAV_TRP_BONUS_MAX ) );}
		}

		segment.SegDF = baseDF;
		segObj[segment.SegId] = segment;
	}

	segObj["DNN"] = {
		SegId: "DNN",
		SegGrp: "0",
		SegMulti: 0,
		SegVal: 0,
		SegSA: 0,
		SegEA: 0,
		SegInRad: 0,
		SegOutRad: 0,
		SegColor: "#585858",
		DartBoardOrder: 0,
		SegTxt: "Dart Not Needed",
		SegPath: "",
		SegDF: DFfromProfile["DNN"]
	};

	return segObj;
}
//==============================================================================
async function loadDFCData(){
	console.log( "loadDFCData: starting" );
	let data = await Promise.all([ loadJsonFile( SCORES_JSON_PATH ), loadJsonFile( SEGMENTS_JSON_PATH ) ]);
	DFC_STATE.scores = data[0];
	DFC_STATE.segments = data[1];
	DFC_STATE.segmentById = createSegIdObject( data[1] );
	DFC_STATE.dataLoaded = true;
	return DFC_STATE;
}
//==============================================================================
