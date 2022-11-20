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



/*
	// Pull data from the "Locations" table
	airtableDB(config.airtable.locationTableName).select({
		sort: [
			// Sort by Name in ascending order
			{field: config.airtable.locationNameField, direction: 'asc'}
		]
	}).eachPage(function page(records, fetchNextPage) {
		records.forEach(function(record) {
			// Pull the "Name" column for each location - this will be the lookup key used in the location list
			var locationName = record.get(config.airtable.locationNameField)

			// And add each player to the locationList with the relevant attributes
			locationList[locationName] = {}
			locationList[locationName].recordID = record.getId()

			// Loop over all fields from Airtable, grab the value and shove it into the object
			Object.keys(record.fields).forEach(fieldName => {
				locationList[locationName][fieldName] = record.fields[fieldName]
			});

		});
		// If there are more than 100 results, AirTables paginates the output into multiple chunks
		fetchNextPage();
	}, function done(error) {
		if(error){
			console.log(error);
			popToast('Airtable Error',`${error.error}: ${error.message}`,'red')
		}

		// Refresh the auto-complete fields with the new data
		updateLocationAutocomplete()
	});*/
};





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