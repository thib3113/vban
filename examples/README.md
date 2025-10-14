# VBAN Library Examples

This directory contains a set of examples to demonstrate how to use the `vban` Node.js library. The examples are divided into two categories: `simple` and `advanced`.

## Project Setup
Before running any examples, make sure you have installed all dependencies from the root of the project using pnpm:

```
# From the project root directory
pnpm install
```

This will install the main library dependencies as well as any dependencies required by the examples (like speaker).

### `/simple` Examples
These examples are designed to be straightforward and easy to understand. They cover the basic functionalities of the library, such as sending and receiving different types of VBAN packets on the main thread. They are perfect for getting started and understanding the core concepts.

#### How to Run Simple Examples
Navigate to this examples directory and run the desired script using Node.js.
```
# Example: running the receiver
cd simple/receive-any && npm i && npm start

# Example: sending a text packet
cd simple/send-text && npm i && npm start
```

#### Examples List:
- `receive-any`: A basic server that listens for any VBAN packet on port 6980 and prints a summary to the console.
- `send-text`: Sends a simple "Hello VBAN" text packet to localhost:6980.
- `send-midi`: Sends a MIDI CC (Control Change) command as a VBAN SERIAL packet.
- `send-voicemeeter-query`: Demonstrates how to query a Voicemeeter parameter by sending a specific text command (`Strip[0].Gain = ?;`).
- `manual-usage`: Shows the low-level functions of the library to manually convert a packet object to a Buffer and parse a Buffer back into a packet object, without starting a VBANServer.

### `/advanced` Examples (Worker Threads)

These examples showcase more complex, performance-oriented architectures suitable for production applications. They use Worker Threads to handle all VBAN networking (VBANServer) in a separate thread.

#### Why Use Worker Threads?
Node.js is single-threaded. Intensive tasks like continuous network I/O for real-time audio can block the main event loop, making an application unresponsive. By moving the VBANServer to a worker thread, we ensure that the main thread remains free for other tasks, such as user interface updates, file I/O, or complex calculations. This results in a much more responsive and stable application, especially when dealing with high-frequency data like audio streams.
How to Run Advanced Examples

For each advanced example, you must run the main.js script. It will automatically spawn the corresponding worker.js.
```
# Example: running the audio player
cd advanced/receive-audio-and-play && npm i && npm start

# Example: running the debug dumper and saving to a file
cd advanced/debug-dumper && npm i && npm start ./my-vban-dump.json
```

#### Examples List:
- `chat`: A little chat, that allow to talk with VBAN chat
- `receive-audio-and-play`: The worker receives VBAN audio packets, and the main thread plays the audio stream directly to your speakers using the speaker library and display a VU meter in the console
- `midi-logger`: A specific logger where the worker filters for VBAN SERIAL packets (MIDI) and sends them to the main thread to be displayed in the console.
- `debug-dumper`: A powerful debugging tool. The worker forwards every raw packet to the main thread. The main thread displays a summary. If a file path is provided as a command-line argument, it saves all received packets into that JSON file upon closing the process (Ctrl+C).
