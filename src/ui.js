const ss = SpreadsheetApp;
const sheets = ss.getActiveSpreadsheet();

const main = sheets.getSheetByName(`Main`);
const sites = sheets.getSheetByName(`Sites`);
const roster = sheets.getSheetByName(`Roster`);

const ui = ss.getUi();

const stylesheet = `
  * {
    box-sizing: border-box;
  }
  body {
    margin: 3px;
    padding: 3px
    max-width: 99%;
    height: 100%;
    overflow: auto;
    background-color: rgba(242, 242, 242, .7);
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.4;
  }
  .logo {
    position: absolute;
    top: -110px;
    font-size: 110px;
  }
  header {
    padding: 3px;
    min-height: 30px;
    max-height: 140px;
    background-color: rgba(18, 18, 18, 1);
    color: #fde9ff;
    text-align: center;
    box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2);
  }
  header h1 {
    color: #fde9ff;
    //position: relative;
    font-weight: 700;
    text-transform: uppercase;
    font-size: clamp(3vw, 6vw, 8vw);
    line-height: 0.8em;
    //bottom: 0px;
  }
  header h2 {
    font-weight: 300;
    font-size: 14;
    position: relative;
  }
  header h3 {
    font-weight: 200;
    font-size: 10;
    position: relative;
    bottom: 25px;
  }
  section {
    padding: 5px;
    margin: 5px;
    margin-top: 2px;
    padding-top: 2px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  }
  main {
    height: 100%;
    background-color: rgba(255, 255, 255, 1);
  }
  form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  label {
    flex: 1 0 120px;
  }
  input[type="text"] {
    flex: 1 0 200px;
    padding: 5px;
    font-size: 1rem;
  }
  button[type="button"] {
    background-color: #333;
    color: #fff;
    border: none;
    padding: 10px 20px;
    margin-left: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  button[type="button"]:hover {
    background-color: #666;
  }
  #result {
    margin-top: 20px;
    font-size: 1.2rem;
  }
  details summary {
    cursor: pointer;
  }
  details summary>* {
    display: inline;
  }
  button {
    background-color: blue;
  }
  label {
    font-weight: bold;
  }
  footer {
    text-align: center;
  }
  #sidebar-value-block, #dialog-elements {
    width: auto;
    margin: 10px;
    padding: 10px;
    background-color: #eee;
    border-color: #eee;
    border-width: 0px;
    border-style: solid;
  }
  #sidebar-button-bar, #dialog-button-bar {
    bottom: 10px;
    padding: 10px;
    margin: 10px;
  }
  .add-pilot-title {
    margin: 5px;
    font-size: 16px;
    color: purple;
  }
`;

/**
 *
 */
function onOpen(e) {
  ui.createMenu(`⚖️ Wormhole Loot-O-Meter`)
    .addSubMenu(
      ui.createMenu(`📋 Roster management`)
        .addItem(`➕ Add a pilot manually`, `manualAddPilot`)
        .addSeparator()
        .addItem(`📡 Update pilot roster`, `updateRoster`)
    )
    .addSubMenu(
      ui.createMenu(`🎛️ Sheet utility`)
        .addItem(`🗞 Collapse all groups`, `utility.collapseAllGroups`)
        //.addItem(`onOpen`, `onOpen`)
        .addSeparator()
        .addItem(`🧱 Load current fleet`, `loadCurrentFleet`)
        .addSeparator()
        .addItem(`🔲 Clear inputs`, `userExecutedClearInputs`)
        .addItem(`💣 Clear inputs and pilots`, `userExecutedClearSheet`)
    )
    .addSeparator()
    .addItem(`❓ How to use`, `helpDialog`)
    .addToUi();
}

/**
 *
 */
