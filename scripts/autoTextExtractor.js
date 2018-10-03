let fs = require( 'fs' );
let path = require( 'path' );
let startPath = "../js";

const KEY_SIZE = 25;

let textTots = []
let alertTots = []
let labelTots = []
let titleTots = []
let translationAlertData = {};
let translationLabelData = {};
let translationTextData = {};
let translationTitleData = {};

let parsePath = function(dirPath) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
      if (parseFile(elementPath)) {
        break;
      }
    }
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parsePath(elementPath)
    }
  };
}

let parseFile = function(filePath) {
  let content = fs.readFileSync(filePath, "utf8")
  let textRegex = /<Text[^>]*?>([^<]*?)<\/Text>/gm
  let alertRegex = /Alert\.alert\(([\s\S]*?)\)/gm
  let labelRegex = /{.*label:(.*),.*}/gm
  let titleRegex = /navigationOptions[\s\S]*title:(.*)[\s^}]*/gm

  let textMatches = content.match(textRegex);
  let alertMatches = content.match(alertRegex);
  let labelMatches = content.match(labelRegex);
  let titleMatches = content.match(titleRegex);

  let filenameArr = filePath.split("/")
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  // if (filename !== "Sphere") {
  //   return
  // }


  let importLine = 'import { Languages } from "';
  let pathArr = filePath.split("/");
  for (let i = 0; i < pathArr.length - 2; i++) {
    importLine += '../'
  }
  importLine += 'Languages"\n'

  if (content.indexOf(importLine) === -1) {
    content = importLine + content;
    // fs.writeFileSync(filePath, content);
  }

  let contentData = {content: content};

  if (textMatches !== null) {
    for ( let i = 0; i < textMatches.length; i++) {
      let match = textMatches[i];
      let resultArray = [];
      while ((resultArray = textRegex.exec(match)) !== null) {
        extractFromText(resultArray, filename, filePath, contentData)
      }
    }
    textTots = textTots.concat(textMatches);
  }

  if (alertMatches !== null) {
    for ( let i = 0; i < alertMatches.length; i++) {
      let match = alertMatches[i];
      let resultArray = [];
      while ((resultArray = alertRegex.exec(match)) !== null) {
        extractAlert(resultArray, filename, filePath, contentData)
      }
    }
    alertTots = alertTots.concat(alertMatches);
  }

  if (labelMatches !== null) {
    for ( let i = 0; i < labelMatches.length; i++) {
      let match = labelMatches[i];
      let resultArray = [];
      while ((resultArray = labelRegex.exec(match)) !== null) {
        extractLabel(resultArray, filename, filePath, contentData)
      }
    }
    labelTots = labelTots.concat(labelMatches);
  }
  if (titleMatches !== null) {
    for ( let i = 0; i < titleMatches.length; i++) {
      let match = titleMatches[i];
      let resultArray = [];
      while ((resultArray = titleRegex.exec(match)) !== null) {
        extractTitle(resultArray, filename, filePath, contentData)
      }
    }
    titleTots = titleTots.concat(titleMatches);
  }
}


function extractTitle(match, filename, filePath, contentData) {
  let content = match[1];

  let {pureText, text} = extractAndConvert(content, true, true, true);

  console.log(filename, "title:" , text)
}

function extractLabel(match, filename, filePath, contentData) {
  let content = match[1];

  // let label = _extractStringWithParameters(content);
  let {pureText, text} = extractAndConvert(content, true, true);

  console.log(filename, "label:" , text)
}


function extractFromText(match, filename, filePath, contentData) {
  // this will ignore any > in the styles
  let manuallyParsedContent = ''
  let open = 0;
  let ignore = 0;
  let textOpen = false;
  for ( let i = 0; i < match[0].length; i++) {
    let letter = match[0][i];
    if (letter === "<") {
      open++;
    }
    if (letter === "{") {
      ignore++;
    }
    if (letter === "}") {
      ignore--;
    }
    if (letter === ">" && ignore === 0) {
      open--;
      continue;
    }

    if (open === 0 || textOpen === true) {
      textOpen = true;
      manuallyParsedContent += letter;
    }
  }

  manuallyParsedContent = manuallyParsedContent.replace("</Text","");
  let content = manuallyParsedContent;


  let extractData = extractAndConvert(content);

  if (extractData.pureText) {
    createTranslationFileAndReplaceContents(filename, filePath, extractData, translationTextData, 'text', contentData)
  }
}


