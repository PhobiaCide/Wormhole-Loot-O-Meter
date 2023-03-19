const config = {
  clearRow: Array(19).fill([0]),
  colGroups: [10, 15, 20],
  rowGroups: [11, 18, 25, 32, 39],
  playerNames: main.getRange(`E2:W2`),
  playerList: {
    row: 2,
    startCol: 5,
    endCol: 23,
    clearColumn: Array(40).fill([0])
  },
  dataValidation: {
    pilotSelectionRange: roster.getRange(`C2:C`),
    authenticatedNamesRange: roster.getRange(`D2:D`)
  },
  siteList: {
    col: 3,
    startRow: 5,
    endRow: 45,
    drifterSiteList: sites
      .getRange(2, 1, 48, 4)
      .getDisplayValues()
      .filter(siteData => siteData[3])
      .map(row => row[1])
  },
  checkboxArea: {
    startRow: 5,
    startCol: 4,
    endRow: 45,
    endCol: 19
  },
  fontColorDark: main.getRange(`A1`).getFontColorObject(),
  fontColorLight: main.getRange(`B3`).getFontColorObject(),
  drifterToast: {
    title: ``,
    message: ``
  }
};

function test() {
  console.log(config.fontColorDark.asRgbColor().asHexString());
  console.log(config.fontColorLight.asRgbColor().asHexString());
}

function onEdit(e) {

  const range = e?.range;
  if (!range) return;

  const col = range?.getColumn();
  const row = range?.getRow();

  const cols = range?.getLastColumn();
  const rows = range?.getLastRow();

  const isWithinPlayerNameRange = row == config.playerList.startRow
    && column >= config.playerList.startCol
    && column <= config.playerList.endCol;

  const isWithinSiteListRange = col == config.siteList.startCol
    && row >= config.siteList.startRow
    && row <= config.siteList.endRow;

  if (!isWithinPlayerNameRange && !isWithinSiteListRange) return;

  const cell = main?.getRange(row, column);
  const value = cell?.getValue();

  if (isWithinPlayerNameRange) {
    if (config.colGroups.includes(col)) {
      const group = main.getColumnGroup(col, 1);
      value
        ? group.expand()
        : group.collapse();
    }
    const selectionRange = (col == config.playerList.startCol)
      ? roster.getRange(config.playerList.dataValidation.authenticatedNamesRange)
      : roster.getRange(config.playerList.dataValidation.pilotSelectionRange);
    const rule = ss.newDataValidation().requireValueInRange(selectionRange, true).build();
    value
      ? cell.clearDataValidations()
      : cell.setDataValidation(rule);
    !value && main
      .getRange(config.siteList.startRow, col, config.siteList.endRow, 1)
      .setValues(config.playerList.clearColumn);
  } else if (isWithinSiteListRange) {
    if (config.rowGroups.includes(row)) {
      const group = main.getRowGroup(row, 1);
      value
        ? group.expand()
        : group.collapse();
    }
    const siteName = main.getRange(row, col).getDisplayValue().toString();
    const hasDrifter = config.input.siteList.drifterSiteList.includes(siteName);
    if (row == 5) {
      const [playerNames] = config.input.playerNames.getDisplayValues();
      const newValues = [playerNames.map(name => name ? 1 : 0)].reduce((a, b) => [a, b]);
      main.getRange(row, config.input.checkboxArea.startCol, 1, 19).setValues([newValues]);
    } else if (row > 5) {
      const previousValues = main.getRange(`E${row - 1}:W${row - 1}`).getDisplayValues();
      main.getRange(`E${row}:W${row}`).setValues(previousValues);
    }
    if (hasDrifter) {
      const article = (siteName === `Oruze Osobnyk`) ? an : a;
      toast(`There is an optional Drifter Response Battleship at ${article} ${siteName}!`, `Drifter Response Battleship`, 30);
      const rule = ss.newDataValidation().requireCheckbox(1).build();
      const drifterCell = main.getRange(row, 4);
      drifterCell.setDataValidation(rule);
      drifterCell.setFontColor(config.output.fontColor);
    }

    return;
  }
}

