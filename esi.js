const domain = `https://esi.evetech.net/latest/`;

/**
 * Returns info on the GESI "Main Character"
 */
function getMainCharacter() {
  const mainCharacter = GESI?.getMainCharacter() || false;

  return mainCharacter ? mainCharacter : new Error(`Main character is not defined! User has not given SSO access to GESI!`)
}

/**
 * Returns info on all authenticated characters
 */
function getAuthenticatedCharacters() {
  const authenticatedCharacters = GESI?.getAuthenticatedCharacters() || false;

  return authenticatedCharacters ? authenticatedCharacters : new Error(`No characters have been authenticated! User has not given SSO access to GESI!`)
}

/**
 * returns names of all authenticated characters
 */
function getAuthenticatedCharacterNames() {
  const authenticatedCharacterNames = GESI?.getAuthenticatedCharacterNames() || false;

  return authenticatedCharacterNames ? authenticatedCharacterNames : new Error(`No characters have been authenticated! User has not given SSO access to GESI!`)
}

/**
 * Returns data on the given character
 */
function getCharacterData(character) {
  const characterData = GESI?.getCharacterData(character) || false;

  return characterData ? characterData : new Error(`getCharacterData() encountered an error: character ${character} not found!;`);
}

/**
 * Returns the fleet ID of the current fleet only if the authenticated character is current fleet boss
 */
function getFleetId() {
  const fc = main.getRange(2, 5, 1, 1).getDisplayValue().slice(4);
  const { character_id: characterId } = getCharacterData(fc) || { character_id: false };
  const path = `characters/${characterId}/fleet/?datasource=tranquility`;
  console.log(JSON.parse(executeGetRequest(`${domain}${path}`)));
  const { fleet_id: fleetId } = characterId ? JSON.parse(executeGetRequest(`${domain}${path}`)) : { fleet_id: false };

  return fleetId;
  //return GESI?.getClient()?.setFunction('characters_character_fleet')?.executeRaw() || new Error(`Must be in a fleet!`);
}

/**
 * Executes a basic get http request
 */
function executeGetRequest(url, options = { method: `get`, muteHttpExceptions: true }) {
  return cacheUrlFetchApp(url, options);
}

/**
 * Resolve a set of IDs to names and categories. Supported ID’s for resolving are: 
 * Characters, Corporations, Alliances, Stations, Solar Systems, Constellations, 
 * Regions, Types and Factions. 
 *  
 * @param {Object} arrTypeIDs An object containing an array of values whose key 
 * is "type_ids" e.g. {ids: [..., type_ids, ...]}
 * 
 * @return {Array} e.g. [..., [groupname, typeid, typename], ...]
 */
function getNames (ids) {
  GESI.getClient()
    .setFunction(`universe_names`)
    .executeRaw({ ids });
}

/** 
 * Requires the following scope: esi-fleets.read_fleet.v1
 * Return information about fleet members
 * 
 * @param {Object} fleet_id An object containing a value whose key is "fleet_id"
 * e.g. {fleet_id: Integer}
 * 
 * @return {Array} e.g [..., [character_id {integer}, join_time {string}, role {string}, 
 * ship_type_id {integer}, solar_system_id {integer}, squad_id	{integer}, 
 * station_id	{integer}, takes_fleet_warp	{boolean}, wing_id {integer}], ...]
 */
function getFleetMembers(fleet_id) {
  GESI.getClient()
    .setFunction(`fleets_fleet_members`)
    .executeRaw({ fleet_id });
}

/**
 * Updates the roster sheet with the current fleet member data.
 * @returns {number} The number of pilots added to the roster sheet.
 */
