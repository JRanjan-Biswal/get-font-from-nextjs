import fs, { promises as fsPromises } from 'fs';
import path from 'path';
const currentPath = process.cwd();

const fontJsonFirstBitAppender = async () => {
    await fsPromises.writeFile(`${currentPath}/font.json`, '[\n', 'utf8')
}

const fontJsonFirstLastAppender = async () => {
    await fsPromises.appendFile(`${currentPath}/font.json`, ']', 'utf8')
}

const weightArrayFunc = (weightArray, i) => {
    if (!weightArray) return
    let weightNumArrReg = /[0-9]{3}/g
    let weightNumArr = weightArray[i].match(weightNumArrReg);
    return weightNumArr;
}

const subSetArrayFunc = (subsetArray, i) => {
    if (!subsetArray[i]) return JSON.stringify([])
    let subSetArrReg = /((?<=').*?((?=' | )|(?=')))/g
    let subsetMatch = subsetArray[i].match(subSetArrReg);
    let subSetArr = []
    subsetMatch.forEach(element => (element.length > 0) && subSetArr.push(`${element}`));
    // return JSON.stringify(subSetArr)
    return subSetArr
}

const stylesArrayFunc = (stylesArray, i) => {
    if (!stylesArray[i]) return JSON.stringify([])
    let stylesArrReg = /((?<=').*?((?='| )|(?=')))/g
    let stylesMatch = stylesArray[i].match(stylesArrReg);
    let stylesArr = []
    stylesMatch.forEach(item => (item.length > 0) && stylesArr.push(item))
    // return JSON.stringify(stylesArr)
    return stylesArr
}

let mainRegex = /((?<=export declare function )(.*)(?=<T extends CssVariable))/g
let mainWeightRegex = /((?<=weight(\?: |: ))(.*)(?=Array))/g  // '300' | '400' | '500' | '600' | '700' | 
let mainSubsetRegex = /((?<=subsets(\?: |: )Array<)(.*)(?=>))/g  // 'cyrillic' | 'cyrillic-ext' | 'greek' | 'greek-ext' | 'latin' | 'latin-ext' | 'vietnamese'
let mainStylesRegex = /((?<=style(\?: |: ))(.*)(?=Array))/g

async function fontPromise() {

    try {

        let fontPath = path.join(currentPath, 'font.ts');
        // const arrPath = path.join(currentPath, 'arr.json');
        const fontData = await fsPromises.readFile(fontPath, 'utf8');

        const fileReadArr = fs.readFileSync(fontPath, 'utf8').toString().split("\r\n");

        await fontJsonFirstBitAppender()

        let obj = {}
        let index = 0;
        let fontNameArray = fontData.match(mainRegex);
        while (index < fileReadArr.length) {
            let current = fileReadArr[index]
            if (current.includes('export declare function')) {
                obj = {}
                let fontFamily = current.match(mainRegex);
                obj.fontFamily = fontFamily;
                let currentIndex = index;
                let firstSubIndex = currentIndex + 1;
                let lastSubIndex = currentIndex + 8;
                for (let i = firstSubIndex; i <= lastSubIndex; i++) {
                    let currentFile = fileReadArr[i];
                    if (currentFile.includes('weight')) {
                        let weight = currentFile.match(mainWeightRegex);
                        let weightArr = weightArrayFunc(weight, 0);
                        obj.weight = weightArr;
                    }
                    else if (currentFile.includes('style')) {
                        let styles = currentFile.match(mainStylesRegex);
                        let stylesArr = stylesArrayFunc(styles, 0);
                        obj.styles = stylesArr
                    }
                    else if (currentFile.includes('subsets')) {
                        let subsets = currentFile.match(mainSubsetRegex);
                        let subsetsArr = subSetArrayFunc(subsets, 0);
                        obj.subsets = subsetsArr
                    }
                }
                if (!obj.subsets) {
                    obj.subsets = null;
                }
                const lastCommaHandler = fontFamily.includes(fontNameArray[fontNameArray.length - 1]) ? "" : ",";
                let data = JSON.stringify(obj) + `${lastCommaHandler}\n`;
                await fsPromises.appendFile(`${currentPath}/font.json`, data, 'utf8')
                index++
            }
            else {
                index++
            }
        }

        await fontJsonFirstLastAppender()

    }
    catch (error) {
        console.log(error)
    }
}

fontPromise()