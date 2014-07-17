/*
*  Lean Big Data with 6 tools from google
*
*  For more details visit https://sites.google.com/site/leanbigdatawith6tools/
*/

var projectNumber = 'XXXXXX'; //Put your own project number

//Add menu option 
var ss = SpreadsheetApp.getActiveSpreadsheet();
function onOpen() {
  var menuEntries = [ {name: 'RunThisSheet', functionName: 'RunThisSheet'} , {name: 'RunAllSheets', functionName: 'RunAllSheets'} ];
  ss.addMenu('BigQuery', menuEntries);
}

function RunAllSheets() {
  var end = SpreadsheetApp.getActiveSpreadsheet().getNumSheets();
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < end; ++i) {
    var flag=sheets[i].getRange("A1").getValue()
    if (flag == "SQL") {
      runQuery(sheets[i]);
    }
  }
  
  alert_mail();
  
}


function alert_mail() {
  if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName("All_calls").getRange("B2").getValue() > 0) {
    var emailAddress = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Alert mail").getRange("B1").getValue();
    var subject = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Alert mail").getRange("B2").getValue();
    var message = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Alert mail").getRange("B3").getValue();
    MailApp.sendEmail(emailAddress, subject, message);
  }
}


function RunThisSheet() {
  runQuery(SpreadsheetApp.getActiveSheet());
}


function runQuery(sheet) {
  var sql = sheet.getRange("B1").getValue();
  //var sql = 'SELECT event, rand() FROM [events.app_events] limit 10';
  
  var queryResults;

  // Inserts a Query Job with an optional timeoutMs parameter.
  var resource = {
      query: sql,
      timeoutMs: 1000
    };
  
  try {
    queryResults = BigQuery.Jobs.query(resource, projectNumber);
  }
  catch (err) {
    Logger.log(err);
    Browser.msgBox(err);
    return;
  }

  // If the query results are not complete when the optional timeout is reached,
  // periodically poll the BigQuery API for the results manually using the query job id.
  while (queryResults.getJobComplete() == false) {
    try {
      queryResults = BigQuery.Jobs.getQueryResults(projectNumber, queryResults.getJobReference().getJobId());
      // If the Job is still not complete, sleep script for
      // 3 seconds before checking result status again
      if (queryResults.getJobComplete() == false) {
        Utilities.sleep(3000);
      }
    }
    catch (err) {
      Logger.log(err);
      Browser.msgBox(err);
      return;
    }
  }

  // Update the amount of results
  var resultCount = queryResults.getTotalRows();
  var resultSchema = queryResults.getSchema();
  var resultValues = new Array(resultCount);
  var tableRows = queryResults.getRows();
  // Iterate through query results
  for (var i = 0; i < tableRows.length; i++) {
    var cols = tableRows[i].getF();
    resultValues[i] = new Array(cols.length);
    // For each column, add values to the result array
    for (var j = 0; j < cols.length; j++) {
      resultValues[i][j] = cols[j].getV();
    }
  }

  
  
  // Update the Spreadsheet with data from the resultValues array
  sheet.getRange(3, 1, resultCount, tableRows[0].getF().length).setValues(resultValues);
}

