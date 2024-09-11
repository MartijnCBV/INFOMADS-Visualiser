type ParseType = "problem" | "solution"
type TimeSlot = number;
type Borrel = number;
type Obligation = {
    start: TimeSlot,
    end: TimeSlot,
    duration: TimeSlot
} 
type Problem = {
    slots: TimeSlot,
    borrels: Borrel[],
    students: Obligation[][]
}
type Solution = {
    borrels: TimeSlot[],
    obligations: TimeSlot[][],
    profit: number
}

const colors = ["red", "blue", "darkorange", "green", "purple"];
const margin = 50;

function submitProblem(): void {
    const out = document.getElementById("canvas");
    const str = (document.getElementById("problem-in") as HTMLDataElement).value;
    const problem = parseProblem(str);
    const svg = problemSVG(problem, true);
    if (out) out.innerHTML = makeSVG([svg[0]], svg[1], svg[2]);
}

function submitSolution(): void {
    const out = document.getElementById("canvas");
    const pstr = (document.getElementById("problem-in") as HTMLDataElement).value;
    const sstr = (document.getElementById("solution-in") as HTMLDataElement).value;
    const problem = parseProblem(pstr);
    const solution = parseSolution(sstr, problem);
    const psvg = problemSVG(problem, false);
    const ssvg = solutionSVG(solution, problem, psvg[3]);
    if (out) out.innerHTML = makeSVG([ssvg[0], psvg[0], ssvg[1]], psvg[1], psvg[2]);
}

function parseProblem(str: string): Problem {
    const lines = str.split("\n")
    const handleLine = (line: string): number[] => line.replace(/\s/g, "").split(",").map(j => parseInt(j));
    const students: Obligation[][] = [];
    for (let i = 4; i <= parseInt(lines[3]) + 3; i++) {
        const obligations: Obligation[] = [];
        const student = handleLine(lines[i]);
        for (let i = 1; i <= student[0] * 3; i += 3) {
            obligations.push({
                start: student[i],
                end: student[i + 1],
                duration: student[i + 2],
            });
        }
        students.push(obligations);
    }
    return {
        slots: handleLine(lines[0])[0],
        borrels: handleLine(lines[2]),
        students
    }
}

function parseSolution(str: string, problem: Problem): Solution {
    const lines = str.split("\n");
    const handleLine = (line: string): number[] => line.replace(/\s/g, "").split(",").map(j => parseInt(j));
    const obligations: TimeSlot[][] = [];
    let i = 1;
    problem.students.forEach(s => {
        s.forEach(_ => {
            obligations.push(handleLine(lines[i]));
            i++;
        });
    });
    return {
        borrels: handleLine(lines[0]),
        obligations,
        profit: parseInt(lines[lines.length - 1])
    }
}

function makeSVG(strs: string[], height: number, width: number): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white" />
            ${strs.join("")}
            </svg>
            `;
}

function problemSVG(problem: Problem, rduration: boolean): [string, number, number, Map<number, string>] {
    const height = (problem.students.reduce((acc, i) => acc + i.length, 0) + 1) * 30 + margin * 2;
    const width = problem.slots * 50 + margin * 2 + 150;
    const fl = (i: number): boolean => i === 0 || i === problem.slots;
    const slots = Array
            .from({ length: problem.slots + 1})
            .map((_, i) => `<path ${!fl(i) ? `stroke-dasharray="10,10"` : `stroke="black"`} d="M${i * 50 + margin} ${margin} L${i * 50 + margin} ${height - margin}" />`);
    let colorState = new Map<number, string>();
    let i = 30;
    let lastLabelY = 0;
    const students = problem.students.map((s, c) => {
        const color = colors[c % 5]
        const ob = s.map(o => {
            colorState.set(i / 30, color);
            const j = i;
            i += 30;
            const x1 = (o.start - 1) * 50 + margin;
            const x2 = (o.end) * 50 + margin;
            const f = `<path d="M${x1} ${j + margin - 7.5} L${x1} ${j + margin + 7.5}" />`;
            const l = `<path d="M${x2} ${j + margin - 7.5} L${x2} ${j + margin + 7.5}" />`
            return `<g x="${x1}" y="${j + margin - 7.5}" width="${x2 - x1}" height="15">
                    ${!fl(o.start - 1) ? f : ""}
                    <path d="M${x1} ${j + margin} L${x2} ${j + margin}" />
                    ${!fl(o.end) ? l : ""}
                    ${rduration ? `<text stroke-width="0" font-weight="bold" x="${x1 + (x2 - x1) / 2}" y="${j + margin - 7.5}" dominant-baseline="middle" text-anchor="middle">${o.duration}</text>` : ""}
                    </g>`;
        });
        lastLabelY = margin + 15 + c * 30
        const label = `
                    <rect width="40" height="15" fill="${color}" stroke="${color}" x="${width - 130 - margin}" y="${lastLabelY}" />
                    <text fill="black" stroke="black" stroke-width="0" font-weight="bold" x="${width - 80 - margin}" y="${margin + 28 + c * 30}">Student ${c + 1}</text>
                    `;
        return `<g fill="${color}" stroke="${color}" stroke-width="4">${ob.join("\n")}${label}</g>`
    });
    lastLabelY += 30;
    const borrels = problem.borrels.map((s, b) => {
        const x = width - 130 - margin;
        const y = lastLabelY + (b + 1) * 30;
        return `<g fill="black" stroke="black" stroke-width="2">
                <path d="M${x} ${y} L${x} ${y + 15}" />
                <path d="M${x + 40} ${y} L${x + 40} ${y + 15}" />
                <path d="M${x} ${y + 7.5} L${x + 40} ${y + 7.5}" />
                <text stroke-width="0" font-weight="bold" x="${x + 16}" y="${y + 5}">${s}</text>
                <text stroke-width="0" font-weight="bold" x="${x + 50}" y="${y + 13}">Borrel ${b + 1}</text>
                </g>
                `;
    });
    return [`<g fill="none" stroke="gray" stroke-width="2">
            ${slots.join("")}
            <path stroke="black" d="M${margin} ${margin} L${width - margin - 150} ${margin}" />
            <path stroke="black" d="M${margin} ${height - margin} L${width - margin - 150} ${height - margin}" />
            </g><g>
            ${students.join("")}
            </g>
            ${borrels.join("")}
            `, height, width, colorState];
}

function solutionSVG(solution: Solution, problem: Problem, colorState: Map<number, string>): [string, string] {
    let i = 1;
    const obs = solution.obligations.map(o => {
        const os = o.map(t => `<rect width="50" height="15" x="${(t - 1) * 50 + margin}" y="${i * 30 - 7.5 + margin}" fill="${colorState.get(i)}" />`).join("");
        i++;
        return `<g>${os}</g>`;
    }).join("");
    const bos = solution.borrels.map((b, j) => `<rect width="${problem.borrels[j] * 50}" height="${(solution.obligations.length + 1) * 30}" x="${(b - 1) * 50 + margin}" y="${margin}" fill="lightgray" />`).join("");
    return [bos, obs];
}