function createTranslationFileAndReplaceContents(filename, filePath, extractData, target, targetType, contentData) {
  if (target[filename] === undefined) {
    target[filename] = {__filename: '"' + filePath + '"'}
  }

  let textKey = prepareTextKey(target, filename, extractData.pureText);
  target[filename][textKey] = "() => { return " + extractData.text + " }";

  let functionCall = getFunctionCall(extractData);

  let replacementContent = '{ Languages.' + targetType + '("' + filename + '", "' + textKey + '")' + functionCall + ' }';

  contentData.content.replace(extractData.parsedText, replacementContent);
}


function getFunctionCall(extractData) {
  let functionCall = '('
  for (let i = 0; i < extractData.parameters.length; i++) {
    functionCall += extractData.parameters[i];
    if (i != extractData.parameters.length - 1) {
      functionCall += ',';
    }
  }
  functionCall += ")";
  return functionCall;
}

function prepareTextKey(target, filename, inputText, postfix = '') {

  let keyText = inputText.replace(/(\')/g,'')
  keyText = keyText.replace(/[^a-zA-Z]/g,'_')
  let textKeyNoSpaces = keyText.replace(/( )/g,"_").substr(0,KEY_SIZE) + postfix;
  let i = 1;

  while (target[filename][textKeyNoSpaces] !== undefined) {
    let newTextKey = keyText.replace(/( )/g,"_").substr(0,KEY_SIZE+i) + postfix;
    if (newTextKey === textKeyNoSpaces) {
      break;
    }

    textKeyNoSpaces = newTextKey;
    i++;
  }
  return textKeyNoSpaces;
}


function extractAlert(match, filename, filePath, contentData) {
  let fullMatch = match[0].replace("Alert.alert(",'');

  let headerResult = extractAndConvert(fullMatch, true, true, true)
  let header = headerResult.text;

  let fullMatchBody = fullMatch.substr(headerResult.parsedText.length)
  let bodyResult = extractAndConvert(fullMatchBody, true, true, true)

  let body = bodyResult.text;
  let textSplit = fullMatch.split("text:");

  let buttonLeftData = grabString(textSplit[1]);
  let buttonRightData = grabString(textSplit[2]);


  if (translationAlertData[filename] === undefined) {
    translationAlertData[filename] = {__filename: '"' + filePath + '"'}
  }

  let headerTextKey      = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'header');
  let bodyTextKey        = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'body');

  let headerFunctionCall = getFunctionCall(headerResult);
  let bodyFunctionCall   = getFunctionCall(bodyResult);


  translationAlertData[filename][headerTextKey] = "() => { return " + headerResult.text + " }";
  translationAlertData[filename][bodyTextKey]   = "() => { return " + bodyResult.text + " }";

  if (buttonLeftData.result) {
    let buttonLeftKey      = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'left');
    translationAlertData[filename][buttonLeftKey]   = "() => { return \"" + buttonLeftData.result + "\" }";
  }

  if (buttonRightData.result) {
    let buttonRightKey     = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'right');
    translationAlertData[filename][buttonRightKey]   = "() => { return \"" + buttonRightData.result + "\" }";
  }





  console.log(fullMatch, textSplit)
  let remainder = ')'
  if (buttonLeftData.result) {
    remainder = ',';
    remainder += '[{text:' + textSplit[1].replace(buttonLeftData.resultString, "LEFT_TEST");

    if (buttonRightData.result) {
      remainder += 'text:' + textSplit[2].replace(buttonRightData.resultString, "RIGHT_TEST");
    }
    console.log("remainder", remainder)
  }

  // console.log('textSplit', grabString(textSplit[1]), grabString(textSplit[2]))
  // console.log(filename, "header:" + header, 'body:' + body, 'buttonLeftText:' + buttonLeftText, 'buttonRighText:' + buttonRightText);

  console.log('Alert.alert({ Languages.alert(\"' + filename + '\", \"' + headerTextKey + '\")' + headerFunctionCall + "," +
                            'Languages.alert(\"' + filename + '\", \"' + bodyTextKey   + '\")' + bodyFunctionCall   + remainder);


  // createTranslationFileAndReplaceContents(filename, filePath, extractData, translationFileData, 'text', contentData)
}


function grabString(str) {
  if (!str) { return {result:null}; }

  let result = '';
  let stringOpen = false;
  let stringMatcher = '"'
  for ( let i = 0; i < str.length; i++) {
    let letter = str[i];
    if (stringOpen) {
      if (letter == stringMatcher) {
        stringOpen = false;
        break
      }
      result += letter
    }

    if (letter === '"' || letter === "'") {
      stringMatcher = letter;
      stringOpen = true;
    }
  }
  let resultString = stringMatcher + result + stringMatcher
  return {result, resultString};
}


