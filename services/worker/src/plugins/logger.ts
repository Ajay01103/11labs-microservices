import fp from "fastify-plugin"
import type { FastifyInstance } from "fastify"

export function buildLoggerConfig(): Record<string, unknown> {
	const isDev = process.env.NODE_ENV !== "production"
	const level = process.env.LOG_LEVEL || (isDev ? "debug" : "info")

	if (!isDev) {
		return { level }
	}

	return {
		level,
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				colorizeObjects: true,
				translateTime: "SYS:HH:MM:ss.l",
				ignore: "pid,hostname",
				messageFormat: "\x1b[36m[worker]\x1b[0m {msg}",
				errorLikeObjectKeys: ["err", "error"],
				singleLine: true,
				levelFirst: true,
			},
		},
	}
}

async function loggerHooks(app: FastifyInstance) {
	app.addHook("onRequest", async (request) => {
		request.log.debug(
			{
				method: request.method,
				url: request.url,
				ip: request.ip,
			},
			"incoming request",
		)
	})

	app.addHook("onResponse", async (request, reply) => {
		const statusCode = reply.statusCode
		const logFn =
			statusCode >= 500
				? request.log.error.bind(request.log)
				: statusCode >= 400
					? request.log.warn.bind(request.log)
					: request.log.info.bind(request.log)

		logFn(
			{
				method: request.method,
				url: request.url,
				statusCode,
				responseTime: reply.elapsedTime.toFixed(2) + "ms",
			},
			"request completed",
		)
	})

	app.addHook("onError", async (request, _reply, error) => {
		request.log.error(
			{
				method: request.method,
				url: request.url,
				err: {
					message: error.message,
					stack: error.stack,
					code: (error as NodeJS.ErrnoException).code,
				},
			},
			"request error",
		)
	})
}

export const loggerPlugin = fp(loggerHooks, { name: "logger" })
