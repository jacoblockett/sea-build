import fs from "node:fs/promises"

/**
 * Tests if the given path is a directory on the filesystem.
 *
 * @param {string} path The path to the potential directory to test
 * @returns {Promise<boolean>}
 */
export default async path => {
	try {
		const stats = await fs.stat(path)

		return stats.isDirectory()
	} catch (error) {
		return false
	}
}
