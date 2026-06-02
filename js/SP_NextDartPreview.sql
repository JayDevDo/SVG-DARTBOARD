CREATE DEFINER=`root`@`localhost` PROCEDURE `SP_NextDartPreview`(IN `JD_PrmIn_SB` INT, IN `JD_PrmIn_DIH` INT
)
	READS SQL DATA
	COMMENT 'RETURNS FULL SELECTION FOR NEXT DART ALL SEGMENTS'
BEGIN

DECLARE SgmntId varchar(3);
DECLARE DartVal INT;
DECLARE DN_Diff INT;
DECLARE Scr_Bfr INT;
DECLARE IsF_Bfr tinyint;
DECLARE DN_Bfr INT;
DECLARE DIH_Bfr INT;
DECLARE Scr_Aftr INT;
DECLARE IsF_Aftr tinyint;
DECLARE DN_Aftr INT;
DECLARE DIH_Aftr INT;
DECLARE Segmnt_ClrCd varchar(7);
DECLARE DrtsNdd_ClrCd varchar(7);
DECLARE NxtDrt_ClrCd varchar(7);

SET DN_Bfr = FN_scores_GetDN(JD_PrmIn_SB);
SET DIH_Bfr = JD_PrmIn_DIH;
SET DIH_Aftr = if((JD_PrmIn_DIH-1) = -1, 0, JD_PrmIn_DIH-1);

	 SELECT scrbfr.Score AS Score_Bfr, 
			FN_scores_GetIsF(JD_PrmIn_SB) AS IsF_Bfr,
			sgmnt.SegId AS SegId, 
			sgmnt.SegVal AS DartVal, 
#			DIH_Bfr AS DIH_Bfr,
#			DN_Bfr AS DN_Bfr,
			(JD_PrmIn_SB - sgmnt.SegVal) AS Scr_Aftr,
			( FN_scores_GetIsF(JD_PrmIn_SB - sgmnt.SegVal) ) AS IsF_Aftr,
#			DIH_Aftr AS DIH_Aftr,
			FN_scores_GetDN(JD_PrmIn_SB - sgmnt.SegVal) AS DN_Aftr,
			( FN_scores_GetDN(JD_PrmIn_SB) - FN_scores_GetDN(JD_PrmIn_SB - sgmnt.SegVal) ) AS DN_Diff,
			( FN_scores_GetDN(JD_PrmIn_SB) - FN_scores_GetDN(JD_PrmIn_SB - sgmnt.SegVal) ) + 1 as NextDbClrNr,
			DefClr.ColorCode AS Segmnt_ClrCd,
			NDClr.ColorCode AS NxtDrt_ClrCd,
			DNClr.ColorCode AS DrtsNdd_ClrCd,
			if ( FN_scores_GetDN( JD_PrmIn_SB - sgmnt.SegVal) <= DIH_Aftr,'ALIVE','Next Visit') as Alive,
			if ( ( (sgmnt.Multiplier=2) AND ( (JD_PrmIn_SB - sgmnt.SegVal) = 0 ) ), 'Winner','NotOut') as Winner

	 FROM 	jaysdarts001.scores scrbfr, 
			jaysdarts001.segments sgmnt,
			jaysdarts001.jdcolors DefClr,
			jaysdarts001.jdcolors NDClr,
			jaysdarts001.jdcolors DNClr
	 
	WHERE 	scrbfr.Score = JD_PrmIn_SB
		AND 	NDClr.NextDartBoard = 1 + ( 1 - FN_scores_GetDN( JD_PrmIn_SB - sgmnt.SegVal )) 
		AND 	DNClr.DartsNeeded = FN_scores_GetDN( JD_PrmIn_SB - sgmnt.SegVal )
		AND		DefClr.ColorCode = sgmnt.SegColor
		AND 	FN_scores_GetDN( JD_PrmIn_SB - sgmnt.SegVal) <= 1
		AND 	sgmnt.Multiplier > 0
		AND		( if(((sgmnt.Multiplier <> 2 ) AND ( ( JD_PrmIn_SB - sgmnt.SegVal ) = 0 )                
				), 1,0) = 0  )
	 ;