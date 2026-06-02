
/*
    const colorPairs =  [ 
        {   c1:"#FF00FF",c2: "#FF00FF" },
        {   c1:"#FF6633",c2: "#FF6633" },
        {   c1:"#FF9966",c2: "#FF9966" },
        {   c1:"#0066FF",c2: "#0066FF" },
        {   c1:"#00CCFF",c2: "#00CCFF" }
    ];

    const ndpSeg    =   {
        SegId: "",
        NextDartsNeeded: 9,
        ScoreAfterDart: 501,
        NewColor: "#000000"
    }

    const favDbls = [
        { seg:"D20", val: 40 }, 
        { seg:"D16", val: 32 }, 
        { seg:"DBL", val: 50 }
    ];

    const favTrpls = [
        { seg:"T20", val: 60 }, 
        { seg:"T19", val: 57 }, 
        { seg:"T18", val: 54 }
    ];

    let clrArr = [
        "#006400",  // 0: DarkGreen  same darts needed
        "#00ff00",  // lime          -1 darts needed
        "#ffab00",  // orange        +1 darts needed
        "#ff0000"   // red           bust !
    ];

    let ndpSegArray     =   [];
    let scores          =   [];
    let jscores         =   d3.json( "data/scores.json" );

*/

let ndpFinArr       =   {
                            m:[],
                            b:[],
                            d:[],
                            t:[]
                        };

if( !scores ){
    console.log("ndp.js jsonSegArr doesn't exist" );
}else{
    if( scores.length > 1 ){
        console.log("ndp.js scores exists + loaded", scores.length );
    }else{
        jscores.then( 
            (data)=>{ 
                scores = data; 
                console.log("ndp.js scores existed but then not loaded, now", scores.length );
            }
        ).then(
            ()=>{ makeFinArrays();  }
        ).then(
            ()=>{ 
                if( sb() > 0 ){
                    getNDPData();
                    makeFinList();
                }
            }
        );
    }
}

function makeFinArrays(){
    if(!jsonSegArr){
        console.log("ndpv2.js jsonSegArr doesn't exist" );
    }else{
        // populate the finArr object with finish segments according to darts needed.
        // step 1, adding to the zero value array
        for(i0=0; i0<102;i0++){
            let zseg = jsonSegArr[i0];
            // Let's add all zero value segments
            if( zseg.SegMulti == 0 ){ ndpFinArr.m.push(zseg);  }

            // Let's add all Big single segments + single bull.
            if( ( (zseg.SegMulti==1) && (zseg.SegInRad==4) ) || (zseg.SegId=="SBL") ){ ndpFinArr.b.push(zseg);  }

            // Let's add all double segments.
            if( zseg.SegMulti == 2 ){ ndpFinArr.d.push(zseg);  }

            /* 
                Let's add triple segments with a value higher than 20 
                (big segment is preferred for lesser values). 
            */
            if( ( zseg.SegMulti == 3 ) && ( zseg.SegVal > 20 ) ){ ndpFinArr.t.push(zseg); }

        }

        // Let's sort the segment arrays descending (ie 20,19,18 etc. )
        ndpFinArr.b.sort( (a,b)=>{ return b.SegVal-a.SegVal; } )
        ndpFinArr.d.sort( (a,b)=>{ return b.SegVal-a.SegVal; } )
        ndpFinArr.t.sort( (a,b)=>{ return b.SegVal-a.SegVal; } )
        ndpFinArr.m.sort( (a,b)=>{ return b.SegVal-a.SegVal; } )

    }
    console.log("ndpFinArr", ndpFinArr );
}

function makeFinList(){
    // dependig on the finish profile we'll add the possible combinations
    let finSB           = sb();
    let dn              = getDN( finSB );
    let finProf         = scores[finSB].VISITPROFILE;
    let finProfArr      = finProf.split("-");
    let finProfEZ       = scores[finSB].EZVISITPROFILE;
    let finProfEZArr    = finProfEZ.split("-");

    console.log("makeFinList",
                "finSB",    finSB,
                "dn",       dn, 
                "finProf",  finProf, finProfArr,
                "finProfEZ", finProfEZ, finProfEZArr
    ); 

    // avoid running sam loops
    if( finProf==finProfEZ ){
        // both options are equal so only 1 list will be made.
    }else{
        // different options require 2 lists will be made.

    }

    switch(finProfEZ){
        case "D-DNN-DNN":   // 1 darter, double - darts not needed 
                            break;

        case "S-D-DNN":     // 2 darter, single - double - dart not needed 
                            break;

        case "S-S-D":       // 3 darter, single - single - double 
                            break;

        case "SB-S-D":      // 3 darter, bull - single - double
                            break;        

        case "SB-S-DB":     // 3 darter, bull - single - bullseye
                            break;

        case "SB-T-D":      // 3 darter, bull - triple - double
                            break;        

        case "SB-T-DB":     // 3 darter, bull - triple - bullseye
                            break;

        case "S-S-DB":      // 3 darter, single - single - bullseye
                            break;

        case "T-D-DNN":     // 2 darter, triple - double - dart not needed 
                            break;

        case "T-D-D":       // 3 darter, triple - double - double
                            break;                

        case "T-S-D":       // 3 darter, triple - single - double
                            break;

        case "T-S-DB":     // 3 darter, triple - single - bullseye
                            break;

        case "T-T-D":       // 3 darter, triple - triple - double
                            break;

        case "T-T-DB":     // 3 darter, triple - triple - bullseye
                            break;

        case "T-T-S":       // no finish, triple - triple - single
                            break;

        default:    // let's see what we get
                    console.log("unknown profile", finProf, "EZ", finProfEZ );                        
    }

}