function onEdit(e = {}) {

  const { range } = e ?? null;

  const col = range ? range.getColumn() : 0;
  const row = range ? range.getRow() : 0;

  const cell = main.getRange(row, col);
  const value = cell.getValue();

  if (row === 2) {
    if (col < 6 || col > 25) {
      return
    }
    if (col == 10 || col == 15 || col == 20) {
      const group = main.getColumnGroup(col, 1);
      value != `` ? group.expand() : group.collapse();
    }
    const clearColumn = [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0],
    [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0],
    [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0], [0]];
    const validNames = roster.getRange(`C1:C`);
    const rule = ss.newDataValidation().requireValueInRange(validNames, true).build()
    value != `` ? cell.clearDataValidations() : cell.setDataValidation(rule);

    value == `` && utility.setValues({ sheet: main, row: 5, col, rows: 40, cols: 1 }).setValues(clearColumn);
  }
  if (col === 3) {
    if (row < 5 || row > 45) {
      return
    }
    if (row == 11 || row == 18 || row == 25 || row == 32 || row == 39) {
      const group = main.getRowGroup(row, 1);
      value != `` ? group.expand() : group.collapse();
    }
    const siteName = utility.getDisplayValues({ sheet: main, row, col, rows: 1, cols: 1 });
    //const drifterSiteRange = sites.getRange(1, 1, 48, 4)
    const drifterSiteList = utility.getDisplayValues({ sheet: sites, row, col, rows: 48, cols: 4 })
      .filter(siteData => siteData[3] == 1);
    const mappedSiteList = drifterSiteList.map(row => row[1]);
    const hasDrifter = mappedSiteList.includes(siteName);

    hasDrifter && toast(`There is an optional Drifter Response Battleship at a(n) ${siteName}!`);
    if (row == 5) {
      const [playerNames] = utility.getDisplayValues({ sheet: main, row: 2, col: 5, rows: 1, cols: 19 });
      const newValues = [playerNames.map(name => name ? 1 : 0)].reduce((a, b) => [a, b]);
      utility.setValues({ sheet: main, row: 5, col: 5, rows: 1, cols: 19 }, [newValues]);
    } else {

      const previousValues = utility.getDisplayValues({ sheet: main, row: row - 1, col: 5, rows: 1, cols: 19 })[0];
      utility.setValues({ sheet: main, row, col: 5, rows: 1, cols: 19 }, [previousValues]);
    }

    if (hasDrifter) {
      const rule = ss.newDataValidation().requireCheckbox(1).build();
      const drifterCell = sheets.getActiveSheet().getRange(row, 4);
      drifterCell.setDataValidation(rule);
      drifterCell.setFontColor(`black`);
    }
  }
  //toast(`row: ${row}, column ${col}`, `not target range`, 30);
  return;
}

/**
 *
 */
const utility = {

  /**
 * A function that writes the character IDs and names to the roster sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to write to.
 * @param {string[][]} list - The list of character IDs and names to write.
 */
  writeToSheet: (sheet, data = [[]]) => {

    /*
      if (!Array.isArray(data)) {
        data = [data];
      }
      if (!Array.isArray(data[0])) {
        data = [data];
      }
    */
    const array = !Array.isArray(data) ? [[data]] : !Array.isArray(data[0]) ? [data] : data;

    const { length: rows } = array;
    const { length: columns } = array[0];

    const range = sheet.getRange(1, 1, rows, columns);
    utility.setValues({ sheet, row: 1, col: 1, rowa, cols }, data);
  },

  /**
   *
   */
  clearInputs: () => {
    console.time(`Executed clearInputs() in`);
    utility.clearRange({ sheet: main, row: 5, col: 3, rows: 41, cols: 21 });
    main.getRange(5, 4, 40).clearDataValidations().removeCheckboxes().clearContent().setFontColor(`white`);
    utility.collapseAllGroups();
    console.timeEnd(`Executed clearInputs() in`);
  },

  /**
   *
   */
  clearPilots: () => {
    console.time(`Executed clearPilots() in`)
    utility.clearRange({ sheet: main, row: 2, col: 6, rows: 1, cols: 20 });
    console.timeEnd(`Executed clearPilots() in`)
  },

  /**
   *
   */
  clearSheet: () => {
    console.time(`Executed clearSheet() in`);
    utility.clearInputs();
    utility.clearPilots();
    utility.collapseAllGroups();
    console.timeEnd(`Executed clearSheet() in`);
  },

  /**
   *
   */
  collapseAllGroups: () => {
    utility.collapseAllRowGroups();
    utility.collapseAllColumnGroups();
  },

  /**
   *
   */
  collapseAllColumnGroups: () => {
    main.collapseAllColumnGroups();
  },

  /**
   *
   */
  collapseAllRowGroups: () => {
    main.collapseAllRowGroups();
  },

  /**
   *
   */
  clearRange: ({ sheet, row, col, rows, cols }) => {
    sheet.getRange(row, col, rows, cols).clearContent();
  },

  /**
   *
   */
  actionCanceled: () => {
    return utility.toast(`Spreadsheet was not changed`, `Action canceled`, 30);
  },

  /**
   *
   */
  toast: (message, title, time) => {
    sheets.toast(message, title, time);
  },

  /**
   *
   */
  setValues: ({ sheet, row, col, rows, cols }, values) => {
    sheet.getRange(row, col, rows, cols).setValues(values);
    return sheet;
  },

  /**
   *
   */
  alert: (title, prompt, buttons = `OK`) => {
    const buttonSet = buttons == `YES_NO` ? ui.ButtonSet.YES_NO : ui.ButtonSet.OK;
    return ui.alert(title, prompt, buttonSet);
  },

  /**
   *
   */
  getDisplayValues: ({ sheet, row, col, rows, cols }) => {
    return sheet.getRange(row, col, rows, cols).getDisplayValues();
  }
}

