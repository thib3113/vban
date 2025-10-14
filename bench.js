import { Bench } from 'tinybench';
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
    for (const task of tasks) {
        if (task.result) {
            results[task.name] = {
                hz: task.result.hz,
                rme: task.result.rme
            };
        }
    }
    return results;
}
function generateComparisonSummary(mainResults, prResults) {
    let summary = '### 📊 VBAN Packet Performance (PR vs Main)\n\n';
    summary += '| Benchmark | Main Branch | PR Branch | Change |\n';
    summary += '|-----------|-------------|-----------|--------|\n';

    for (const name in prResults) {
        const pr = prResults[name];
        const main = mainResults[name];
        const prValue = `${Math.round(pr.hz).toLocaleString('en-US')} ops/sec (±${pr.rme.toFixed(2)}%)`;

        let changeStr = '➖';
        let mainValue = 'N/A';

        if (main) {
            mainValue = `${Math.round(main.hz).toLocaleString('en-US')} ops/sec`;
            const change = ((pr.hz - main.hz) / main.hz) * 100;
            if (change > 2) {
                changeStr = `🚀 **+${change.toFixed(2)}%**`;
            } else if (change < -2) {
                changeStr = `🐢 **${change.toFixed(2)}%**`;
            }
        }
        summary += `| ${name} | \`${mainValue}\` | \`${prValue}\` | ${changeStr} |\n`;
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

async function runBenchmarks(VBANProtocolFactory, benchSuffix = '') {
    const bench = new Bench({
        iterations: 100000
    });

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

    await bench.run();
    return bench;
}

async function main() {
    const args = process.argv.slice(2);
    const isComparison = args.includes('--compare');

    if (isComparison) {
        const prPath = path.resolve(args[args.indexOf('--compare') + 1]);
        const mainPath = path.resolve(args[args.indexOf('--compare') + 2]);

        console.error(`Comparing PR build at ${prPath} with Main build at ${mainPath}`);

        const PR_VBAN = await import(path.join(prPath, 'index.mjs'));
        const MAIN_VBAN = await import(path.join(mainPath, 'index.mjs'));

        console.error('Benchmarking Main branch version...');
        const mainResults = formatResults((await runBenchmarks(MAIN_VBAN.VBANProtocolFactory, 'main')).tasks);

        console.error('Benchmarking PR branch version...');
        const prResults = formatResults((await runBenchmarks(PR_VBAN.VBANProtocolFactory, 'current')).tasks);

        const summary = generateComparisonSummary(mainResults, prResults);
        console.log(summary); // For local viewing
        fs.writeFileSync(SUMMARY_FILE, summary, 'utf-8');
        console.error(`Comparison summary written to ${SUMMARY_FILE}`);
    } else {
        // Standard run (for cache update or local check)
        const { VBANProtocolFactory } = await import('./lib/index.mjs');
        const bench = await runBenchmarks(VBANProtocolFactory);

        console.table(bench.table());
    }
}

await main();
