import fs from "node:fs/promises"

/**
 * Tests if the given path exists on the filesystem.
 *
 * @param {string} path The path to the file or directory to test
 * @returns {Promise<boolean>}
 */
export default async path => {
	try {
		await fs.stat(path)

		return true
	} catch (error) {
		return false
	}
}
