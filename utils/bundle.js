import exit from "./exit.js"
import esbuild from "esbuild"

export default async (input, output, removeTmpDir) => {
	try {
		await esbuild.build({
			entryPoints: [input],
			outfile: output,
			bundle: true,
			minify: true,
			platform: "node",
			format: "cjs",
			sourcemap: false,
			logLevel: "silent",
		})
	} catch (error) {
		await removeTmpDir()
		exit(error, "Bundle Error")
	}
}
