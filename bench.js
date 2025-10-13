import { Bench } from 'tinybench';
import { VBANProtocolFactory } from './lib/index.mjs';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '.github', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'bench.json');
const SUMMARY_FILE = path.join(__dirname, 'benchmark-summary.md');

function getPreviousResults() {
    if (fs.existsSync(CACHE_FILE)) {
        const rawData = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(rawData);
    }
    return {}; // Return empty object if no previous results
}

function formatResults(tasks) {
    const results = {};
    tasks.forEach((task) => {
        if (task.result) {
            results[task.name] = {
                hz: task.result.hz,
                rme: task.result.rme
            };
        }
    });
    return results;
}

function generateMarkdownSummary(previousResults, currentResults) {
    let summary = '### 📊 VBAN Packet Performance\n\n';
    summary += '| Benchmark | Previous | Current | Change |\n';
    summary += '|-----------|----------|---------|--------|\n';

    for (const name in currentResults) {
        const current = currentResults[name];
        const previous = previousResults[name];
        const currentValue = Math.round(current.hz).toLocaleString('en-US');

        let changeStr = '➖';
        let previousValue = 'N/A';

        if (previous) {
            previousValue = Math.round(previous.hz).toLocaleString('en-US');
            const change = ((current.hz - previous.hz) / previous.hz) * 100;
            if (change > 2) {
                changeStr = `🚀 **+${change.toFixed(2)}%**`;
            } else if (change < -2) {
                changeStr = `🐢 **${change.toFixed(2)}%**`;
            }
        }

        summary += `| ${name} | \`${previousValue} ops/sec\` | \`${currentValue} ops/sec\` (±${current.rme.toFixed(2)}%) | ${changeStr} |\n`;
    }

    return summary;
}

const testPackets = [
    {
        description: 'ping packet',
        base64Packet:
            'VkJBTmAAAABWQkFOIFNlcnZpY2UAAAAAAwAAACAAAAABAwEAAAAAAAAAAABwFwAAQMQKAEroOQADAQEJAAAAAAAAAAAAAAAAAAAAAGZyLWZyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbXktcGMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZCLUF1ZGlvIFNvZnR3YXJlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWb2ljZW1lZXRlciBQb3RhdG8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbXktcGMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    },
    {
        description: 'audio packet',
        base64Packet:
            'VkJBTgNmAQFTdHJlYW0yAAAAAAAAAAAAmgcAAAABCAEGARABAQEMAQABCgEGARIBEAEdAREBHQELARgBCQEWAQYBEgEJARcBDAEZAQIBDwEAAQ8BCwEYAQoBFwEHARUBFAEgARIBHgEAAQ0B+wAGAfgABQH2AAAB+QABAfYA/gDoAOsA4QDiAOYA5QDiAN0A0gDNAMUAvwDAALkAwAC6AMEAuwDHAMEAygDGAMIAvgC2ALIArgCrAKoApACpAKQAsACpALEApwCtAKQArQCjAKcAngCgAJkAnwCYAJkAlQCOAIsAhgCDAIQAgwCFAIMAfwB9AIEAgACCAIEAcgBxAG0AbQBuAG0AawBrAHUAdgB7AHoAdgB3AHgAeQB9AH0AfQB+AHsAewB8AHsAeAB5AHgAdgB5AHkAdQB3AHIAcgBxAHQAcQBzAG4AbQBjAGUAZgBhAHAAawBvAGoAawBgAGYAXwBgAFcAYQBYAGUAXwBiAFgAXQBWAF8AWgBlAF4AaABiAGYAYQBoAGEAagBkAG4AZQByAGgAcgBqAHQAaQBwAGkAcgBsAHcAcABxAG8AdgBxAHwAeQA='
    },
    {
        description: 'serial packet',
        base64Packet: 'VkJBTi4AAABDb21tYW5kMQAAAAAAAAAAIAAAALBrAA=='
    },
    {
        description: 'text packet',
        base64Packet: 'VkJBTlIAABBDb21tYW5kMQAAAAAAAAAAAgAAAHRlc3Q7'
    }
];

async function main() {
    const shouldUpdateCache = process.argv.includes('--update-cache');
    const bench = new Bench();

    for (const { description, base64Packet } of testPackets) {
        const packetBuffer = Buffer.from(base64Packet, 'base64');

        const packet = VBANProtocolFactory.processPacket(packetBuffer);
        bench
            .add(`Parsing (${description})`, () => {
                VBANProtocolFactory.processPacket(packetBuffer);
            })
            .add(`Conversion (${description})`, () => {
                packet.toUDPPacket();
            });
    }

    console.error(`Benchmark Starts`);
    await bench.run();

    console.error('Benchmarks complete.');

    // Process and save results
    const currentResults = formatResults(bench.tasks);
    const previousResults = getPreviousResults();

    const table = bench.table();
    console.table(
        bench.tasks.map((task) => {
            const formattedTask = table.find((t) => t['Task name'] === task.name);
            const previous = previousResults[task.name];
            let changeStr = '➖';
            let previousValue = 'N/A';

            if (previous) {
                previousValue = Math.round(previous.hz).toLocaleString('en-US');
                const change = ((task.result.hz - previous.hz) / previous.hz) * 100;
                if (change > 2) {
                    changeStr = `🚀 +${change.toFixed(2)}%`;
                } else if (change < -2) {
                    changeStr = `🐢 ${change.toFixed(2)}%`;
                }
            }

            return {
                ...formattedTask,
                'Previous (ops/sec)': previousValue,
                Change: changeStr
            };
        })
    );

    // Generate the Markdown summary for the CI/PR comment
    const markdownSummary = generateMarkdownSummary(previousResults, currentResults);
    fs.writeFileSync(SUMMARY_FILE, markdownSummary, 'utf-8');
    console.error(`Benchmark summary written to ${SUMMARY_FILE}`);

    if (shouldUpdateCache) {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(currentResults, null, 2), 'utf-8');
        console.error(`Benchmark cache updated at ${CACHE_FILE}`);
    }
}

main().catch(console.error);
