/**
 * Cache global variables for fast execution
 */
const ss = SpreadsheetApp;
const sheets = ss.getActiveSpreadsheet();

const main = sheets.getSheetByName(`Main`);
const sites = sheets.getSheetByName(`Sites`);
const roster = sheets.getSheetByName(`Roster`);

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
    const { character_id: characterId } = member;
    // Check if the member ID is already in the set (i.e. it's a duplicate)
    if (memberIds.has(characterId)) {
      return false;
    }
    // If the member is the boss, return false to remove them from the list
    if (characterId === bossId) {
      return false;
    }
    // Otherwise, add the member ID to the set and return true to keep the member
    memberIds.add(characterId);
    return true;
  });

  return filteredMembers;
}

/**
 * A function that writes the character IDs and names to the roster sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to write to.
 * @param {string[][]} list - The list of character IDs and names to write.
 */
function updateRoster(data = [[]]) {
  (() => {
    const authenticatedCharacterNames = getAuthenticatedCharacterNames();
    const array = Array.isArray(authenticatedCharacterNames) ? authenticatedCharacterNames.map(name => [name]) : [[]];

    roster.getRange(2, 4, array.length, 1).setValues(array);
  })();
  // Wrap the array value in square brackets ([]) as needed to make is a 2-dimensional array
  const array = !Array.isArray(data) ? [[data]] : !Array.isArray(data[0]) ? [data] : data;
  // Use destructuring assignment to extract the row count of the array using array.length
  const { length: rows } = array;
  // Use destructuring assignment to extract the column count of the array using array[0].length
  const { length: cols } = array[0];
  if (!rows || !cols) {
    return
  }
  const range = roster.getRange(2, 1, rows, cols);
  range.setValues(data);
}

/**
 * A function that updates the roster sheet with the current fleet member data.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to update.
 * @param {object} swagger - The Swagger object to use for API requests.
 * @returns {number} The number of new fleet members added to the sheet.
 */
function getRosterData() {
  console.time(`Updated the roster sheet in `);

  // Get basic fleet info
  const { fleet_id: fleetId } = getFleetData() ?? {};

  // Get fleet members json
  const fleetMemberData = getFleetMemberData(fleetId) ?? [];

  // Determine fleet boss
  const { character_id: fleetBoss } = fleetMemberData
    .find(member => member.rolename.includes(`(Boss)`));

  // Get saved character IDs from the sheet
  const savedIds = getSavedIds();

  // Add current fleet boss ID to the front of the array of old IDs
  const newIds = [fleetBoss, ...savedIds.filter(id => id != fleetBoss)];

  // Filter out any IDs that are already saved
  const uniqueNewIds = fleetMemberData
    .map(member => {
      const { character_id: characterId } = member;
      return characterId;
    })
    .filter(id => !newIds.includes(id) && id != fleetBoss);

  // Get names for new fleet members
  const newMembers = getNames(uniqueNewIds).map((pilot, index) => {
    const { name } = pilot;
    const characterId = uniqueNewIds[index];
    return { characterId, name };
  });

  // Concat saved data with new data
  const list = [...newMembers, ...savedIds
    .filter(id => !uniqueNewIds.includes(id) && id != fleetBoss)
    .map(characterId => {
      const name = roster.getRange(savedIds.indexOf(characterId) + 1, 2).getValue();

      return [characterId, name];
    })]
    /*
    .map(member => {
      const { characterId, name } = member;
      return [characterId, name];
    });
*/
  // Write the results to the sheet
  updateRoster(list);

  const count = uniqueNewIds.length;
  console.timeEnd(`Updated the roster sheet in `);

  return count;
}

/**
 * 
 */
function loadCurrentFleet() {
  console.time(`Requested the current fleet line-up in `);
  getRosterData();
  const { fleet_id: fleetId } = getFleetData()
    ?? null;
  lib.log(fleetId);
  if (fleetId === null) {
    alert(`Not Authorized!`, `You are not authorized to access that information.`);
    return;
  }
  const response = getCharacterNames(fleetId);
  const code = response.getResponseCode();
  if (code === 401) {
    alert(`Not Authorized!`, `You are not authorized to access that information.`);
    return;
  }
  if (code === 404) {
    alert(`No Fleet`, `You are not in a fleet!`);
    return;
  }
  const [fleetMembers] = (code === 200)
    ? response.filter(member => !member.rolename.includes(`(Boss)`))
    : (() => {
      alert(`Server Error`, `Code ${code}:
      ${response.getContentText()}`, `Error`);
      return null;
    })();
  fleetMembers.length >= 1
    ? fleetMembers.map(member => {
      const { character_id: characterId } = member;
      return characterId;
    })
    : (() => {
      toast(`Error ${namesResponse.getResponseCode()}: ${namesResponse.getContentText()}`, `Error`, 30);
      return null;
    })();
  const namesResponse = getFleetMemberData(membersIds);
  const namesCode = namesResponse.getResponseCode();
  if (namesResponse === null) {
    toast(`Error ${code}: ${namesResponse.getContentText()}`, `Error`, 30);
    return;
  }
  const names = (namesCode === 200)
    ? namesResponse.map(member => {
      const { name } = member;
      return name;
    })
    : (() => {
      toast(`Error ${namesResponse.getResponseCode()}: ${namesResponse.getContentText()}`, `Error`, 30);
      return null;
    })();
  names && roster.getRange(2, 6, 1, names.length).setValues([names]);

  console.timeEnd(`Requested the current fleet line-up in `);
}