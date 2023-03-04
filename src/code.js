const domain = `https://esi.evetech.net/latest/`;

function fetch(url, params) {
  return UrlFetchApp.fetch(url, params);
}

swagger = {

  /**
   *
   */
  search: (search, categories, strict) => {
    /**
     * agent, alliance, character, constellation, corporation, faction, inventory_type, region, solar_system, station, structure
     *
     * https://esi.evetech.net/latest/characters/2114764809/search/
     * ?categories=character
     * &datasource=tranquility
     * &language=en
     * &search=andrew%20amason
     * &strict=false
     *
     */
    return GESI.getClient().setFunction('characters_character_search').executeRaw({ search, categories, strict })
  },

  /**
   *
   */
  characters: {
    character: {
      /**
       * swagger.characters.character.fleet
       *
       * Requires the following scope: esi-fleets.readfleet.v1
       * Return the fleet ID the character is in, if any.
       *
       * @return {Integer} The fleet I.D.
       */
      fleet: () => {
/*
        const { character_id } = GESI.getCharacterData(GESI.getMainCharacter());
        console.log(character_id);
        const path = `characters/${character_id}/fleet/?datasource=tranquility`;
        const options = {
          method: `get`,
          muteHttpExceptions: true
        }
        console.log(domain + path);
        const response = fetch(domain + path, options);
        console.log(response);
        const content = response.getContentText();
        console.log(content);
        const json = JSON.parse(content);
        console.log(json);
        const code = response.getResponseCode();
        if (code === 404) {
          return new Error(`You are not authorized to access that information.`);
        }

        return response.getResponseCode() == 200 ? json : null;
*/
        const client = GESI.getClient().setFunction('characters_character_fleet')
        //console.log(client);
        const result = client.executeRaw() || new Error(`Must be in a fleet!`);
        //console.log(result);
        return result;
      }
    }
  },

  /**
   *
   */
  universe: {
    /**
     * swagger.universe.names
     *
     * Resolve a set of IDs to names and categories. Supported ID’s for resolving are:
     * Characters, Corporations, Alliances, Stations, Solar Systems, Constellations,
     * Regions, Types and Factions.
     *
     * @param {Object} arrTypeIDs An object containing an array of values whose key
     * is "typeIds" e.g. {ids: [..., typeIds, ...]}
     *
     * @return {Array} e.g. [..., [groupname, typeid, typename], ...]
     */
    names: ids => GESI
      .getClient()
      .setFunction(`universe_names`)
      .executeRaw({ ids })
  },

  /**
   *
   */
  fleets: {
    fleet: {
      /**
       * swagger.fleets.fleet.members
       *
       * Requires the following scope: esi-fleets.readfleet.v1
       * Return information about fleet members
       *
       * @param {Object} fleet_id An object containing a value whose key is "fleetId"
       * e.g. {fleetId: Integer}
       *
       * @return {Array} e.g [..., [characterId {integer}, joinTime {string}, role {string},
       * shipTypeId {integer}, solarSystemId {integer}, squadId	{integer},
       * stationId	{integer}, takesFleetWarp	{boolean}, wingId {integer}], ...]
       */
      members: (fleet_id) => {
        return GESI
        .getClient()
        .setFunction(`fleets_fleet_members`)
        .executeRaw({ fleet_id })
      }
    }
  }
}

/**
 * Updates the roster sheet with the current fleet member data.
 * @returns {number} The number of pilots added to the roster sheet.
 */
function updateRoster() {
  console.time(`Updated the roster sheet in `);

  // Read existing data from the roster sheet
  const savedIds = getSavedIdsFromSheet();

  // Get basic fleet info, and if there is no fleet, return 0 for the number of new pilots added
  const fleetInfo = getFleetInfo();

  if (!fleetInfo) {
    console.timeEnd(`Updated the roster sheet in `);
    return 0;
  }

  const { fleetId, fleetBoss } = fleetInfo;

  // Get the list of members in the fleet
  const fleetMemberData = getFleetMemberData(fleetId).map(member => member.character_id);

  // Filter out duplicate and fleet boss character ids
  const newIds = getNewIds(fleetMemberData, savedIds, fleetBoss);

  // Get names for new IDs, either from cache or from the ESI API
  const names = swagger.universe.names(newIds);

  // Combine saved IDs with new IDs and their corresponding names
  const list = combineIdsAndNames(savedIds, fleetMemberData, newIds, names);

  // Write the results to the sheet
  writeDataToSheet(list);

  const count = list.length - savedIds.length;
  console.timeEnd(`Updated the roster sheet in `);

  return count;
}


