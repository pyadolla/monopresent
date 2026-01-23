import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import fs from "fs-extra";
import { exec } from "child_process";
import cors from "cors";
import { DOMParser, XMLSerializer } from 'xmldom';
import { randomUUID } from "crypto";
import path from "path";
import { promises as fsp } from "fs";
import * as xpath from 'xpath';

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

async function compileLaTeXToSVG(tex: string, preamble: string): Promise<string> {
  const inputDir = "./tmp";
  await fs.ensureDir(inputDir);

  const id = randomUUID();
  const baseName = `latex-${id}`;
  const texPath = path.join(inputDir, `${baseName}.tex`);
  const dviPath = path.join(inputDir, `${baseName}.dvi`);
  const svgPath = path.join(inputDir, `${baseName}.svg`);

    // \\usepackage{textcomp}
    // \\usepackage{amsmath, amssymb}
    // \\usepackage{lmodern}
  const fullTex = `
    \\documentclass[border=0pt]{standalone}
    ${preamble}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage[sfmath, uprightgreeks, intlimits, frenchstyle]{kpfonts}
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

  await fs.writeFile(texPath, fullTex);

  return new Promise((resolve, reject) => {
    const command = `pdflatex -interaction=nonstopmode -output-format dvi -output-directory=${inputDir} ${texPath} && dvisvgm -n --bbox=preview ${dviPath} -o ${svgPath}`;

    exec(command, async (error, stdout, stderr) => {
      const combinedOutput = stdout + stderr;

      const cleanupFiles = [
        ".aux", ".log", ".pdf", ".tex", ".dvi", ".svg"
      ].map(ext => path.join(inputDir, `${baseName}${ext}`));

      const cleanup = async () => {
        await Promise.allSettled(cleanupFiles.map(file => fsp.rm(file, { force: true })));
      };

      if (error) {
        await cleanup();
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
        const svg = await fs.readFile(svgPath, "utf8");
        await cleanup();
        resolve(svg);
      } catch (err: any) {
        await cleanup();
        reject({
          name: "FileReadError",
          message: "Error reading the generated SVG file.",
          details: err.message,
          tex,
          latexErrors: ["Error reading the output SVG file."],
        });
      }
    });
  });
}

function fixAllSvgYOffset(svgContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  // Get all elements in the SVG document
  const allElements = doc.getElementsByTagName('*');

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements.item(i);
    if (!el) continue;

    if (el.hasAttribute('y')) {
      el.setAttribute('y', '0');
      // Or to remove the y attribute instead:
      // el.removeAttribute('y');
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

function adjustSvgViewBox(svgString: string): string {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  const svg = doc.getElementsByTagName('svg')[0];
  if (!svg) throw new Error("No <svg> root element found.");

  const viewBoxAttr = svg.getAttribute("viewBox");
  if (!viewBoxAttr) throw new Error("No viewBox attribute found.");

  const [vx, vy, vw, vh] = viewBoxAttr.split(/\s+/).map(Number);
  if ([vx, vy, vw, vh].some((v) => isNaN(v))) {
    throw new Error(`Invalid viewBox format: ${viewBoxAttr}`);
  }

  // Use XPath to find the first element with x="0"
  const nodes = xpath.select('//*[@x="0"]', doc) as Element[];
  const target = nodes[0];
  if (!target) throw new Error('No element with x="0" found.');

  const yAttr = target.getAttribute("y");
  if (!yAttr) throw new Error('Target element does not have a "y" attribute.');

  const y = parseFloat(yAttr);
  if (isNaN(y)) throw new Error(`Invalid y attribute: ${yAttr}`);

  // Update viewBox vy = y - vh
  const newVy = y - vh;
  svg.setAttribute("viewBox", [vx, newVy, vw, vh].join(" "));

  // Remove target element
  target.parentNode?.removeChild(target);

  return serializer.serializeToString(doc);
}


function parseLatexErrors(output: string): string[] {
  if (!output) return ["Unknown LaTeX error"];

  const errorLines = output.split("\n");
  const errors: string[] = [];
  let currentError: string | null = null;

  for (const line of errorLines) {
    if (line.startsWith("!")) {
      // Start a new error block
      if (currentError) errors.push(currentError.trim());
      currentError = line;
    } else if (currentError && line.trim() !== "") {
      // Append to the current error block
      currentError += `\n${line}`;
    } else if (currentError) {
      // End of the current error block
      errors.push(currentError.trim());
      currentError = null;
    }
  }

  // Push any remaining error block
  if (currentError) errors.push(currentError.trim());

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

app.get("/latex", async (req: Request, res: Response) => {
  console.log("Received request:", req.query); // Log the query params for debugging

  const { tex, preamble = "" } = req.query;

  if (!tex) {
    return res.status(400).json({
      name: "BadRequest",
      message: "Missing 'tex' parameter",
    });
  }

  try {
    const svg = await compileLaTeXToSVG(tex as string, preamble as string);
    res.type("image/svg+xml").send(adjustSvgViewBox(svg)); //fixAllSvgYOffset(svg));
  } catch (error: any) {
    console.error("Error during LaTeX compilation:", error);
    res.status(500).json({
      name: error.name || "ServerError",
      message: error.message || "An unexpected error occurred.",
      details: error.details || "",
      tex: error.tex || tex,
      latexErrors: error.latexErrors || ["Unknown error during processing."],
    });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

