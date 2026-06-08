/*=============================================================================
targetMatrix.js
Version 1.0.5 2026-06-08 16h30
============================================================================= */
const profileDFMap = {
	"BUST-BUST-BUST": [ 99, 0 ],
	"OUT-BUST-FINISH": [ 99, 0 ],
	"D-DNN-DNN": [ 6, 1 ],
	"S-D-DNN": [ 7, 2 ],
	"S-S-D": [ 8, 3 ],
	"S-D-D": [ 13, 3 ],
	"S-S-DBL": [ 38, 3 ],
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
//  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
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
//  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
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

//==============================================================================
let mappedSegs = {};
let targetMatrixReady = false;
//==============================================================================
const waitForDataTimer = setInterval(function() {
	if (typeof DFC_STATE !== "undefined" && DFC_STATE.dataLoaded === true) {
		clearInterval(waitForDataTimer);
		mappedSegs = createSegIdObject();
		targetMatrixReady = true;
		console.log("targetMatrix: mappedSegs: ", mappedSegs);
	}
}, 50);
//==============================================================================
function createSegIdObject() {
	const segObj = {};
	for (const seg of DFC_STATE.segments) { segObj[seg.SegId] = seg; }
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
		SegPath: ""
	};
	return segObj;
}
//==============================================================================
function scrAftrEval(SA, DIH) {
	const scrInfo = DFC_STATE.scores[SA];
	const retObj = {
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
	/*
	console.log(
		"scrAftrEval: SA: ", SA, "DIH: ", DIH,
		"EZVISITPROFILE: ", scrInfo.EZVISITPROFILE,
		"VISITPROFILE: ", scrInfo.VISITPROFILE,
		"DF: ", retObj.DF,
		"info: ", retObj
	);
	*/
	return retObj;
}
//==============================================================================
function defineTargetMatrix(targetSegId) {
	if (!targetMatrixReady) { return null; }
	if (BULL_TARGET_MATRICES[targetSegId]) { return BULL_TARGET_MATRICES[targetSegId]; }
	const targetSegment = mappedSegs[targetSegId];
	const targetOrder = targetSegment.DartBoardOrder.toFixed(2);
	const targetOrderParts = targetOrder.split(".");

	const targetWedge = parseInt(targetOrderParts[0]);
	const targetRing = parseInt(targetOrderParts[1]);

	let prevWedge = targetWedge - 1;
	let nextWedge = targetWedge + 1;

	const outerRing = targetRing - 1;
	const innerRing = targetRing + 1;

	if (prevWedge < 1) { prevWedge = 20; }
	if (nextWedge > 20) { nextWedge = 1; }

	const outerRingKey = "." + outerRing.toString().padStart(2, "0");
	const targetRingKey = "." + targetRing.toString().padStart(2, "0");
	const innerRingKey = "." + innerRing.toString().padStart(2, "0");

	const matrix = [
		[ "DNN", "DNN", "DNN" ],
		[ "DNN", targetSegId, "DNN" ],
		[ "DNN", "DNN", "DNN" ]
	];

	for (const segment of DFC_STATE.segments) {
		const order = segment.DartBoardOrder.toFixed(2);

		if (order.startsWith(prevWedge + ".")) {
			if (order.endsWith(outerRingKey)) { matrix[0][0] = segment.SegId; }
			if (order.endsWith(targetRingKey)) { matrix[1][0] = segment.SegId; }
			if (order.endsWith(innerRingKey)) { matrix[2][0] = segment.SegId; }
		}

		if (order.startsWith(targetWedge + ".")) {
			if (order.endsWith(outerRingKey)) { matrix[0][1] = segment.SegId; }
			if (order.endsWith(innerRingKey)) { matrix[2][1] = segment.SegId; }
		}

		if (order.startsWith(nextWedge + ".")) {
			if (order.endsWith(outerRingKey)) { matrix[0][2] = segment.SegId; }
			if (order.endsWith(targetRingKey)) { matrix[1][2] = segment.SegId; }
			if (order.endsWith(innerRingKey)) { matrix[2][2] = segment.SegId; }
		}
	}

	return matrix;
}
//==============================================================================
function getMatrixEval(matrix, SB, DIH) {
	if (!targetMatrixReady) { return { DN: 999, DF: 999 }; }

	let ttlDN = 0;
	let ttlDF = 0;
	let segsDone = 0;

	//console.log("getMatrixEval: SB: ", SB, "seg: ", matrix[1][1], "DIH: ", DIH);
	for (const row of matrix) {
		for (const segId of row) {
			const segValue = mappedSegs[segId].SegVal || 0;
			const SA = SB - segValue;
			const SA_Info = scrAftrEval(SA, DIH);
			const segDN = SA_Info.DN;
			const segDF = SA_Info.DF;

			//console.log("getMatrixEval: EZP.ALIVE: ", SA_Info.EZP.ALIVE);
			//console.log("getMatrixEval: NVP.ALIVE: ", SA_Info.NVP.ALIVE);
			//console.log("getMatrixEval: DN.ALIVE: ", SA_Info.ALIVE);

			if (segDN !== null && segDN !== undefined) {
				segsDone++;
				ttlDN += segDN;
				ttlDF += segDF;
				/*console.log(
					"targetMatrix: segId: ", segId,
					"segDN: ", segDN,
					"segDF: ", segDF,
					"segsDone: ", segsDone,
					"ttlDN: ", ttlDN,
					"ttlDF: ", ttlDF
				);
				*/
			}
		}
	}

	if (segsDone === 0) { return { DN: 999, DF: 999 }; }

	return {
		DN: parseFloat((ttlDN / segsDone).toFixed(2)),
		DF: parseFloat((ttlDF / segsDone).toFixed(2))
	};
}
//==============================================================================
function checkTargetMatrixSystem() {
	console.log("targetMatrix CHECK: starting");
	//console.log("targetMatrixReady:", targetMatrixReady);
	//console.log("DFC_STATE exists:", typeof DFC_STATE !== "undefined");
	//console.log("DFC_STATE.segments is array:", Array.isArray(DFC_STATE.segments));
	//console.log("segments length:", DFC_STATE.segments.length);

	if (!targetMatrixReady) { console.log("targetMatrix CHECK: not ready yet"); return false; }

	//console.log("mappedSegs.T20:", mappedSegs["T20"]);
	const tests = [ "M20", "D20", "B20", "T20", "SBL", "DBL" ];

	for (const targetSegId of tests) {
		const matrix = defineTargetMatrix(targetSegId);
		//console.log("targetMatrix CHECK:", targetSegId, matrix);
		// console.table(matrix);
		for (const row of matrix) {
			for (const segId of row) {
				if (!mappedSegs[segId]) {
					console.error("targetMatrix CHECK: missing mapped segment:", segId, "in target:", targetSegId);
				}
			}
		}
	}

	console.log("targetMatrix CHECK: getMatrixEval( T20, 80, 2)", getMatrixEval(defineTargetMatrix("T20"), 80, 2));
	console.log("targetMatrix CHECK: getMatrixEval( T20, 80, 3)", getMatrixEval(defineTargetMatrix("T20"), 80, 3));
	console.log("--");
	console.log("targetMatrix CHECK: getMatrixEval( B20, 80, 2)", getMatrixEval(defineTargetMatrix("B20"), 80, 2));
	console.log("targetMatrix CHECK: getMatrixEval( B20, 80, 3)", getMatrixEval(defineTargetMatrix("B20"), 80, 3));
	console.log("--");
	console.log("targetMatrix CHECK: getMatrixEval( D20, 80, 2)", getMatrixEval(defineTargetMatrix("D20"), 80, 2));
	console.log("targetMatrix CHECK: getMatrixEval( D20, 80, 3)", getMatrixEval(defineTargetMatrix("D20"), 80, 3));

	return true;
}
//==============================================================================