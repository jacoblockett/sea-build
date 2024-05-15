import fs from "node:fs/promises"
import isDirectory from "./isDirectory.js"
import path from "node:path"
import exists from "./exists.js"

/**
 * Copies the given file or directory and all of its contents from the given path name into the new path name.
 *
 * @param {string} from The path of the directory or file to copy
 * @param {string} to The destination path of the copied directory/file
 * @param {string[]} [exclude] Paths to exclude when copying a directory. Paths will be joined and resolved in the context of the 'from' path.
 */
export default async (from, to, exclude = []) => {
	from = path.resolve(from)
	to = path.resolve(to)
	exclude = exclude.map(e => path.resolve(path.join(from, e)))

	if (!(await exists(to))) {
		await fs.mkdir(to, { recursive: true })
	} else if (!(await isDirectory(to))) {
		throw new Error(`Expected 'to' to be a directory path`)
	}

	let filesToCopy = [{ absolutePath: from, relativePath: path.basename(from) }]

	while (filesToCopy.length) {
		const { absolutePath, relativePath } = filesToCopy.shift()

		if (exclude.includes(absolutePath)) continue

		if (await isDirectory(absolutePath)) {
			const children = (await fs.readdir(absolutePath)).map(childPath => {
				const absPath = path.join(absolutePath, childPath)
				const relPath = path.join(relativePath, childPath)

				return { absolutePath: absPath, relativePath: relPath }
			})
			filesToCopy = [...children, ...filesToCopy]

			await fs.mkdir(path.join(to, relativePath), { recursive: true })
		} else {
			await fs.copyFile(absolutePath, path.join(to, relativePath))
		}
	}
}