/**
 * Gets the basic information about the fleet, including the fleet ID and the character ID of the fleet boss.
 * @returns {object} An object containing the fleet ID and the fleet boss ID, or null if the character is not in a fleet.
 */
function getFleetInfo() {

  const { fleet_id: fleetId } = swagger.characters.character.fleet();
  console.log(fleetId);

  const fleetMemberData = swagger.fleets.fleet.members(fleetId);
  const fleetBoss = fleetMemberData.find(member => member.role_name.includes(`(Boss)`)).character_id;
  return { fleetId, fleetBoss };
}

/**
 * Gets the list of members in the current fleet.
 * @param {string} fleetId The ID of the fleet to retrieve the member list for.
 * @returns {object[]} The list of fleet members, each represented as an object with a character ID and a role name.
 */
function getFleetMemberData(fleetId) {
  // https://esi.evetech.net/latest/fleets/123456/?datasource=tranquility
  const fleetMemberData = swagger.fleets.fleet.members(fleetId) ?? [];
  return fleetMemberData;
}

/**
 * Filters out character IDs that are already saved to the roster and the character ID of the fleet boss.
 * @param {object[]} members The list of members in the current fleet.
 * @param {string} bossId The character ID of the fleet boss.
 * @returns {string[]} The list of character IDs that are not already saved to the roster and are
 */
function filterFleetMembers(members, bossId) {
  // Create a set of member IDs to check for duplicates
  const memberIds = new Set();

  // Filter the members to remove duplicates and the boss
  const filteredMembers = members.filter(member => {
    // Check if the member ID is already in the set (i.e. it's a duplicate)
    if (memberIds.has(member.characterId)) {
      return false;
    }
    // If the member is the boss, return false to remove them from the list
    if (member.characterId === bossId) {
      return false;
    }
    // Otherwise, add the member ID to the set and return true to keep the member
    memberIds.add(member.characterId);
    return true;
  });

  return filteredMembers;
}

/**
 * Retrieves character names from ESI and returns them in an array of objects containing Id and Name.
 *
 * @param {string[]} ids - The character Ids to look up.
 * @returns {Array<{id: number, name: string}>} An array of objects containing Id and Name.
 */
function getCharacterNames(ids) {
  // Retrieve character names from ESI
  const chunks = chunkArray(ids, 100);
  let names = [];

  for (const chunk of chunks) {
    // Get names for current chunk of character Ids
    const namesChunk = swagger.universe.names(chunk);

    // Append names to the list of names
    names = names.concat(
      namesChunk.map(nameObj => ({
        id: nameObj.id,
        name: nameObj.name,
      }))
    );
  }

  return names;
}

function loadCurrentFleet() {
  console.time(`Requested the current fleet line-up in `);
  updateRoster();
  const { fleet_id: fleetId } = swagger.characters.character.fleet() ?? null;
  if (fleetId === null) {
    alert(`Not Authorized!`, `You are not authorized to access that information.`);
    return;
  }
  const response = swagger.fleets.fleet.members(fleetId);
  const fleetMembers = response.filter(member => !member.role_name.includes(`(Boss)`));

  const memberIds = fleetMembers.map(member => member.character_id);
  const namesResponse = swagger.universe.names(memberIds);
  const names = namesResponse.map(member => member.name)
  console.log(names);
  names && utility.setValues({ sheet: main, row: 2, col: 6, rows: 1, cols: names.length }, [names]);
  console.timeEnd(`Requested the current fleet line-up in `);
}