/**
 *
 */
function updateRosterToast(updateCount) {
  utility.toast(`Roster update was succesful. ${updateCount} new pilots were added to the roster.`, `Roster Update Success`, 30);
}

/**
 *
 */
function userExecutedUpdateRoster() {
  updateRosterToast(updateRoster());
}

/**
 *
 */
function userExecutedClearInputs() {
  const response = utility.alert(`Warning`, `
    This action will reset all check boxes.

    Do you wish to continue?
  `, ui.ButtonSet.YES_NO);
  console.time(`Unchecked all the boxes and cleared the list of sites in `);
  if (response !== ui.Button.YES) {
    return utility.actionCanceled();
  }

  utility.clearInputs();
}

/**
 *
 */
function userExecutedClearSheet() {
  const response = utility.alert(`Warning`, `
    This action will reset all checkboxes and current pilot lineup.

    Do you wish to continue?
  `, ui.ButtonSet.YES_NO);
  console.time(`Unchecked all the boxes and cleared the list of sites in `);
  if (response !== ui.Button.YES) {
    return utility.actionCanceled();
  }
  utility.clearSheet();
}

/** Start of test code */

function getCharacterId(characterName) {
  var url = 'https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en';
  var payload = {
    'names': [
      characterName
    ]
  };
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  var characterId = data.characters[0].id;
  return characterId;
}

function getCharacterPortrait(characterId) {
  var url = 'https://esi.evetech.net/latest/characters/' + characterId + '/portrait/?datasource=tranquility';
  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());
  var portraitUrl = data.px128x128;
  return portraitUrl;
}

function confirmCharacter(characterName) {
  var characterId = getCharacterId(characterName);
  var portraitUrl = getCharacterPortrait(characterId);
  var html = HtmlService.createTemplateFromFile('Confirm')
    .evaluate()
    .setWidth(300)
    .setHeight(300);
  html.characterName = characterName;
  html.portraitUrl = portraitUrl;
  SpreadsheetApp.getUi().showModalDialog(html, 'Confirm Character');
}

function processForm(form) {
  var characterName = form.characterName;
  confirmCharacter(characterName);
}

/** End of test Code */

/**
 *
 */
function manualAddPilot() {
  const title = `Manually Add A Pilot`;
  const source = () => {
    const javascript = `
     function submitForm() {
        var form = document.getElementById("myForm");
        google.script.run.withSuccessHandler(processForm).processForm(form);
      }

      function processForm(data) {
        document.getElementById("myForm").reset();
      }
  `;
    return `
    <!DOCTYPE html>
    <html id="sidebar">
      <head>
        <base target="top">

        <title>Add Pilot Sidebar</title>

        <link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons.css">
        <style>

          ${stylesheet}

        </style>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

      </head>
      <body>
        <!-- Below is the HTML code that defines the sidebar element structure. -->
        <header>
          <h1>Pilot Search</h1>
        </header>
        <hr>
        <main>
          <p>Type a pilot's name into the box below and click the "Search" button to begin the process.</p>

          <form id="myForm">
            <label for="characterName">Search:</label><br>
            <input type="text" id="characterName" name="characterName" placeholder="Enter character name:"><br>
            <input type="button" value="Search" onclick="submitForm()">
          </form>

          <div id="result-container">
            <!-- Results will be displayed here -->
          </div>

        </main>
        <!-- Enter sidebar bottom-branding below. -->
        <hr>
        <footer>
          <span>
            Made with ✨ by <a target="blank" href="https://github.com/PhobiaCide">PhobiaCide</a>.
          </span>
        </footer>
        <script>

          ${javascript}

        </script>
      </body>
    </html>
  `;
  }
  const sidebar = HtmlService.createTemplate(source())
    .evaluate()
    .setTitle(title)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  ui.showSidebar(sidebar);
}

