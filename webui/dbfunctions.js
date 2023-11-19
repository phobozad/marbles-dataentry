const sqlApiBasePath = `/api`


// locationList holds cache of maps pulled from the Database
var locationList = {}

// loadLocations updates the cache of maps names from the Database
var loadLocations = function() {	
	locationList = {}

	// Pull data from MySQL database map table via SQL bridge API
	jQuery.get(sqlApiBasePath + '/maps')
		.done(function(apiDataRes){
			apiDataRes.forEach(function(record){
				var locationName = record['mapName']

				// Add map locationList with the relevant attributes
				locationList[locationName] = {}
				locationList[locationName].recordID = record['mapID']
			})

			// Refresh the auto-complete fields with the new data
			updateLocationAutocomplete()
		})
		.fail(function(jqXHR, textStatus){
			console.log(jqXHR);
			console.log(textStatus);
			//popToast('Airtable Error',`${error.error}: ${error.message}`,'red')
		});

};


// Since we need to wait for some data processing, this function gets called later to add player rank info to the announcer output
function addPlayerRank(){
	// Run though rank for Top 3 players
	for(var i=1; i<=3; i++){
		var playerName = $(`#player${i}`).val()


		// Lookup player in the leaderboard
		// Pull data from MySQL database map table via SQL bridge API
		jQuery.get(sqlApiBasePath + `/player/name/${playerName}/rank`)
			.done(function(apiDataRes){
				var rank = apiDataRes['Rank']
				var copyText = ''

				copyText += ` They're now ranked <b>${rank}${ordinal(rank)}</b>.`
				// Append text right after current blurb
				$(`#announcerCopyplayer${i}Rank`).empty();
				$(`#announcerCopyplayer${i}Rank`).append(copyText);

				// Animate the text to indicate it was updated
				$(`#announcerCopyplayer${i}Rank`)
					.fadeTo('slow',0.25)
					.fadeTo('fast',1.0);
			})
			.fail(function(jqXHR, textStatus){
				console.log(jqXHR);
				console.log(textStatus);
				//popToast('Database Read Error',`${error.error}: ${error.message}`,'red')
			});
	}
	popToast('Rank Data Updated','Player rank data updated','green')
}


async function getPlayerRecordID(playerName){
	// Map player name to record ID. "false" if not found
	var playerID = false
	
	// Pull data from MySQL database map table via SQL bridge API
	await jQuery.get(sqlApiBasePath + `/player/name/${playerName}`)
		.done(function(apiDataRes){
			playerID = apiDataRes['PlayerID']
			
		})
		.fail(function(jqXHR, textStatus){

			if (jqXHR.status = 404){
				console.error(`Player ${playerName} not found in database`)
				popToast('Not Found',`Player ${playerName} not found in database`,'red')
			}
			else{
				console.error(jqXHR.responseJSON.errorFull);
				popToast('Database Read Error', jqXHR.responseJSON.errorFull, 'red')
			}
			
			console.log(jqXHR);
			console.log(textStatus);

			
		});
	
	return playerID
}


function calcNthPlaceFinishesTonight(playerName, nthPlace) {
	// Use the appropriate field name based on which place we're looking at (1st, 2nd, 3rd, etc)
	var fieldName = config.airtable.raceFieldNamePlace[nthPlace]

	var resultCount = 0

	// /stats/current/nthPlaceFinishes/:nthPlace/:playerID

	jQuery.get(sqlApiBasePath + `/player/name/${playerName}`)
		.done(function(apiDataRes){
			playerID = apiDataRes['PlayerID']
			
		})
		.fail(function(jqXHR, textStatus){

			if (jqXHR.status = 404){
				console.error(`Player ${playerName} not found in database`)
				popToast('Not Found',`Player ${playerName} not found in database`,'red')
			}
			else{
				console.error(jqXHR.responseJSON.errorFull);
				popToast('Database Read Error', jqXHR.responseJSON.errorFull, 'red')
			}
			
			console.log(jqXHR);
			console.log(textStatus);
		});

	// Loop over all races and check for the playerID in the results
	Object.keys(raceList).forEach(race => {
		// If the player ID matches the race result field, increment the counter
		if(raceList[race][fieldName] == playerName){
			resultCount++;
		}

	});

	return resultCount;
}


async function saveRaceStat(statType, statValue){
	var raceID = checkRaceExists($('#raceInput').val())

	if (statType == "dogfight"){
		var statFieldName = config.airtable.statDogfightFieldName
	}
	else if (statType == "stuck"){
		var statFieldName = config.airtable.statStuckFieldName
	}
	
	console.log(`Stat: ${statFieldName}  Value+/-: ${statValue}  Race: ${raceID}`)

	// Make sure we have a Race ID to reference in the record
	if(raceID===false){
		console.error("Race Record not found.  Create race first.")
		popToast('Race Not Created Yet','Race Record not found.  Create race first.','red')
	}
	else{
		// We have a Race ID.  Check if we have an existing entry in the stats table for this race
		var statData={}
		statData[statFieldName] = statValue

		// For filtering by Race, we need to filter based on the RaceID value and not record ID b/c Airtables is dumb that way
		// But as a workaround we put in a "record_id" formula field in races and include that as a linked field in the stats table
		// Pull data from the stats table for this race
		var records = await airtableDB(config.airtable.statTableName).select({
			filterByFormula: `{${config.airtable.statRaceRecordLookupFieldName}}="${raceID}"`
			}).all().catch(error => {
				console.error(error)
				popToast('Airtable Error',`${error.error}: ${error.message}`,'red')
		})



		// If we have an existing entry, update it
		if(records.length > 0){
			// There may be multiple rows - iterate over all of them
			var recordID = ""
			records.forEach(function(record){
				// Calulcate total dogfights/stucks already recorded for this race.  This should even work with multiple records for same race (it will SUM them)
				// The total will be 1 higher than current since we already added our new dogfight/stuck above

				// Need to ignore any non-numeric values (blank, NaN, etc)
				if(Number.isInteger(record.get(statFieldName))){
					statData[statFieldName] += record.get(statFieldName)
				}

				// Whatever our last row is, that is the one that will be updated so save the last record ID for this row
				recordID=record.id
				lastRowValue=record.get(statFieldName)
				// Handle case where last row has the value undefined.  Treat as Zero value
				if (!Number.isInteger(lastRowValue)){
					lastRowValue=0
				}
			})


			console.log("Updating existing dogfight/stuck record...")
			console.log(`New Value: ${statFieldName} = ${statData[statFieldName]}`)
			// If we have multiple records, we should only modify the value relative to the last record pulled - otherwise we will double-count
			updateStatRecord(statFieldName,recordID,lastRowValue+statValue)
		}
		// If not, create it from scratch
		else{
			console.log("Creating new dogfight/stuck record...")
			insertStatRecord(statFieldName,raceID,statValue)
		}

	}
}