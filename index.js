#!/usr/bin/env node

import { program } from "commander"
import pj from "postject"
import fs from "node:fs/promises"
import path from "node:path"
import { execSync } from "node:child_process"
import os from "node:os"
import exit from "./utils/exit.js"
import bundle from "./utils/bundle.js"
import temporaryDirectory from "./utils/temporaryDirectory.js"
import hasCommand from "./utils/hasCommand.js"
import exists from "./utils/exists.js"
import isDirectory from "./utils/isDirectory.js"
import copy from "./utils/copy.js"

program
	.name("sea")
	.version("0.0.1", "-v, --version", "Output the version number")
	.description(
		"A wrapper around creating a single executable application (https://nodejs.org/api/single-executable-applications.html)",
	)
	.argument("<entry-point>", "The filename of the entrypoint to the Node.js application")
	.option(
		"-n, --name <name>",
		"The name the script should have after processing. (default: The name of the entry-point file)",
	)
	.option("-o, --output <output-dir>", "The directory to place the exectutable", process.cwd())
	.option(
		"-w, --enable-experimental-sea-warning",
		"Produces a warning exclaiming this process is experimental",
		false,
	)
	.option(
		"-s, --use-snapshot",
		"Enables the use of V8 snapshots for faster startup times by precompiling the script",
		false,
	)
	.option(
		"-c, --use-code-cache",
		"Enables the use of code caching to improve startup performance by caching the compiled code",
		false,
	)
	.option(
		"-a, --assets <asset-paths...>",
		"Paths to any assets needed for the executable. All assets will take the name of the file target of the given path",
		[],
	)
	.action(
		async (
			entryPoint,
			{ name, enableExperimentalSeaWarning, useSnapshot, useCodeCache, output, assets },
		) => {
			// Validate and resolve given arguments and options
			// Assign .js extension to entryPoint if not already on it
			if (!/\.js$/i.test(entryPoint)) {
				entryPoint = `${entryPoint}.js`
			}

			if (!name) {
				// Get the script name of the entryPoint argument as the default script name for the executable
				name = path.basename(entryPoint, ".js")
			} else {
				// If provided, get the script name of the given name by sanitizing the extension and absolute path
				const nameExt = path.extname(name)
				name = path.basename(name, nameExt)
			}

			// Resolve the given arguments into filepaths
			entryPoint = path.resolve(entryPoint)
			output = path.resolve(output)

			// Assign more semantic names
			let entryPointDirectory = path.dirname(entryPoint)
			let entryPointFilename = entryPoint
			const executableScriptName = `${name}${os.platform() === "win32" ? ".exe" : ""}`
			const destinationDirectory = output

			// Create a temporary directory
			const [tmpDir, removeTmpDir] = await temporaryDirectory()

			try {
				// Validate that the entryPointFilename and destinationDirectory paths exist
				if (!(await exists(entryPointFilename))) {
					await removeTmpDir()
					exit(`'${entryPointFilename}' does not exist`, "Reference Error")
				}
				if (!(await exists(destinationDirectory))) {
					await removeTmpDir()
					exit(`'${destinationDirectory}' does not exist`, "Reference Error")
				}

				// Check if destinationDirectory is a directory
				if (!(await isDirectory(destinationDirectory))) {
					await removeTmpDir()
					exit(`'${output}' is not a directory`, "Error")
				}

				// Try to reconstruct, build, and bundle the application into a single CommonJS file
				// Copy all files in the directory of the entry point file given
				await copy(entryPointDirectory, tmpDir, [
					"package-lock.json",
					"pnpm-lock.yaml",
					"yarn.lock",
					"node_modules",
				])

				// Re-point the entry point filepaths to the copied temp files
				entryPointDirectory = path.join(tmpDir, path.basename(entryPointDirectory))
				entryPointFilename = path.join(entryPointDirectory, path.basename(entryPointFilename))

				// Re-install packages if needed
				if (await exists(path.join(entryPointDirectory, "package.json"))) {
					// Check if npm is installed
					if (!hasCommand("npm -v")) {
						await removeTmpDir()
						exit("npm must be installed globally on your system", "Resource Error")
					}

					execSync(`npm install`, { cwd: entryPointDirectory })
				}

				// Bundle the program into CommonJS
				const bundledFileName = path.join(tmpDir, path.basename(entryPointFilename))
				await bundle(entryPointFilename, bundledFileName, removeTmpDir)

				// Resolve all of the asset paths and create assets object
				const assetsObj = {}

				for (const asset of assets) {
					const assetPath = path.resolve(asset)

					if (!(await exists(assetPath))) {
						await removeTmpDir()
						exit(`'${assetPath}' does not exist`, "Reference Error")
					}

					const assetName = path.basename(assetPath)

					if (assetsObj[assetName]) {
						await removeTmpDir()
						exit(`'${assetName}' has been declared multiple times`, "Error")
					}

					assetsObj[assetName] = assetPath
				}

				// Create 'sea' files
				const seaJSONFilename = path.join(tmpDir, "sea-config.json")
				const seaBLOBFilename = path.join(tmpDir, "sea-prep.blob")
				const seaConfig = {
					main: bundledFileName,
					output: seaBLOBFilename,
					disableExperimentalSEAWarning: !enableExperimentalSeaWarning,
					useSnapshot,
					useCodeCache,
					assets: assetsObj,
				}

				await fs.writeFile(seaJSONFilename, JSON.stringify(seaConfig))

				execSync(`node --experimental-sea-config ${seaJSONFilename}`, { stdio: "ignore" })

				// Create the executable file
				const exeFilename = path.join(tmpDir, executableScriptName)
				await fs.copyFile(process.execPath, exeFilename)

				// Inject the BLOB data into the executable
				await pj.inject(exeFilename, "NODE_SEA_BLOB", await fs.readFile(seaBLOBFilename), {
					sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
					machoSegmentName: os.platform() === "darwin" ? " --macho-segment-name NODE_SEA" : "", // Necessary for macOS
				})

				// Copy the temporary exectuable into the desired output path
				await fs.copyFile(exeFilename, path.join(destinationDirectory, executableScriptName))

				// Remove the temporary files
				await removeTmpDir()

				exit(
					`✅ '${executableScriptName}' has been successfully written to ${destinationDirectory}`,
				)
			} catch (error) {
				await removeTmpDir()
				console.error(error)
				// exit(error, "Unknown Error")
			}
		},
	)
	.configureOutput({
		// Prevent default output on process exit by Commander.js
		outputError: () => "",
	})
	.parseAsync()