/**
 *
 */
function helpDialog() {
  const dialogTitle = `🦀 Wormhole Loot-O-Meter Help`;

  const helpDialogSource = `
  <!DOCTYPE html>
  <html>
  <head>
    <base target="top">

    <title>${dialogTitle}</title>

    <meta sharset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>

    ${stylesheet}

    </style>
  </head>
  <body>
      <header class="info">
        <p class="logo">🦀</p>
        <h2>How To Use</h2>
        <h1> Wormhole<br>Loot-O-Meter</h1>
        <h3>Version: 2.0.0</h3>
      </header>
      <hr>
      <main>
        <section>
          <h2>Before You Begin:</h2>
          <ul>
            <li>
              You must have
              <a href="https://workspace.google.com/u/0/marketplace/app/gesi/747777332185" target="blank" rel="noopener noreferrer">
                GESI
              </a>
              installed.
            </li>
            <li>
              You must be logged in to GESI with at least one Eve Online account.
            </li>
            <li>
              The character that is logged in to GESI must be the fleet boss of an active fleet in game.
            </li>
          </ul>
        </section>
        <hr>
        <section>
          <h2>Instructions:</h2>
          <ol>
            <li>
              Click "Help"
            </li>
            <li>
              Give the script permission to run
            </li>
            <li>
              Refresh the page
            </li>
            <li>
              Navigate to <i>⚖️ Wormhole Loot-O-Meter &gt;&gt; 📋 Roster Management &gt;&gt; 📡 Update Roster</i> and allow the script to run.
            </li>
            <li>
              Select the wormhole class from the drop-down menu at the top.
            </li>
            <li>
              Select a site from the drop-down menu. The sites will be limited to only sites of the selected class.
            </li>
            <li>
              In the same row as the site, check the box under each of the participants. If a site was selected that has an optional <i>drifter battleship</i>, a box will appear on the same row but in the "Drifter" column. Checking this box will include those drops as well.
            </li>
            <li>
              Run the site.
            </li>
            <li>
              The Wormhole Loot-O-Meter will track each pilot's share.
            </li>
          </ol>
        </section>
      </main>
      <hr>
      <footer>
        <span>
          Made with ✨ by <a target="blank" href="https://github.com/PhobiaCide">PhobiaCide</a>.
        </span>
      </footer>
    </body>
  </html>
`
  const html = HtmlService.createHtmlOutput(helpDialogSource)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  const blob = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(800)
    .setTitle(dialogTitle)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  sheets.show(blob);
}

/**
 * A function that reads the saved character IDs from the roster sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to read from.
 * @return {string[]} An array of saved character IDs.
 */
function readFromSheet(sheet) {
  const row = 1;
  const rows = lastRow(sheet) - row;
  const values = utility.getDisplayValues({ sheet, row, col: 1, rows, cols: 1 });
  const map = values.map(member => member[0]);

  return rows > 0 ? map : [];

}

function lastRow(sheet) {
  return sheet.getLastRow()
}

/**
 * Reads the existing list of character IDs from the roster sheet.
 * @returns {string[]} The list of character IDs.
 */
function getSavedIdsFromSheet() {
  const sheet = roster;
  const rows = sheet.getLastRow();
  if (rows === 0) {
    return [];
  }
  const savedIds = utility.getDisplayValues({ sheet, row: 1, col: 1, rows, cols: 1 })
    .flat()
    .filter(id => id.trim() !== '');
  return savedIds;
}

/**
 *
 */
function doGet() {
  const result = HtmlService.createHtmlOutput(manualAddPilotSource()).getContent().toString();
  console.log(typeof result);
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
}