function extractAndConvert(content, assumeLogicIsOpen = false, stopOnComma = false, stopOnCurlyBracket = false) {
  let modes = {
    logic:     "logic",
    string:    "string",
    block:     "block",
    arguments: "arguments",
    void:      "void",
  };

  let textLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let parameterLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[].0123456789()';
  let parserSymbols = {
    '"' : {closing: '"', getMode: (prevLetter) => { return "string"; }, acceptIfInMode: { logic: true, block: true }},
    "'" : {closing: "'", getMode: (prevLetter) => { return "string"; }, acceptIfInMode: { logic: true, block: true }},
    "(" : {closing: ")", getMode: (prevLetter) => { return textLetters.indexOf(prevLetter) === -1 ? "block" : 'arguments'; }, acceptIfInMode: { block: true, logic: true}},
    "{" : {closing: "}", getMode: (prevLetter) => { return "logic";  }, acceptIfInMode: { void:  true, block: true}},
  };

  let layers = [];
  let activeModes = [modes.void];

  let chunk = '';
  let pureText = '';
  let parameterCounter = 0;
  let parameterAddedWhileClosed = false;
  let chunks = [];
  let parameters = [];
  let parameter = ''
  let ignoreVoid = false;
  let escaping = false;

  content = content.replace(/(\(\))/g,"");
  let prevLetter = null;

  if (assumeLogicIsOpen === false) {
    // check is there is a logic block. if there is, we do not need to consider the void mode
    for (let i = 0; i < content.length; i++) {
      let letter = content[i];
      let activeMode = activeModes[activeModes.length - 1];

      if (parserSymbols[letter] !== undefined) {
        if (parserSymbols[letter].acceptIfInMode[activeMode]) {
          activeModes.push(parserSymbols[letter].getMode(prevLetter));
          layers.push(parserSymbols[letter].closing);
          if (activeModes[activeModes.length - 1] === modes.logic) {
            ignoreVoid = true;
          }

          prevLetter = letter;
          continue;
        }
      }

      if (letter == layers[layers.length - 1]) {
        // close the segment
        layers.pop();
        activeModes.pop();

        prevLetter = letter;
        continue;
      }

      prevLetter = letter;
    }
    activeModes = [modes.void];
  }
  else {
    ignoreVoid = true
    activeModes = [modes.logic];
  }

  layers = [];
  prevLetter = null;
  let parsedText = '';

  // parse text
  for (let i = 0; i < content.length; i++) {
    let letter = content[i];
    parsedText += letter;
    let activeMode = activeModes[activeModes.length - 1];

    if (letter === '\\') {
      escaping = true
      continue;
    }

    if (escaping) {
      if (letter === 'n') {
        escaping = false;
        letter = '\\n'
      }
      else {
        if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
          pureText += "\\" + letter;
          chunk +=  "\\" + letter;
        }

        escaping = false;
        prevLetter = letter;
        continue;
      }
    }

    if (letter === ',' && stopOnComma === true) {
      if (activeMode === modes.void || activeMode === modes.logic) {
        break;
      }
    }
    if (letter === '}' && stopOnCurlyBracket === true) {
      if (activeMode === modes.void || activeMode === modes.logic) {
        break;
      }
    }

    if (letter == layers[layers.length - 1]) {
      // close the segment
      if (activeMode === modes.block) {
        chunks.push(")");
      }

      if (activeMode === modes.arguments) {
        parameter += ")";
      }

      if (chunk) {
        chunks.push(chunk);
      }
      if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
        chunks.push('"');
        parameterAddedWhileClosed = false
      }
      layers.pop();
      activeModes.pop();
      chunk = '';

      prevLetter = letter;
      continue;
    }

    // check for mode changes
    if (parserSymbols[letter] !== undefined) {

      if (parserSymbols[letter].acceptIfInMode[activeMode]) {
        activeModes.push(parserSymbols[letter].getMode(prevLetter));
        layers.push(parserSymbols[letter].closing);

        if (activeModes[activeModes.length - 1] === modes.block) {
          chunks.push("(")
        }

        if (activeModes[activeModes.length - 1] === modes.arguments) {
          parameter += "(";
        }

        if (activeModes[activeModes.length - 1] === modes.string || (activeModes[activeModes.length - 1] === modes.void && ignoreVoid === false)) {
          chunks.push('"');
        }

        prevLetter = letter;
        continue;
      }
      else {
        if (letter === '"' && activeMode === modes.string) {
          letter = '\\' + letter
        }
      }
    }

    // look for inline conditional statements
    if (letter === "?" && !(activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false))) {
      // look back through the chunks to see where the query stops
      let popCount = 0;
      let gotArgument = false;
      let startedGettingOperator = false;
      let gotOperator = false;
      let gotSubject = false
      for (let j = chunks.length - 1; j >= 0; j--) {
        if (popCount > 0) {
          chunks.pop();
          popCount--;
        }
        let candidate = chunks[j];
        if (gotArgument === false) {
          // is string;
          if (candidate === '"' || candidate === "'") {
            popCount = 2;
            chunks.pop();
          }
          else {
            chunks.pop();
          }
          gotArgument = true;
          continue;
        }
        else if (gotOperator === false) {
          if (candidate === "=" || candidate === ">" || candidate === "<") {
            startedGettingOperator = true;
            chunks.pop();
          }
          else if (startedGettingOperator) {
            if (gotSubject === false) {
              chunks.pop();
              break;
            }
          }
        }
        else if (gotSubject === false) {
          chunks.pop();
          break;
        }
      }

      // with the query removed, we will be able to add a new conditional.
      parameterCounter--;
      chunks.push("arguments[" + parameterCounter +"] ? ");
      parameterCounter++;
      parameterAddedWhileClosed = false
      prevLetter = letter;
      continue;
    }

    // store data
    if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
      pureText += letter;
      chunk += letter;
    }
    else if (activeMode === modes.logic || activeMode === modes.block) {
      if (letter === ":") {
        chunks.push(" : ");
        parameterAddedWhileClosed = false
      }
      else if (letter === "+") {
        chunks.push(" + ");
        parameterAddedWhileClosed = false
      }
      else if (letter === "|") {
        chunks.push("|");
        parameterAddedWhileClosed = false
      }
      else if (letter === "=" || letter === ">" || letter === "<") { // add these so the conditional parser will be able to remove the query
        chunks.push(letter);
        parameterAddedWhileClosed = false
      }
      else if (letter !== " " && letter !== "\n") {
        if (parameterAddedWhileClosed === false) {
          chunks.push("arguments[" + parameterCounter +"]")

          parameterCounter++;
          parameterAddedWhileClosed = true;
        }

        parameter += letter;
      }
      else if (parameterLetters.indexOf(letter) === -1) {
        if (parameter) {
          parameters.push(parameter);
        }
        parameter = '';
      }
    }
    else if (activeMode === modes.arguments) {
      parameter += letter;
    }

    prevLetter = letter;
  }

  // for when only void is avaible
  if (chunk !== '') {
    chunk = chunk.replace(/(\n)/g,"").trim();

    chunks.push('"' + chunk + '"');
  }

  let text = chunks.join('');

  if (text.substr(text.length-2,2) === "+ ") {
    text = text.substr(0,text.length-3)
  }

  // add spaces to ||
  text = text.replace(/(\|\|)/g," || ")

  let keywords = {new: true}
  let parsedParameters = [];
  let cache = ''
  for (let i = 0; i < parameters.length; i++) {
    if (keywords[parameters[i]] === true) {
      cache = parameters[i];
    }
    else {
      if (cache) {
        parsedParameters.push(cache + " " +parameters[i]);
        cache = '';
      }
      else {
        parsedParameters.push(parameters[i]);
      }
    }
  }

  return {pureText, text, parameters: parsedParameters, parsedText: parsedText};
}


parsePath(startPath)
console.log('textTots', textTots.length);
console.log('alertTots', alertTots.length);
console.log('labelTots', labelTots.length);
console.log('titleTots', titleTots.length);

//util
let padd = function (x) {
  if (x === "__filename:") {
    return x;
  }
  while (x.length < KEY_SIZE + 2) {
    x += " ";
  }
  return x
}

let resultString = 'export const language = {\n';
let indent = "  "
let keys = Object.keys(translationTextData);
keys.sort();
keys.forEach((key) => {
  resultString += indent + key + ":{\n"
  let source = translationTextData[key]
  let subKeys = Object.keys(source);
  subKeys.forEach((subKey) => {
    resultString += indent + indent + padd(subKey + ":" ) + " " + source[subKey] + ",\n"
  })
  resultString += indent + "},\n"
})

resultString += "}"

// console.log(resultString)
console.log(translationAlertData)

fs.writeFileSync("__testtranslationFile.js", resultString)






