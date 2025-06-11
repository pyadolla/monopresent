"use strict";
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
function compileLaTeXToSVG(tex, preamble) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputDir = "./tmp";
        const inputFile = `${inputDir}/input.tex`;
        const outputFile = `${inputDir}/output.svg`;
        yield fs_extra_1.default.ensureDir(inputDir);
        const fullTex = `
    \\documentclass{standalone}
    ${preamble}
    \\usepackage{xcolor}

    % Define the \\g command
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }
    \\begin{document}
    ${tex}
    \\end{document}
  `;
        yield fs_extra_1.default.writeFile(inputFile, fullTex);
        //      `pdflatex -interaction=nonstopmode  -output-directory=${inputDir} ${inputFile} && dvisvgm -n --pdf ${inputDir}/input.pdf -o ${outputFile}`,
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`pdflatex -interaction=nonstopmode -output-format dvi -output-directory=${inputDir} ${inputFile} && dvisvgm -n ${inputDir}/input.dvi -o ${outputFile}`, (error, stdout, stderr) => {
                // Combine stdout and stderr
                const combinedOutput = stdout + stderr;
                if (error) {
                    console.error("LaTeX compilation error:", combinedOutput || error.message);
                    // Parse LaTeX error blocks
                    const latexErrors = parseLatexErrors(combinedOutput);
                    reject({
                        name: "CompilationError",
                        message: "LaTeX compilation failed.",
                        details: combinedOutput || error.message,
                        tex, // Include the provided LaTeX code
                        latexErrors, // Provide detailed error messages
                    });
                }
                else {
                    fs_extra_1.default.readFile(outputFile, "utf8")
                        .then(resolve)
                        .catch((err) => reject({
                        name: "FileReadError",
                        message: "Error reading the generated SVG file.",
                        details: err.message,
                        tex,
                        latexErrors: ["Error reading the output SVG file."],
                    }));
                }
            });
        });
    });
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
        res.type("image/svg+xml").send(svg);
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
