"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = require("child_process");
const cors_1 = __importDefault(require("cors"));
const xmldom_1 = require("xmldom");
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const xpath = __importStar(require("xpath"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
// Function to compile LaTeX to SVG
//async function compileLaTeXToSVG(tex: string, preamble: string): Promise<string> {
//  const inputDir = "./tmp";
//  const inputFile = `${inputDir}/input.tex`;
//  const outputFile = `${inputDir}/output.svg`;
//
//  await fs.ensureDir(inputDir);
//
//  const fullTex = `
//    \\documentclass{standalone}
//    ${preamble}
//    \\begin{document}
//    ${tex}
//    \\end{document}
//  `;
//
//  await fs.writeFile(inputFile, fullTex);
//
//  return new Promise((resolve, reject) => {
//    exec(`pdflatex -output-directory ${inputDir} ${inputFile} && dvisvgm ${inputDir}/input.dvi -o ${outputFile}`, (error) => {
//      if (error) {
//        reject(new Error(`LaTeX compilation failed: ${(error as Error).message}`));
//      } else {
//        fs.readFile(outputFile, "utf8")
//          .then(resolve)
//          .catch(reject);
//      }
//    });
//  });
//}
//    \\setlength{\\topmargin}{0pt}
//    \\setlength{\\headsep}{0pt}
//    \\setlength{\\footskip}{0pt}
//    \\setlength{\\oddsidemargin}{0pt}
//    \\setlength{\\headheight}{0pt}
//    \\setlength{\\textwidth}{\\paperwidth}
//    \\setlength{\\textheight}{\\paperheight}
function compileLaTeXToSVG(tex, preamble) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputDir = "./tmp";
        yield fs_extra_1.default.ensureDir(inputDir);
        const id = (0, crypto_1.randomUUID)();
        const baseName = `latex-${id}`;
        const texPath = path_1.default.join(inputDir, `${baseName}.tex`);
        const dviPath = path_1.default.join(inputDir, `${baseName}.dvi`);
        const svgPath = path_1.default.join(inputDir, `${baseName}.svg`);
        const fullTex = `
    \\documentclass[border=0pt]{standalone}
    ${preamble}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage{textcomp}
    \\usepackage{amsmath, amssymb}
    \\usepackage[sfmath, uprightgreeks]{kpfonts}
    \\usepackage{bm}
    \\usepackage{xcolor}
    \\setlength{\\hoffset}{0pt}
    \\setlength{\\voffset}{0pt}
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }
    \\begin{document}
    \\makebox[0pt][l]{.}\\text{${tex}}
    \\end{document}
  `;
        yield fs_extra_1.default.writeFile(texPath, fullTex);
        return new Promise((resolve, reject) => {
            const command = `pdflatex -interaction=nonstopmode -output-format dvi -output-directory=${inputDir} ${texPath} && dvisvgm -n --bbox=preview ${dviPath} -o ${svgPath}`;
            (0, child_process_1.exec)(command, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                const combinedOutput = stdout + stderr;
                const cleanupFiles = [
                    ".aux", ".log", ".pdf", ".tex", ".dvi", ".svg"
                ].map(ext => path_1.default.join(inputDir, `${baseName}${ext}`));
                const cleanup = () => __awaiter(this, void 0, void 0, function* () {
                    yield Promise.allSettled(cleanupFiles.map(file => fs_1.promises.rm(file, { force: true })));
                });
                if (error) {
                    yield cleanup();
                    const latexErrors = parseLatexErrors(combinedOutput); // assumes this is defined elsewhere
                    return reject({
                        name: "CompilationError",
                        message: "LaTeX compilation failed.",
                        details: combinedOutput || error.message,
                        tex,
                        latexErrors,
                    });
                }
                try {
                    const svg = yield fs_extra_1.default.readFile(svgPath, "utf8");
                    yield cleanup();
                    resolve(svg);
                }
                catch (err) {
                    yield cleanup();
                    reject({
                        name: "FileReadError",
                        message: "Error reading the generated SVG file.",
                        details: err.message,
                        tex,
                        latexErrors: ["Error reading the output SVG file."],
                    });
                }
            }));
        });
    });
}
function fixAllSvgYOffset(svgContent) {
    const parser = new xmldom_1.DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    // Get all elements in the SVG document
    const allElements = doc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements.item(i);
        if (!el)
            continue;
        if (el.hasAttribute('y')) {
            el.setAttribute('y', '0');
            // Or to remove the y attribute instead:
            // el.removeAttribute('y');
        }
    }
    const serializer = new xmldom_1.XMLSerializer();
    return serializer.serializeToString(doc);
}
function adjustSvgViewBox(svgString) {
    var _a;
    const parser = new xmldom_1.DOMParser();
    const serializer = new xmldom_1.XMLSerializer();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.getElementsByTagName('svg')[0];
    if (!svg)
        throw new Error("No <svg> root element found.");
    const viewBoxAttr = svg.getAttribute("viewBox");
    if (!viewBoxAttr)
        throw new Error("No viewBox attribute found.");
    const [vx, vy, vw, vh] = viewBoxAttr.split(/\s+/).map(Number);
    if ([vx, vy, vw, vh].some((v) => isNaN(v))) {
        throw new Error(`Invalid viewBox format: ${viewBoxAttr}`);
    }
    // Use XPath to find the first element with x="0"
    const nodes = xpath.select('//*[@x="0"]', doc);
    const target = nodes[0];
    if (!target)
        throw new Error('No element with x="0" found.');
    const yAttr = target.getAttribute("y");
    if (!yAttr)
        throw new Error('Target element does not have a "y" attribute.');
    const y = parseFloat(yAttr);
    if (isNaN(y))
        throw new Error(`Invalid y attribute: ${yAttr}`);
    // Update viewBox vy = y - vh
    const newVy = y - vh;
    svg.setAttribute("viewBox", [vx, newVy, vw, vh].join(" "));
    // Remove target element
    (_a = target.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(target);
    return serializer.serializeToString(doc);
}
function parseLatexErrors(output) {
    if (!output)
        return ["Unknown LaTeX error"];
    const errorLines = output.split("\n");
    const errors = [];
    let currentError = null;
    for (const line of errorLines) {
        if (line.startsWith("!")) {
            // Start a new error block
            if (currentError)
                errors.push(currentError.trim());
            currentError = line;
        }
        else if (currentError && line.trim() !== "") {
            // Append to the current error block
            currentError += `\n${line}`;
        }
        else if (currentError) {
            // End of the current error block
            errors.push(currentError.trim());
            currentError = null;
        }
    }
    // Push any remaining error block
    if (currentError)
        errors.push(currentError.trim());
    return errors.length > 0 ? errors : ["Unknown LaTeX error"];
}
// Endpoint for rendering LaTeX to SVG
//app.get("/latex", async (req: Request, res: Response) => {
//  const { tex, preamble = "" } = req.query;
//
//  if (!tex) {
//    return res.status(400).json({ message: "Missing 'tex' parameter" });
//  }
//
//  try {
//    const svg = await compileLaTeXToSVG(tex as string, preamble as string);
//    res.type("image/svg+xml").send(svg);
//  } catch (error) {
//    res.status(500).json({ message: (error as Error).message });
//  }
//});
//app.get("/latex", (req: Request, res: Response, next: NextFunction) => {
//  const { tex, preamble = "" } = req.query;
//
//  if (!tex) {
//    return res.status(400).json({ message: "Missing 'tex' parameter" });
//  }
//
//  compileLaTeXToSVG(tex as string, preamble as string)
//    .then((svg) => res.type("image/svg+xml").send(svg))
//    .catch((error) =>
//      res.status(500).json({ message: (error as Error).message })
//    );
//});
app.get("/latex", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request:", req.query); // Log the query params for debugging
    const { tex, preamble = "" } = req.query;
    if (!tex) {
        return res.status(400).json({
            name: "BadRequest",
            message: "Missing 'tex' parameter",
        });
    }
    try {
        const svg = yield compileLaTeXToSVG(tex, preamble);
        res.type("image/svg+xml").send(adjustSvgViewBox(svg)); //fixAllSvgYOffset(svg));
    }
    catch (error) {
        console.error("Error during LaTeX compilation:", error);
        res.status(500).json({
            name: error.name || "ServerError",
            message: error.message || "An unexpected error occurred.",
            details: error.details || "",
            tex: error.tex || tex,
            latexErrors: error.latexErrors || ["Unknown error during processing."],
        });
    }
}));
// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
