# sea-build

A quick-n-dirty CLI app that builds your Node.js application into a [single executable application](https://nodejs.org/api/single-executable-applications.html).

This has only been tested on my Windows 11 machine using node version 22.1.0. Your mileage may vary, but I'm happy to work with you to debug and troubleshoot.

> ⚠️ No attempt at signature support was made. If your application needs to be signed, you can use `codesign` on macOS or `signtool` on Windows.

### Known Limitations and Issues

* I was unable to get the `useSnapshot` option to work. Didn't look into it too much. The core functionality is implemented for you to try, but if anyone knows why using this throws an error please do share!

* Currently, this method can only compile CommonJS code. If your code uses anything that esbuild cannot compile correctly into CommonJS, such as top-level `await`, the build will fail.

* Using `pnpm` often caused any bundler I tried to crap itself. To this end, just to make things simple, this program will automatically re-install all dependencies using `npm`. Love it or hate it, but it's all in a temp directory so whatever. Your original codebase will be unaffected.

### Installation

```bash
npm i -g sea-build
```

### Usage

```bash
sea-build path/to/my/script/index.js -n awesome-app
```

### API

```txt
Usage: sea [options] <entry-point>

A wrapper around creating a single executable application (https://nodejs.org/api/single-executable-applications.html)

Arguments:
  entry-point                            The filename of the entrypoint to the Node.js application

Options:
  -v, --version                          Output the version number
  -n, --name <name>                      The name the script should have after processing. (default: The name of the entry-point file)
  -o, --output <output-dir>              The directory to place the exectutable (default: "C:\\devapps\\nodejs\\sea-build")
  -w, --enable-experimental-sea-warning  Produces a warning exclaiming this process is experimental (default: false)
  -s, --use-snapshot                     Enables the use of V8 snapshots for faster startup times by precompiling the script (default: false)
  -c, --use-code-cache                   Enables the use of code caching to improve startup performance by caching the compiled code (default: false)
  -a, --assets <asset-paths...>          Paths to any assets needed for the executable. All assets will take the name of the file target of the given path (default: [])
  -h, --help                             display help for command
```