const stylesheet = `
  * {
    box-sizing: border-box;
  }
  html {
    box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  }
  body {
    margin: 3px;
    padding-top: 140px;
    padding-bottom: 20px;
    max-width: 100%;
    height: 100%;
    overflow: auto;
    background-color: ${config.fontColorLight.asRgbColor().asHexString()};
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
    position: fixed; 
    top: 0;
    left: 0;
    right: 0;
    border-radius: .5em .5em 0 0;
    padding: 3px;
    min-height: 30px;
    max-height: 140px;
    background-color: ${config.fontColorDark.asRgbColor().asHexString()};
    color: ${config.fontColorLight.asRgbColor().asHexString()};
    text-align: center;
    z-index: 10;
  }
  header h1 {
    font-weight: 700;
    text-transform: uppercase;
    font-size: clamp(3vw, 6vw, 8vw);
    line-height: 0.8em;
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
    border-left: 12px solid;
    border-color: ${config.fontColorDark.asRgbColor().asHexString()};
    padding: 5px;
    margin: 5px;
    margin-top: 2px;
    padding-top: 2px;
  }
  main {
    height: 100%;
    background-color: ${config.fontColorLight.asRgbColor().asHexString()};
    z-index: 1;
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
    background-color: ${config.fontColorDark.asRgbColor().asHexString()};
    color: ${config.fontColorLight.asRgbColor().asHexString()};
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
  //button {
  //  background-color: blue;
  //}
  label {
    font-weight: bold;
  }
  footer {
    position: fixed; 
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${config.fontColorDark.asRgbColor().asHexString()};
    color: ${config.fontColorLight.asRgbColor().asHexString()};
    text-align: center;
    padding: 5px;
    border-radius: 0 0 .5em .5em;
    height = 20px;
  }
  footer span {
    border-radius: .5em;
    padding: 3px;
    color: ${config.fontColorDark.asRgbColor().asHexString()};
    background-color: ${config.fontColorLight.asRgbColor().asHexString()};

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
  const ui = ss.getUi();

  ui.createMenu(`⚖️ Wormhole Loot-O-Meter`)
    .addSubMenu(
      ui.createMenu(`📋 Roster management`)
        .addItem(`➕ Add a pilot manually`, `manualAddPilot`)
        .addSeparator()
        .addItem(`📡 Update pilot roster`, `updateRoster`)
    )
    .addSubMenu(
      ui.createMenu(`🎛️ Sheet utility`)
        .addItem(`🗞 Collapse all groups`, `collapseAllGroups`)
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
function toast(message, title, time) {
  sheets.toast(message, title, time);
};

/**
 *
 */
function alert(title, prompt, buttons = `OK`) {
  const ui = ss.getUi();
  const buttonSet = buttons == `YES_NO` ? ui.ButtonSet.YES_NO : ui.ButtonSet.OK;

  return ui.alert(title, prompt, buttonSet);
};

/**
 *
 */
function updateRosterToast(updateCount) {
  toast(`Roster update was successful. ${updateCount} new pilots were added to the roster.`, `Roster Update Success`, 30);
};

/**
 *
 */
function userExecutedUpdateRoster() {
  updateRosterToast(updateRoster());
};

/**
 *
 */
function userExecutedClearInputs() {
  const ui = ss.getUi();
  const response = alert(
    `Warning`, `This action will reset all check boxes.

    Do you wish to continue?`, ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) {

    return actionCanceled();
  }
  clearInputs();
}

/**
 *
 */
function userExecutedClearSheet() {
  const ui = ss.getUi();
  const response = alert(
    `Warning`, `This action will reset all checkboxes and current pilot lineup.

Do you wish to continue?`, ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) {

    return actionCanceled();
  }
  clearSheet();
}

/** Start of test code 

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
  var url = `https://esi.evetech.net/latest/characters/${characterId}/portrait/?datasource=tranquility`;
  var response = cacheUrlFetchApp(url);
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

End of test Code */

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
  <head>
    <base target="top">

    <title>${dialogTitle}</title>

    <meta charset="UTF-8">
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
          <details>
            <summary>
              <h2>Before You Begin:</h2>
            </summary>
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
          </details>  
        </section>
        <hr>
        <section>
          <details>
            <summary>
              <h2>Instructions:</h2>
            </summary>
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
          </details>
        </section>
      </main>
     
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
 * Reads the existing list of character IDs from the roster sheet.
 * @returns {string[]} The list of character IDs.
 */
function getSavedIds() {
  const rows = roster.getLastRow();
  if (rows === 0) {
    return [];
  }
  const range = roster.getRange(2, 1, rows);

  return range.getDisplayValues()
    .flat()
    .filter(id => id.trim() !== ``);
}

/**
 *
 */
function doGet() {
  const result = HtmlService.createHtmlOutput(manualAddPilotSource()).getContent().toString();
  console.log(typeof result);

  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * lastRow
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet whose rows are to be counted
 * 
 * @return {Number} - The number of populated rows in the spreadsheet
 */
function getLastRow(sheet) {
  return sheet.getLastRow()
}

/**
 *
 */
function clearInputs() {
  console.time(`Executed clearInputs() in`);

  main.getRange(5, 3, 40, 19).clearContent()
  main.getRange(5, 4, 40)
    .clearDataValidations()
    .removeCheckboxes()
    .setFontColor(`white`);

  collapseAllGroups();

  console.timeEnd(`Executed clearInputs() in`);
};

/**
* @summary A function that writes the character IDs and names to the roster sheet.
* @param {string[][]} data - The list of character IDs and names to write.
*/
function addToRoster(data = [[]]) {
  // if data is not an array, wrap it in two sets of square brackets else if data[0] is not an array. wrap in a single set of brackets to ensure 2 dimensional array
  const array = !Array.isArray(data) ? [[data]] : !Array.isArray(data[0]) ? [data] : data;

  // Destructure assignment to find the number of columns based on the length of array
  const { length: rows } = array;
  // Destructure assignment to find the number of columns based on the length of array[0]
  const { length: cols } = array[0];

  // Get range starting on row, col and ending on rows, cols and set the values to the data
  roster.getRange(2, 1, rows, cols).setValues(data);
};

/**
 *
 */
function clearPilots() {
  console.time(`Executed clearPilots() in`)

  config.playerNames.clearContent();
  const validNames = config.dataValidation.pilotSelectionRange;
  const rule = ss.newDataValidation().requireValueInRange(validNames, true).build();
  range.setDataValidation(rule);

  console.timeEnd(`Executed clearPilots() in`)
};

/**
 *
 */
function clearSheet() {
  console.time(`Executed clearSheet() in`);

  clearInputs();
  clearPilots();
  collapseAllGroups();

  console.timeEnd(`Executed clearSheet() in`);
};

/**
 *
 */
function collapseAllGroups() {
  collapseAllRowGroups();
  collapseAllColumnGroups();
};

/**
 *
 */
function collapseAllColumnGroups() {
  main.collapseAllColumnGroups();
};

/**
 *
 */
function collapseAllRowGroups() {
  main.collapseAllRowGroups();
}

/**
 *
 */
function actionCanceled() {
  return toast(`Spreadsheet was not changed`, `Action canceled`, 30);
};