function getRosterData() {
  console.time(`Updated the roster sheet in `);

  // Read existing data from the roster sheet
  const savedIds = getSavedIds();

  // Get basic fleet info, and if there is no fleet, return 0 for the number of new pilots added
  const fleetInfo = getFleetInfo();
  if (!fleetInfo) {
    console.timeEnd(`Updated the roster sheet in `);
    return 0;
  }

  const { fleet_id, fleetBoss } = fleetInfo;

  // Get the list of members in the fleet
  const fleetMemberData = getFleetMemberData(fleetId);

  // Filter out duplicate and fleet boss character ids
  const newIds = getNewIds(fleetMemberData, savedIds, fleetBoss);

  // Get names for new IDs, either from cache or from the ESI API
  const names = getNames(newIds);

  // Combine saved IDs with new IDs and their corresponding names
  const list = combineIdsAndNames(savedIds, fleetMemberData, newIds, names);

  // Write the results to the sheet
  writeDataToSheet(list);

  const count = list.length - savedIds.length;
  console.timeEnd(`Updated the roster sheet in `);

  return count;
}

/**
 * Retrieves character names from ESI and returns them in an array of objects containing Id and Name.
 *
 * @param {string[]} ids - The character Ids to look up.
 * @returns {Array<{id: number, name: string}>} An array of objects containing Id and Name.
 */
function getCharacterNames(ids) {
  // declare an empty array to hold results
  let pilots = [];
  // Retrieve character names from ESI
  const chunks = chunkArray(ids, 100);
  for (const chunk of chunks) {
    // Get names for current chunk of character Ids
    const namesChunk = getNames(chunk);
    // Append names to the list of names
    pilots = pilots.concat(
      namesChunk.map(pilot => {
        const { id, name } = pilot;
        return { id, name };
      }));

    return pilots;
  }
}

/** 
 * Requires the following scope: esi-fleets.read_fleet.v1
 * Return the fleet ID the character is in, if any.
 * 
 * @return {Integer} The fleet I.D.
 */
/*
const getFleet = () => {
  const { character_id } = GESI.getCharacterData(GESI.getMainCharacter());

  const path = `characters/${character_id}/fleet/?datasource=tranquility`;
  const options = {
    method: `get`,
    muteHttpExceptions: true
  }

  const response = lib.cacheUrlFetchApp(`${domain}${path}`, options);

  const content = response.getContentText();
  const json = JSON.parse(content);
  const code = response.getResponseCode();
  if (code === 404) {
    return new Error(`You are not authorized to access that information.`)
  }

  return response.getResponseCode() == 200 ? json : null;
  //return GESI?.getClient()?.setFunction('characters_character_fleet')?.executeRaw() || new Error(`Must be in a fleet!`);
}
*/

/**
 * Gets the basic information about the fleet, including the fleet ID and the character ID of the fleet boss.
 * @returns {object} An object containing the fleet ID and the fleet boss ID, or null if the character is not in a fleet.
 */
function getFleetInfo() {

  const { fleet_id: fleetId } = () => {
    const { character_id: characterId } = GESI.getCharacterData(GESI.getMainCharacter());

    const path = `characters/${characterId}/fleet/?datasource=tranquility`;
    const options = {
      method: `get`,
      muteHttpExceptions: true
    }

    const response = JSON.parse(cacheUrlFetchApp(domain + path, options));

    return response.code == 200 ? response.content : {};
  }
  if (!fleetId) {
    return null;
  }
  const fleetMemberData = getFleetMembers(fleetId) ?? [];
  const fleetBoss = fleetMemberData.find(member => member.role_name.includes(`(Boss)`))?.character_id;
  return { fleetId, fleetBoss };
}

/**
 * Gets the list of members in the current fleet.
 * @param {string} fleetId The ID of the fleet to retrieve the member list for.
 * @returns {object[]} The list of fleet members, each represented as an object with a character ID and a role name.
 */
/*
function getFleetMemberData(fleetId) {
  // https://esi.evetech.net/latest/fleets/123456/?datasource=tranquility
  const fleetMemberData = swagger.fleets.fleet.members(fleetId) ?? [];
  return fleetMemberData;
}
*/