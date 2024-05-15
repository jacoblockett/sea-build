import { execSync } from "node:child_process"

/**
 * Tests if the given command succeeds or fails.
 *
 * @param {string} command The command to pass to `execSync`
 * @returns {Promise<boolean>}
 */
export default command => {
	try {
		execSync(command, { stdio: "ignore" })

		return true
	} catch (error) {
		return false
	}
}
