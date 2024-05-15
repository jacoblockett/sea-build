import fs from "node:fs/promises"
import { temporaryDirectory } from "tempy"
import exit from "./exit.js"
import exists from "./exists.js"

/**
 * Creates a temporary directory using tempy, and also creates an async disposal function for convenience.
 *
 * @param {import("tempy").DirectoryOptions} [options] The options as defined by tempy
 * @returns {Promise<[string, () => Promise<void>]>} The temporary directory path and the async disposal function respectively.
 */
export default async options => {
	try {
		const tmpDir = await temporaryDirectory(options)
		const removeTmpDir = async () => {
			if (await exists(tmpDir)) {
				await fs.rm(tmpDir, { recursive: true })
			}
		}

		return [tmpDir, removeTmpDir]
	} catch (error) {
		exit(error.message, "Unknown Error")
	}
}
